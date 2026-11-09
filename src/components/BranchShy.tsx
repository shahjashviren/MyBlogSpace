"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shy tree branch — a small CANOPY peeking in from the hero's right edge:
 * several sub-branches, clustered leaves, a few berries. When the cursor
 * comes near, it slides back into the pane and returns after ~3.5s.
 */
const LEAF_D = "M0 0 C5 -7 14 -9 19 -5 C14 3 5 5 0 0 Z";

/** clustered leaf placements: [x, y, rotation, tone] (tone 0=deep,1=mid,2=light) */
const LEAVES: [number, number, number, number][] = [
  // main-branch canopy (upper sweep)
  [232, 40, -42, 0], [218, 30, -18, 1], [210, 52, -64, 2],
  [196, 44, 24, 0], [188, 62, -34, 1], [176, 52, -70, 0],
  [168, 72, 18, 2], [156, 62, -46, 1], [148, 82, -14, 0],
  [136, 74, 32, 1], [128, 92, -52, 2], [116, 86, 8, 0],
  [104, 100, -36, 1], [92, 108, 40, 0], [80, 116, -20, 1],
  [68, 124, 28, 2], [56, 132, -44, 0],
  // upper twig cluster
  [192, 26, -66, 2], [174, 34, -30, 0],
  // lower droop cluster
  [142, 96, 54, 1], [124, 104, 22, 2], [108, 112, -28, 0],
  [90, 124, 46, 1],
];
const TONES = ["#2f9e6e", "#3fae7d", "#63c695"];

export default function BranchShy() {
  const [peeked, setPeeked] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* clear the return-timer ONLY on unmount — re-running the proximity
     effect must never cancel a pending re-appearance (that was the bug). */
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  /* light theme ONLY — peek when the hero lands, and whenever the theme
     flips to light; never show in dark mode. */
  useEffect(() => {
    const isLight = () =>
      document.documentElement.dataset.theme === "light";
    const t = setTimeout(() => {
      if (isLight()) setPeeked(true);
    }, 700);
    const mo = new MutationObserver(() => {
      if (isLight()) setPeeked(true);
      else setPeeked(false);
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      clearTimeout(t);
      mo.disconnect();
    };
  }, []);

  /* cursor proximity → retreat → return after 3.5s */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: MouseEvent) => {
      const el = branchRef.current;
      if (!el || !peeked || hiddenRef.current) return;
      const r = el.getBoundingClientRect();
      const pad = 48;
      const near =
        e.clientX > r.left - pad &&
        e.clientX < r.right + pad &&
        e.clientY > r.top - pad &&
        e.clientY < r.bottom + pad;
      if (!near) return;
      hiddenRef.current = true;
      setPeeked(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        hiddenRef.current = false;
        if (document.documentElement.dataset.theme === "light") {
          setPeeked(true);
        }
      }, 3500);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [peeked]);

  return (
    <div
      ref={branchRef}
      className={`shy-branch ${peeked ? "is-out" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 300 170" fill="none">
        {/* main bough entering from the right edge */}
        <path
          d="M302 22 C262 40 226 52 196 74 C168 95 140 106 108 122 C88 132 66 141 42 147"
          stroke="#6b4a2f"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* sub-branches → canopy, not a stick */}
        <path d="M240 44 C228 30 214 22 198 18" stroke="#6b4a2f" strokeWidth="4" strokeLinecap="round" />
        <path d="M204 66 C196 52 186 44 172 40" stroke="#7a5637" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M158 92 C154 78 150 70 142 62" stroke="#6b4a2f" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M132 104 C136 116 140 124 146 134" stroke="#7a5637" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M96 124 C96 134 94 142 90 152" stroke="#6b4a2f" strokeWidth="3" strokeLinecap="round" />

        {/* dense leaf clusters */}
        <g>
          {LEAVES.map(([x, y, r, tone], i) => (
            <path
              key={i}
              d={LEAF_D}
              transform={`translate(${x} ${y}) rotate(${r})`}
              fill={TONES[tone]}
            />
          ))}
        </g>

        {/* a few berries — one amber, two deep red */}
        <g>
          <path d="M150 86 L146 78" stroke="#6b4a2f" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="144" cy="91" r="7" fill="#e8a33d" />
          <path d="M141.5 88.5 C142.5 87.5 144 87 145.5 87.3" stroke="#ffd9a0" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M198 58 L201 51" stroke="#6b4a2f" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="203" cy="63" r="5.6" fill="#c2413b" />
          <path d="M112 106 L109 99" stroke="#6b4a2f" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="107" cy="111" r="5.2" fill="#c2413b" />
        </g>
      </svg>
    </div>
  );
}
