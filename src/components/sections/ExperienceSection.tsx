"use client";

import { useEffect, useState } from "react";
import { useExperience, useSettings } from "@/lib/store";
import { resolveImageSrc } from "@/lib/uploads";
import {
  durationLabel,
  monthsBetween,
  rolePeriod,
  type ExperienceRole,
  type ExperienceRow,
} from "@/lib/types";

function OrgLogo({ row }: { row: ExperienceRow }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!row.logo) return;
    let alive = true;
    resolveImageSrc(row.logo).then((r) => {
      if (alive && r) setSrc(r);
    });
    return () => {
      alive = false;
    };
  }, [row.logo]);
  if (!src) return <>{row.monogram}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" />
  );
}

/** Duration depends on "now" — render it only after hydration to keep SSR calm. */
function Duration({ start, end }: { start: string; end?: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    Promise.resolve().then(() => {
      if (start) setLabel(` · ${durationLabel(monthsBetween(start, end))}`);
    });
  }, [start, end]);
  return label ? <span className="xp-dur">{label}</span> : null;
}

/** Org-level span: earliest start → latest end (or Present). */
function OrgSpan({ roles }: { roles: ExperienceRole[] }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    Promise.resolve().then(() => {
      const starts = roles.map((r) => r.start).filter(Boolean);
      if (!starts.length) return;
      const first = starts.slice().sort()[0];
      const anyOpen = roles.some((r) => !r.end);
      const ends = roles.map((r) => r.end).filter(Boolean) as string[];
      const last = anyOpen ? undefined : ends.slice().sort().pop();
      setLabel(
        `${rolePeriod(first, last)} · ${durationLabel(monthsBetween(first, last))}`
      );
    });
  }, [roles]);
  if (!label) return null;
  return <p className="xp-span muted">{label}</p>;
}

/** Two leaves tilting left & right — the stem runs exactly through the
 *  vertical center (x=12) so the timeline rail passes through the leaf
 *  vertex, and each leaf carries its own midrib vein. Leaves spread wide. */
function RailLeaf() {
  return (
    <svg className="xp-leaf" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* stem on the exact center line, meeting the leaf pair at the vertex */}
      <path
        d="M12 21.5V15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* left leaf — spread wider, with midrib vein to the tip */}
      <path
        d="M12 16.5C7 15.5 4 12 3.6 6.8 8.8 7.8 11.8 11.4 12 16.5Z"
        fill="currentColor"
      />
      <path
        d="M11.5 15.4C8.6 13.2 6 10 4.2 7.3"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* right leaf — mirrored, slightly lighter, spread wider */}
      <path
        d="M12 16.5C17 15.5 20 12 20.4 6.8 15.2 7.8 12.2 11.4 12 16.5Z"
        fill="currentColor"
        opacity="0.82"
      />
      <path
        d="M12.5 15.4C15.4 13.2 18 10 19.8 7.3"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export default function ExperienceSection() {
  const { items: experience } = useExperience();
  const settings = useSettings();

  return (
    <section className="section" id="experience">
      <div className="section-head">
        <p className="kicker">The path so far</p>
        <h2>{settings.headingExperience}</h2>
      </div>

      <div className="xp-list has-rail">
        {experience.map((row) => {
          // newest role always first (dated entries sort desc; undated last)
          const roles = (row.roles ?? [])
            .filter((r) => r.title.trim())
            .slice()
            .sort((a, b) => (b.start || "").localeCompare(a.start || ""));
          const structured = roles.length > 0;
          // one role → LinkedIn single (role is the headline);
          // several → LinkedIn org card with a role history inside
          const headline = structured
            ? roles.length > 1
              ? null
              : roles[0].title
            : row.role;

          return (
            <article key={row.id} className="xp-row">
              <RailLeaf />
              <div
                className={`xp-logo ${row.logo ? "has-logo" : ""}`}
                aria-hidden="true"
              >
                <OrgLogo row={row} />
              </div>

              <div className="xp-body">
                <div className="xp-head">
                  <h3>{headline ?? row.org}</h3>
                  {row.example ? <span className="example-chip">Example</span> : null}
                </div>

                {structured ? (
                  roles.length > 1 ? (
                    <>
                      <p className="xp-orgline">
                        {row.location ? (
                          <span className="xp-loc">{row.location}</span>
                        ) : null}
                      </p>
                      <OrgSpan roles={roles} />
                      <div className="xp-roles">
                        {roles.map((r, i) => (
                          <div className="xp-role-entry" key={`${r.title}-${i}`}>
                            <h4>{r.title}</h4>
                            <p className="xp-period muted">
                              {rolePeriod(r.start, r.end)}
                              <Duration start={r.start} end={r.end} />
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="xp-orgline">
                        {row.org}
                        {row.location ? (
                          <span className="xp-loc">{row.location}</span>
                        ) : null}
                      </p>
                      <p className="xp-period muted">
                        {rolePeriod(roles[0].start, roles[0].end)}
                        <Duration start={roles[0].start} end={roles[0].end} />
                      </p>
                    </>
                  )
                ) : (
                  <>
                    {/* legacy rows: role first, LinkedIn-style */}
                    <p className="xp-orgline">
                      {row.org}
                      {row.location ? (
                        <span className="xp-loc">{row.location}</span>
                      ) : null}
                    </p>
                    <p className="xp-period muted">{row.period}</p>
                  </>
                )}

                {row.blurb ? (
                  <p className="muted xp-blurb">{row.blurb}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <p className="section-note">
        Real chapters — clubs, teams, internships, freelance work — live here
        once added from the owner dashboard.
      </p>
    </section>
  );
}
