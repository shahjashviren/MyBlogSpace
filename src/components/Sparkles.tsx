"use client";

import { useEffect, useRef } from "react";

/**
 * Gold sparkles emitted FROM the slideshow's bottom-right corner:
 * particles are born in a tight cluster at the corner, drift upward
 * with a gentle sway, twinkle, fade out, and are reborn at the corner.
 * Respects prefers-reduced-motion (one static frame, no motion).
 */
export default function Sparkles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    type Spark = {
      born: number; // ms timestamp
      life: number; // total ms
      ox: number; // origin x (corner cluster)
      oy: number; // origin y (corner cluster)
      vy: number; // upward speed px/ms
      sway: number;
      swaySpeed: number;
      phase: number;
      r: number;
      base: number; // peak opacity
    };

    let sparks: Spark[] = [];
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;

    const spawn = (w0: number, h0: number, stagger = false): Spark => {
      // Tight cluster at the BOTTOM-RIGHT corner, biased hard into it
      const rx = Math.pow(Math.random(), 1.7); // 0..1 → biased to 0
      const ry = Math.pow(Math.random(), 1.7);
      const ox = w0 - 6 - rx * w0 * 0.62;
      const oy = h0 - 4 - ry * h0 * 0.4;
      const life = 5200 + Math.random() * 5200;
      return {
        born: performance.now() + (stagger ? Math.random() * life : 0),
        life,
        ox,
        oy,
        vy: 0.028 + Math.random() * 0.05,
        sway: 5 + Math.random() * 14,
        swaySpeed: 0.6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        r: 0.6 + Math.random() * 1.6,
        base: 0.3 + Math.random() * 0.55,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(46, Math.max(22, w / 7)));
      sparks = Array.from({ length: count }, () => spawn(w, h, true));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      for (const s of sparks) {
        let age = t - s.born;
        if (age > s.life) {
          Object.assign(s, spawn(w, h));
          age = 0;
        }
        if (age < 0) continue; // staggered birth

        const p = age / s.life; // 0..1 progress
        // Envelope: quick fade-in, long graceful fade-out
        const envelope = Math.sin(Math.min(1, p * 1.15) * Math.PI) ** 1.4;
        const twinkle = reduced ? 0.85 : 0.6 + 0.4 * Math.sin(t * 0.002 * s.swaySpeed + s.phase);
        const a = s.base * envelope * twinkle;
        if (a <= 0.01) continue;

        const rise = reduced ? 0 : s.vy * age;
        const x = s.ox + (reduced ? 0 : Math.sin(age * 0.001 * s.swaySpeed + s.phase) * s.sway);
        const y = s.oy - rise;

        // halo
        const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 4.5);
        const isLight = document.documentElement.dataset.theme === "light";
        const c0 = isLight ? "87, 163, 119" : "240, 205, 140";
        g.addColorStop(0, `rgba(${c0}, ${a})`);
        g.addColorStop(1, `rgba(${c0}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 4.5, 0, Math.PI * 2);
        ctx.fill();

        // core
        const coreLight = document.documentElement.dataset.theme === "light";
        ctx.fillStyle = coreLight
          ? `rgba(240, 250, 244, ${Math.min(1, a * 1.5)})`
          : `rgba(255, 238, 205, ${Math.min(1, a * 1.5)})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced && running) raf = requestAnimationFrame(draw);
    };

    resize();
    draw(performance.now());

    const onResize = () => {
      resize();
      if (reduced) draw(performance.now());
    };
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced && !running) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="sparkles" aria-hidden="true" />;
}
