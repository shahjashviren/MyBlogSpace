"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";

const CYCLE_MS = 6000;

/**
 * Two-photo slideshow, tuned for "very very smooth":
 *  – 1.7s eased dip-to-blur crossfade between slides
 *  – Ken Burns zoom loops forever on each inner image (alternate),
 *    so transitions never snap
 *  – Story-style progress bars synced to the 6s cycle
 *  – Hovering the frame pauses the cycle (and the bars)
 *  – Falls back to an elegant monogram plate until photo-1/photo-2.jpg
 *    exist in public/images/
 */
export default function PhotoSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState<boolean[]>(site.photos.map(() => false));

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % site.photos.length);
    }, CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [index, paused]);

  return (
    <div
      className={`slideshow ${paused ? "is-paused" : ""}`}
      role="img"
      aria-label="Photographs of Jash Shah"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div className="slideshow-frame">
        {site.photos.map((src, i) => {
          const active = i === index;
          if (failed[i]) {
            return (
              <div
                key={`missing-${i}`}
                className={`slide slide-missing ${active ? "is-active" : ""}`}
                aria-hidden={!active}
              >
                <span className="slide-monogram">JS</span>
                <span className="slide-hint">
                  drop <code>photo-{i + 1}.jpg</code> into{" "}
                  <code>public/images/</code>
                </span>
              </div>
            );
          }
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
                onError={() =>
                  setFailed((f) => {
                    const next = [...f];
                    next[i] = true;
                    return next;
                  })
                }
              />
            </div>
          );
        })}

        <div className="slideshow-progress" aria-hidden="true">
          {site.photos.map((_, i) => (
            <span
              key={i}
              className={`bar ${i < index ? "is-done" : ""} ${
                i === index ? "is-active" : ""
              }`}
            >
              {i === index && <i key={`fill-${index}`} />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
