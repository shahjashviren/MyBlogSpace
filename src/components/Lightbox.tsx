"use client";

import { useEffect } from "react";

/** Full-screen image viewer — arrows via click zones, Esc closes. */
export default function Lightbox({
  src,
  index,
  count,
  onClose,
  onNav,
}: {
  src: string;
  index: number;
  count: number;
  onClose: () => void;
  onNav: (dir: 1 | -1) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "ArrowLeft") onNav(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [onClose, onNav]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      {count > 1 && (
        <>
          <button
            type="button"
            className="lightbox-nav is-prev"
            onClick={() => onNav(-1)}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-nav is-next"
            onClick={() => onNav(1)}
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="lightbox-img" />
      <span className="lightbox-count">
        {index + 1} / {count}
      </span>
    </div>
  );
}
