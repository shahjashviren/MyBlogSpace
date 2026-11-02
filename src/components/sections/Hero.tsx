import { site } from "@/lib/site";
import PhotoSlideshow from "@/components/PhotoSlideshow";
import Sparkles from "@/components/Sparkles";

function HeroLinks() {
  const boxes = [
    {
      id: "linkedin",
      label: "LinkedIn",
      href: site.links.linkedin || "#",
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM.4 8.4h4.2V24H.4V8.4Zm7.1 0h4v2.1h.06c.56-1.06 1.93-2.18 3.97-2.18 4.25 0 5.03 2.8 5.03 6.44V24h-4.2v-7.7c0-1.84-.03-4.2-2.56-4.2-2.56 0-2.95 2-2.95 4.07V24H7.5V8.4Z" />
        </svg>
      ),
    },
    {
      id: "github",
      label: "GitHub",
      href: site.links.github || "#",
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .3.21.67.8.55A10.6 10.6 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
      ),
    },
    {
      id: "leetcode",
      label: "LeetCode",
      href: site.links.leetcode || "#",
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 6 3 12l5 6M16 6l5 6-5 6M13.5 4l-3 16" />
        </svg>
      ),
    },
    {
      id: "email",
      label: "Email",
      href: site.links.email ? `mailto:${site.links.email}` : "#",
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2.5" y="5" width="19" height="14" rx="2" />
          <path d="m3 6.5 9 6.5 9-6.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="hero-links">
      {boxes.map((b) => (
        <a
          key={b.id}
          className="hero-link"
          href={b.href}
          {...(b.href.startsWith("http")
            ? { target: "_blank", rel: "noreferrer noopener" }
            : {})}
        >
          {b.icon}
          <span>{b.label}</span>
        </a>
      ))}
    </div>
  );
}

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-copy">
          <p className="hello">{site.hello}</p>
          <h1>{site.name}</h1>
          <p className="role-line">{site.roleLine}</p>
          <p className="sub-role">{site.subRole}</p>
          <p className="tagline">{site.tagline}</p>
          <HeroLinks />
        </div>

        <div className="hero-portrait">
          <div className="slideshow-dock">
            <PhotoSlideshow />
            <Sparkles />
          </div>
        </div>
      </div>

      <a className="scroll-cue" href="#about" aria-label="Scroll to content">
        <span>Scroll</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
