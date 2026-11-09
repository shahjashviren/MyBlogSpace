"use client";

import { socialUrl } from "@/lib/site";
import { useSettings } from "@/lib/store";
import {
  GithubIcon,
  InstagramIcon,
  LeetcodeIcon,
  LinkedinIcon,
  MailIcon,
  SubstackIcon,
  XIcon,
} from "@/components/icons";

/** Each glyph wears its own brand colour — words stay ink. */
const iconColor: Record<string, string> = {
  github: "#2da44e", // GitHub green
  linkedin: "#0a66c2",
  leetcode: "#ffa116",
  substack: "#ff6719",
  instagram: "#e1306c",
  // X intentionally omitted → inherits ink (white in dark, black in light)
};

export default function ConnectSection() {
  const settings = useSettings();

  const links = [
    { id: "github", label: "GitHub", href: socialUrl("github"), Icon: GithubIcon },
    { id: "linkedin", label: "LinkedIn", href: socialUrl("linkedin"), Icon: LinkedinIcon },
    { id: "leetcode", label: "LeetCode", href: socialUrl("leetcode"), Icon: LeetcodeIcon },
    { id: "substack", label: "Substack", href: socialUrl("substack"), Icon: SubstackIcon },
    { id: "instagram", label: "Instagram", href: socialUrl("instagram"), Icon: InstagramIcon },
    { id: "x", label: "X", href: socialUrl("x"), Icon: XIcon },
  ];

  return (
    <section className="section connect" id="connect">
      <div className="connect-panel glass">
        <div className="section-head">
          <p className="kicker">Say hello</p>
          <h2>{settings.headingConnect}</h2>
          <p className="section-sub">{settings.connectSubtitle}</p>
        </div>

        <div className="connect-row">
          {links.map(({ id, label, href, Icon }) => {
            const inner = (
              <>
                <span className="social-icon" style={{ color: iconColor[id] }}>
                  <Icon />
                </span>
                <span>{label}</span>
              </>
            );
            // No URL yet → disabled chip (never a "#" link that jumps to top).
            return href ? (
              <a
                key={id}
                className="social-btn glass"
                href={href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {inner}
              </a>
            ) : (
              <span key={id} className="social-btn glass is-disabled" aria-disabled="true">
                {inner}
              </span>
            );
          })}

          {socialUrl("email") ? (
            <a
              className="social-btn glass is-primary"
              href={`mailto:${socialUrl("email")}`}
            >
              <span className="social-icon accent-icon">
                <MailIcon />
              </span>
              <span>Email me</span>
            </a>
          ) : (
            <span className="social-btn glass is-primary is-disabled" aria-disabled="true">
              <span className="social-icon accent-icon">
                <MailIcon />
              </span>
              <span>Email me</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
