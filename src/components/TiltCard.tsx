"use client";

import { useRef, type ReactNode } from "react";

/**
 * 3D cursor-tilt project card: perspective tilt toward the pointer,
 * a gold glow that follows the cursor, layered depth. Touch devices
 * get a calm static card (no tilt), reduced-motion respected.
 */
export default function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    el.style.setProperty("--rx", `${(-py * 9).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 11).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
    el.classList.add("is-tilting");
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className={`tilt-scene ${className}`}>
      <div
        ref={ref}
        className="tilt-card"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <span className="tilt-glow" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
