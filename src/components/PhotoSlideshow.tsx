"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { loadSettings } from "@/lib/store";

const CYCLE_MS = 6000;

/**
 * Two-photo slideshow: 1.7s dip-to-blur crossfade, looping Ken Burns,
 * story-style progress bars, hover pause. Photos come from the owner
 * dashboard (Firestore) when uploaded, else local photo-1/photo-2.jpg,
 * else an elegant monogram plate.
 */
export default function PhotoSlideshow() {
  // SSR renders slide 0; the saved position is restored right after
  // hydration (async → no hydration mismatch → no "1 Issue" console error).
  const [index, setIndex] = useState(0);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const saved = Number(sessionStorage.getItem("hero-slide") || "0");
        if (Number.isFinite(saved) && saved > 0) setIndex(saved);
      } catch {
        /* private mode */
      }
    });
  }, []);
  const [paused, setPaused] = useState(false);
  const [custom, setCustom] = useState<string[]>([]);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  // Persist position across theme switches & page navigation.
  useEffect(() => {
    try {
      sessionStorage.setItem("hero-slide", String(index));
    } catch {
      /* ignore */
    }
  }, [index]);

  useEffect(() => {
    let alive = true;
    loadSettings()
      .then((s) => {
        if (alive && s.heroPhotos.length >= 1) setCustom(s.heroPhotos);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const sources = custom.length >= 1 ? custom : site.photos;
  const count = Math.max(1, sources.length);
  const idx = index % count; // safe even while custom photos stream in

  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setTimeout(() => {
      setIndex((i) => i + 1);
    }, CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [idx, paused, count]);

  const activeSrc = sources[idx];
  const showFallback = failed[activeSrc] || !activeSrc;

  return (
    <div
      className={`slideshow ${paused ? "is-paused" : ""}`}
      role="img"
      aria-label="Photographs of Jash Shah"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="slideshow-frame">
        {showFallback ? (
          <div className="slide slide-missing is-active">
            <span className="slide-monogram">JS</span>
            <span className="slide-hint">
              add your photos from the owner dashboard
            </span>
          </div>
        ) : (
          sources.map((src, i) => {
            if (failed[src]) return null;
            const active = i === idx; // ← must be the modulo, not raw index
            return (
              <div
                key={src}
                className={`slide ${active ? "is-active" : ""}`}
                aria-hidden={!active}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="slide-img"
                  src={src}
                  alt={`Jash Shah — photograph ${i + 1}`}
                  style={{ animationDelay: `${i * -7.5}s` }}
                  onError={() => setFailed((f) => ({ ...f, [src]: true }))}
                />
              </div>
            );
          })
        )}

        <div className="slideshow-progress" aria-hidden="true">
          {sources.map((src, i) => (
            <span
              key={src}
              className={`bar ${i < idx ? "is-done" : ""} ${
                i === idx && !showFallback ? "is-active" : ""
              }`}
            >
              {i === idx && !showFallback && <i key={`fill-${idx}`} />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
