import { site } from "@/lib/site";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { label: "About", href: "#about" },
  { label: "Writing", href: "#writing" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Connect", href: "#connect" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/">
          {site.name}
        </Link>

        <nav className="site-nav" aria-label="Main">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
