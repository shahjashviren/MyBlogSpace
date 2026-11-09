"use client";

import { useEffect, useRef, useState } from "react";
import { useProjects, useSettings } from "@/lib/store";
import { statusLabel, type Project } from "@/lib/types";
import { resolveImageSrc } from "@/lib/uploads";

const TAU = Math.PI * 2;

/* Red flicker field — deterministic seed so SSR and client match.
   Each digit drifts, blinks in/out, and randomly flips 0↔1 while you watch. */
type Flick = {
  left: number;
  top: number;
  size: number;
  drift: number;
  blink: number;
  delay: number;
  blinkDelay: number;
  cls: string;
  ch: string;
};

function buildField(): Flick[] {
  let seed = 20261106;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  // Jittered grid: dense edge-to-edge coverage (no empty gaps), digits placed
  // on a coarse grid with per-cell jitter so the field reads as "live code".
  const COLS = 34;
  const ROWS = 24;
  const cells: Flick[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (rnd() < 0.03) continue; // sparse holes keep it organic, not wallpaper
      const r = rnd();
      cells.push({
        left: 1 + ((col + 0.15 + rnd() * 0.7) / COLS) * 98,
        top: 2 + ((row + 0.15 + rnd() * 0.7) / ROWS) * 95,
        size: 16 + rnd() * 6,
        drift: 9 + rnd() * 8,
        blink: 2.4 + rnd() * 2.6,
        delay: -rnd() * 12,
        blinkDelay: -rnd() * 5,
        cls: r > 0.86 ? "is-spark" : r > 0.48 ? "" : "is-dim",
        ch: rnd() > 0.5 ? "1" : "0",
      });
    }
  }
  return cells;
}
const FIELD = buildField();

type Node =
  | { kind: "project"; project: Project; key: string }
  | { kind: "ghost"; key: string };

type Pt = { x: number; y: number; depth: number; scale: number; rotY: number; z: number };

function ExternalArrow() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

/* ------------------------------- modal -------------------------------- */

/** Resolve the project thumbnail for the modal's faded backdrop. */
function useFadedBg(url?: string) {
  const [src, setSrc] = useState<string | null>(
    url && url.startsWith("http") ? url : null
  );
  useEffect(() => {
    if (!url || url.startsWith("http")) return;
    let alive = true;
    resolveImageSrc(url).then((r) => {
      if (alive && r) setSrc(r);
    });
    return () => {
      alive = false;
    };
  }, [url]);
  return src;
}

