"use client";

import { useSettings } from "@/lib/store";

/** Tiny leaf marker — hand-drawn feel, never a dot. */
function LeafMark() {
  // clean hollow leaf — outline + midrib, reads clearly at 15px
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 19C5 12 10 5.5 19.5 4.5C20.5 14 15 19.5 5 19Z" />
      <path d="M5.5 18.5L168" strokeWidth="1.5" />
      <path d="M9.5 15.5L9.8 11.8M13.2 12.6L14.6 9.6" strokeWidth="1.3" />
    </svg>
  );
}

/** First paragraph may open with the gold "Hello Everyone!" greeting. */
function renderParagraph(text: string, index: number) {
  const greeting = "Hello Everyone!";
  if (index === 0 && text.startsWith(greeting)) {
    return (
      <>
        <span className="accent">{greeting}</span>
        {text.slice(greeting.length)}
      </>
    );
  }
  return text;
}

export default function About() {
  const settings = useSettings();
  const paragraphs = (settings.aboutBody ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="section" id="about">
      <div className="section-head">
        <p className="kicker">{settings.kickerAbout}</p>
        <h2>{settings.aboutHeading}</h2>
      </div>

      <div className="about-grid">
        <div className="about-copy">
          {paragraphs.map((p, i) => (
            <p key={i}>{renderParagraph(p, i)}</p>
          ))}
        </div>

        <aside className="now-card hobbies-card glass">
          <h3>{settings.hobbiesTitle || "Off the clock"}</h3>
          <ul className="hobbies-list">
            {(settings.hobbiesBody || "")
              .split("\n")
              .map((h) => h.trim())
              .filter(Boolean)
              .map((item) => (
                <li key={item}>
                  <LeafMark />
                  {item}
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
