"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ThemeToggle from "./ThemeToggle";

// Absolute paths: from /blogs (or any page) these navigate home AND
// scroll to the section — plain "#about" only works on the homepage.
const NAV = [
  { href: "/#about", label: "About" },
  { href: "/blogs", label: "My Blogs" },
  { href: "/#projects", label: "Projects" },
  { href: "/#experience", label: "Experience" },
  { href: "/#connect", label: "Connect" },
];

/** Header mark — the exact artwork of the browser tab icon (app/icon.svg),
 *  native gold in both themes. */
function WordmarkIcon() {
  return (
    <svg
      className="wordmark-icon"
      viewBox="0 0 64 64"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      {/* golden notebook */}
      <rect x="15" y="9" width="31" height="45" rx="6" stroke="#e9c27a" strokeWidth="4.5" />
      {/* binding rings */}
      <path d="M12 19h7M12 31h7M12 43h7" stroke="#e9c27a" strokeWidth="4" strokeLinecap="round" />
      {/* page lines */}
      <path d="M24 23h15M24 31h15M24 39h9" stroke="#e9c27a" strokeWidth="3.4" strokeLinecap="round" />
      {/* pen */}
      <path d="M39 55 55 33" stroke="#e9c27a" strokeWidth="5" strokeLinecap="round" />
      <path d="M53.5 35.5 59 28l3.5 2.4-6 7.4z" fill="#e9c27a" />
      <path d="M46 46.5l3.6 2.7" stroke="#0b0f16" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setSignedIn(!!u));
  }, []);

  // Keep the pink-accent page scope in sync on client-side navigation (the
  // pre-paint inline script only runs on full loads). /blogs, its posts and
  // the owner dashboard get data-page="blogs"; every other route loses it so
  // the home page and login stay emerald.
  useEffect(() => {
    const p = pathname ?? "";
    if (p === "/blogs" || p.startsWith("/blogs/") || p === "/dashboard") {
      document.documentElement.dataset.page = "blogs";
    } else {
      document.documentElement.removeAttribute("data-page");
    }
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <Link className="wordmark" href="/">
        <WordmarkIcon />
        Jash — My BlogSpace
      </Link>

      <nav className="site-nav" aria-label="Primary">
        {NAV.map((item) =>
          item.href.startsWith("#") ? (
            <a key={item.label} className="nav-link" href={item.href}>
              {item.label}
            </a>
          ) : (
            <Link key={item.label} className="nav-link" href={item.href}>
              {item.label}
            </Link>
          )
        )}
        <ThemeToggle />
        <Link
          className="nav-login"
          href={signedIn ? "/dashboard" : "/login"}
        >
          {signedIn ? "Dashboard" : "Owner login"}
        </Link>
      </nav>
    </header>
  );
}