function ProjectModal({
  node,
  onClose,
}: {
  node: Node | null;
  onClose: () => void;
}) {
  const bg = useFadedBg(
    node && node.kind === "project" ? node.project.thumbnail : undefined
  );

  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "ArrowLeft") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [node, onClose]);

  if (!node) return null;

  const isProject = node.kind === "project";
  const p = isProject ? node.project : null;
  const name = p?.name ?? "Your project";
  const paragraphs = (p?.description ?? "")
    .split("\n\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-screen">
        <div className="modal-chrome">
          <button type="button" className="modal-back" onClick={onClose} aria-label="Back">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            <span>Back</span>
          </button>
          <span className="modal-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="modal-url">
            {isProject ? `${slugHost(p!)}` : "blogspace.app"}
          </span>
        </div>

        <div
          className={`modal-body${bg ? " has-bg" : ""}`}
          style={
            bg
              ? ({
                  "--modal-bg": `url("${bg}")`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <div className="modal-head">
            {isProject && p ? (
              <span className={`status-chip status-${p.status}`}>
                {statusLabel[p.status]}
              </span>
            ) : (
              <span className="status-chip">Empty slot</span>
            )}
            <h3>{name}</h3>
          </div>

          {isProject && paragraphs.length > 0 ? (
            <>
              <h4>About the project</h4>
              {paragraphs.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </>
          ) : (
            <div className="modal-empty">
              <p>
                This laptop is waiting for its project. The owner adds one
                from the dashboard — name, story, links and thumbnail — and
                it appears here instantly.
              </p>
            </div>
          )}

          {isProject && p && (p.githubUrl || p.liveUrl) ? (
            <div className="modal-links">
              {p.githubUrl ? (
                <a href={p.githubUrl} target="_blank" rel="noreferrer noopener">
                  GitHub repository <ExternalArrow />
                </a>
              ) : null}
              {p.liveUrl ? (
                <a href={p.liveUrl} target="_blank" rel="noreferrer noopener">
                  Live site <ExternalArrow />
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Close
            </button>
            {isProject && p && p.liveUrl ? (
              <a
                className="btn-gold"
                href={p.liveUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                Explore the project <ExternalArrow />
              </a>
            ) : isProject && p && p.githubUrl ? (
              <a
                className="btn-gold"
                href={p.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                Explore the project <ExternalArrow />
              </a>
            ) : (
              <span className="btn-gold is-disabled">Explore the project</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function slugHost(p: Project): string {
  try {
    if (p.liveUrl) return new URL(p.liveUrl).host;
  } catch {
    /* relative or empty */
  }
  return `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "project"}.app`;
}

/* --------------------------- solar system ------------------------------ */

export default function SolarProjects() {
  const { items: projects } = useProjects();
  const settings = useSettings();
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 860, h: 560 });
  const [rotation, setRotation] = useState(-Math.PI / 2);
  const [active, setActive] = useState<Node | null>(null);
  const [glyphs, setGlyphs] = useState<string[]>(() => FIELD.map((f) => f.ch));

  /* flip random digits 0↔1 — the "hacking" pulse (static when reduced-motion) */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const iv = setInterval(() => {
      setGlyphs((prev) => {
        const next = prev.slice();
        const flips = 4 + ((Math.random() * 5) | 0);
        for (let k = 0; k < flips; k++) {
          const i = (Math.random() * next.length) | 0;
          next[i] = next[i] === "0" ? "1" : "0";
        }
        return next;
      });
    }, 60);
    return () => clearInterval(iv);
  }, []);

  const dragRef = useRef({
    down: false,
    moved: 0,
    lastX: 0,
    vel: 0,
    startX: 0,
    startY: 0,
    pid: 0,
    captured: false,
  });

  /* responsive stage */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  /* gentle auto-drift + inertia */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(48, t - last);
      last = t;
      const d = dragRef.current;
      if (!d.down) {
        if (Math.abs(d.vel) > 0.00004) {
          setRotation((r) => r + d.vel * dt);
          d.vel *= 0.94;
        } else {
          setRotation((r) => r + 0.000075 * dt); // slow orbit
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const d = dragRef.current;
    d.down = true;
    d.moved = 0;
    d.lastX = e.clientX;
    d.startX = e.clientX;
    d.startY = e.clientY;
    d.vel = 0;
    d.pid = e.pointerId;
    d.captured = false;
    // NOTE: no setPointerCapture here — capturing on press retargets the
    // click away from the laptop button (project-open bug). Capture lazily.
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.down) return;
    const dx = e.clientX - d.lastX;
    d.lastX = e.clientX;
    d.moved += Math.abs(dx);
    if (!d.captured) {
      if (d.moved <= 6) return; // jitter — not a drag yet
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(d.pid);
      } catch {
        /* pointer gone */
      }
      d.captured = true;
    }
    const delta = dx * 0.006;
    setRotation((r) => r + delta);
    d.vel = delta / 16;
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    d.down = false;
    if (d.captured) {
      try {
        const el = stageRef.current;
        if (el && el.hasPointerCapture(d.pid)) el.releasePointerCapture(d.pid);
      } catch {
        /* ignore */
      }
      d.captured = false;
    }
  };

  /* geometry */
  const nodes: Node[] = [
    ...projects.map((p) => ({ kind: "project" as const, project: p, key: p.id })),
    ...Array.from({ length: Math.max(0, 3 - projects.length) }, (_, i) => ({
      kind: "ghost" as const,
      key: `ghost-${i}`,
    })),
  ];
  const n = Math.max(1, nodes.length);

  const cx = size.w / 2;
  const cy = size.h / 2;
  const rx = Math.min(size.w * 0.35, 450);
  const ry = Math.min(size.h * 0.3, 240);

  const positions: Pt[] = nodes.map((_, i) => {
    const a = rotation + (i / n) * TAU;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const depth = (sin + 1) / 2; // 0 far (top) → 1 near (bottom)
    return {
      x: cx + rx * cos,
      y: cy + ry * sin,
      depth,
      scale: 0.74 + 0.34 * depth,
      rotY: -cos * 20,
      z: Math.round(depth * 60),
    };
  });

  const serverPt = { x: cx, y: cy };

  return (
    <section className="section" id="projects">
      <div className="section-head">
        <p className="kicker">Featured</p>
        <h2>{settings.headingProjects}</h2>
        <p className="section-sub">
          White laptops orbit the datacenter server while red code drifts
          and flips across a black field — drag to spin, click a screen to
          open it.
        </p>
      </div>

      <div
        ref={stageRef}
        className="solar-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* red flicker field — drifting, blinking, flipping 0↔1 */}
        <div className="flick-field" aria-hidden="true">
          {FIELD.map((f, i) => (
            <span
              key={`flick-${i}`}
              className={`flick ${f.cls}`}
              style={{
                left: `${f.left}%`,
                top: `${f.top}%`,
                fontSize: `${f.size}px`,
                animationDuration: `${f.drift}s, ${f.blink}s`,
                animationDelay: `${f.delay}s, ${f.blinkDelay}s`,
              }}
            >
              {glyphs[i]}
            </span>
          ))}
        </div>

        {/* lightning connections */}
        <svg className="lightning" width={size.w} height={size.h} aria-hidden="true">
          {positions.map((p, i) => {
            const mx = (serverPt.x + p.x) / 2;
            const my = (serverPt.y + p.y) / 2;
            const nx = -(p.y - serverPt.y);
            const ny = p.x - serverPt.x;
            const len = Math.hypot(nx, ny) || 1;
            const bow = 26 * Math.sin(i * 2.1 + 1.3);
            const qx = mx + (nx / len) * bow;
            const qy = my + (ny / len) * bow;
            return (
              <g key={`bolt-${nodes[i].key}`}>
                <path
                  className="bolt bolt-dim"
                  d={`M ${serverPt.x} ${serverPt.y} Q ${qx} ${qy} ${p.x} ${p.y}`}
                />
                <path
                  className="bolt bolt-live"
                  d={`M ${serverPt.x} ${serverPt.y} Q ${qx} ${qy} ${p.x} ${p.y}`}
                  style={{ animationDelay: `${i * -0.9}s` }}
                />
              </g>
            );
          })}
        </svg>

        {/* the server — blue datacenter rack with live traffic bars */}
        <div className="server-node" style={{ left: cx, top: cy }} aria-hidden="true">
          <span className="server-glow" />
          <span className="css-rack">
            <span className="rack-face">
              <span className="rack-slits">
                <i />
                <i />
                <i />
              </span>
              <span className="rack-units">
                {[0, 1, 2, 3].map((u) => (
                  <span className="rack-unit" key={u}>
                    <i className="rack-led" />
                    <b />
                  </span>
                ))}
              </span>
              <span className="rack-vents">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
            <span className="rack-foot" />
          </span>
          <span className="server-label">server</span>
        </div>

        {/* laptops */}
        {nodes.map((node, i) => {
          const p = positions[i];
          const isGhost = node.kind === "ghost";
          const project = isGhost ? null : node.project;
          const name = project?.name ?? "Your project";
          const thumb = project?.thumbnail;
          const letter = name.trim().charAt(0).toUpperCase() || "+";

          return (
            <button
              key={node.key}
              type="button"
              className={`orbit-laptop ${isGhost ? "is-ghost" : ""}`}
              style={{
                left: p.x,
                top: p.y,
                zIndex: 10 + p.z,
                transform: `translate(-50%, -50%) rotateY(${p.rotY}deg) scale(${p.scale})`,
                filter: `brightness(${0.72 + 0.28 * p.depth})`,
              }}
              onClick={(e) => {
                // ignore real drags (straight-line displacement), allow taps
                const d = dragRef.current;
                if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 8)
                  return;
                setActive(node);
              }}
              aria-label={`Open project: ${name}`}
            >
              <span className="laptop-name">{name}</span>
              <span className="laptop">
                <span className="laptop-screen">
                  <span className="laptop-bezel">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" />
                    ) : isGhost ? (
                      <span className="plate plate-ghost">
                        <b>+</b>
                      </span>
                    ) : (
                      <span className="plate">{letter}</span>
                    )}
                  </span>
                </span>
                <span className="laptop-keys" aria-hidden="true" />
                <span className="laptop-base" />
              </span>
            </button>
          );
        })}
      </div>

      <ProjectModal node={active} onClose={() => setActive(null)} />
    </section>
  );
}
