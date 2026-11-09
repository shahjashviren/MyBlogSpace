"use client";

import { useEffect, useRef } from "react";

/**
 * Green leaf cursor trail — light theme, home page, free background only.
 * Leaves bloom where the cursor has been, drift, spin and fade.
 * Off for touch devices and prefers-reduced-motion.
 */
const GREENS = ["#2f7d57", "#3d8f63", "#57a377", "#0b6b4c", "#6fb58c"];
const MAX_LIVE = 22;
const SPAWN_EVERY = 22; // px of travel — present but never excessive

type Leaf = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  size: number;
  born: number;
  life: number;
  color: string;
};

/** Elements that are NOT "free background" — no leaves over content. */
const BLOCKED =
  "a, button, input, textarea, select, label, h1, h2, h3, h4, p, li, blockquote, pre, code, iframe, video, img, svg, canvas, nav, header, footer, .glass, .writing-row, .blog-card, .social-btn, .hero-link, .slideshow-dock, .sparkles, .now-card, .connect-panel, .rte, .post-rich";

export default function LeafTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let leaves: Leaf[] = [];
    let raf = 0;
    let lastX = -999;
    let lastY = -999;
    let running = false;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (x: number, y: number) => {
      if (leaves.length >= MAX_LIVE) return;
      leaves.push({
        x: x + (Math.random() * 8 - 4),
        y: y + (Math.random() * 8 - 4),
        vx: (Math.random() - 0.5) * 0.55,
        vy: 0.18 + Math.random() * 0.4,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.045,
        size: 9 + Math.random() * 8,
        born: performance.now(),
        life: 1150 + Math.random() * 500,
        color: GREENS[(Math.random() * GREENS.length) | 0],
      });
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const drawLeaf = (l: Leaf, alpha: number) => {
      const s = l.size;
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.85, 0, 0, s);
      ctx.quadraticCurveTo(-s * 0.85, 0, 0, -s);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = "rgba(10, 40, 28, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(0, s * 0.85);
      ctx.stroke();
      ctx.restore();
    };

    const tick = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      leaves = leaves.filter((l) => now - l.born < l.life);
      for (const l of leaves) {
        const t = (now - l.born) / l.life;
        l.x += l.vx + Math.sin(t * Math.PI * 2 + l.born) * 0.22;
        l.y += l.vy;
        l.rot += l.spin;
        const alpha = t < 0.05 ? t / 0.05 : 1 - (t - 0.05) / 0.95;
        drawLeaf(l, Math.max(0, alpha) * 0.9);
      }
      if (leaves.length > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (document.documentElement.dataset.theme !== "light") return;
      // Only on the home page
      if (window.location.pathname !== "/") return;

      const target = e.target as Element | null;
      if (target && typeof target.closest === "function" && target.closest(BLOCKED)) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);
      if (dist < 7) return;
      // fill the whole travel segment so fast flicks never leave gaps
      const steps = Math.min(6, Math.floor(dist / SPAWN_EVERY));
      if (steps === 0) {
        lastX = e.clientX;
        lastY = e.clientY;
        spawn(e.clientX, e.clientY);
        return;
      }
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        spawn(lastX + dx * t, lastY + dy * t);
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      leaves = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="leaf-trail"
      aria-hidden="true"
    />
  );
}
