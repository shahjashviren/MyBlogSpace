"use client";

import { useEffect } from "react";

/**
 * Scroll fade-ins with three safety rules:
 *  1. single-level only — a reveal target never nests inside another,
 *     so content can never be double-hidden;
 *  2. reveal-once-per-session — revisiting a page never re-hides it
 *     (this was the "images disappearing between pages" culprit);
 *  3. safety net — anything already in the viewport is force-revealed
 *     shortly after scan, so an observer hiccup can never leave a
 *     section invisible.
 */
const SELECTOR = [
  ".hero-copy > .hello",
  ".hero-copy > h1",
  ".hero-copy > .role-line",
  ".hero-copy > .tagline",
  ".hero-links",
  ".section",
  ".writing-row",
  ".blog-card",
  ".xp-row",
  ".connect-panel",
  ".now-card",
  ".hobbies-card",
  ".login-card",
  ".stat",
  ".panel-item",
  ".post-head",
  ".post-body",
  ".post-foot",
  ".comments",
  ".solar-stage",
].join(", ");

export default function ScrollReveals() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pathKey = () => `rv:${window.location.pathname}`;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
            try {
              sessionStorage.setItem(pathKey(), "1");
            } catch {
              /* ignore */
            }
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -4% 0px" }
    );

    const seen = new WeakSet<Element>();
    let safety: ReturnType<typeof setTimeout> | null = null;

    const safetyPass = () => {
      if (safety) clearTimeout(safety);
      safety = setTimeout(() => {
        document.querySelectorAll(".reveal-init:not(.in-view)").forEach((el) => {
          const r = el.getBoundingClientRect();
          const vh = window.innerHeight || 0;
          if (r.top < vh && r.bottom > 0) {
            el.classList.add("in-view");
            io.unobserve(el);
          }
        });
      }, 450);
    };

    const scan = () => {
      // Once a page has revealed anything this session, never hide it again.
      try {
        if (sessionStorage.getItem(pathKey()) === "1") return;
      } catch {
        /* ignore */
      }
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        if (el.closest(".reveal-init")) return; // single-level only
        seen.add(el);
        el.classList.add("reveal-init");
        io.observe(el);
      });
      safetyPass();
    };
    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      if (safety) clearTimeout(safety);
    };
  }, []);

  return null;
}
