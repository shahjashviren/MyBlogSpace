"use client";

import { useSyncExternalStore } from "react";

/**
 * Sun/moon theme switch with the PORTAL WIPE transition:
 * a circle of the incoming theme's colour opens from the button itself
 * and sweeps across the whole page; the theme flips at full cover,
 * then the veil dissolves onto the new look.
 * Reduced-motion users get an instant swap.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === "theme") onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

const getSnapshot = () => document.documentElement.dataset.theme ?? "dark";
const getServerSnapshot = () => "dark";

function applyTheme(next: "dark" | "light") {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* private mode */
  }
  emit();
}

let busy = false;

function portalTransition(current: "dark" | "light", btn: HTMLElement) {
  if (busy) return;
  const next = current === "dark" ? "light" : "dark";
  const incoming = next === "light" ? "#f4efe4" : "#060607";

  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const r =
    Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) *
    1.06;

  const el = document.createElement("div");
  el.className = "portal-overlay";
  el.style.setProperty("--px", `${cx}px`);
  el.style.setProperty("--py", `${cy}px`);
  el.style.setProperty("--r", `${Math.round(r)}px`);
  el.style.background = incoming;
  document.body.appendChild(el);

  busy = true;
  document.documentElement.classList.add("iris-lock");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add("is-open");
      window.setTimeout(() => {
        applyTheme(next);
        el.classList.add("is-fade");
        window.setTimeout(() => {
          el.remove();
          document.documentElement.classList.remove("iris-lock");
          busy = false;
        }, 380);
      }, 570);
    });
  });
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      applyTheme(theme === "dark" ? "light" : "dark");
      return;
    }
    portalTransition(theme as "dark" | "light", e.currentTarget);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}
