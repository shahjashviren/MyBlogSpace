import { site } from "@/lib/site";
import {
  GithubIcon,
  InstagramIcon,
  LeetcodeIcon,
  LinkedinIcon,
  MailIcon,
  SubstackIcon,
  XIcon,
} from "@/components/icons";

export default function ConnectSection() {
  const links = [
    { id: "github", label: "GitHub", href: site.links.github || "#", Icon: GithubIcon },
    { id: "linkedin", label: "LinkedIn", href: site.links.linkedin || "#", Icon: LinkedinIcon },
    { id: "leetcode", label: "LeetCode", href: site.links.leetcode || "#", Icon: LeetcodeIcon },
    { id: "substack", label: "Substack", href: site.links.substack || "#", Icon: SubstackIcon },
    { id: "instagram", label: "Instagram", href: site.links.instagram || "#", Icon: InstagramIcon },
  ];

  return (
    <section className="section connect" id="connect">
      <div className="connect-panel glass">
        <div className="section-head">
          <p className="kicker">Say hello</p>
          <h2>Let&apos;s Connect!</h2>
          <p className="section-sub">
            Whether it&apos;s code, ideas, or just a hello — I&apos;d love to hear from
            you.
          </p>
        </div>

        <div className="connect-row">
          {links.map(({ id, label, href, Icon }) => (
            <a
              key={id}
              className="social-btn glass"
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
            >
              <Icon />
              <span>{label}</span>
            </a>
          ))}

          <span
            className="social-btn glass is-coming-soon"
            aria-label="X profile — coming soon"
          >
            <XIcon />
            <span>X</span>
            <span className="soon-tip">Coming soon</span>
          </span>

          {site.links.email ? (
            <a
              className="social-btn glass is-primary"
              href={`mailto:${site.links.email}`}
            >
              <MailIcon />
              <span>Email me</span>
            </a>
          ) : (
            <span className="social-btn glass is-primary is-coming-soon">
              <MailIcon />
              <span>Email me</span>
              <span className="soon-tip">Coming soon</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
