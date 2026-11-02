import { experience } from "@/lib/data";

export default function ExperienceSection() {
  return (
    <section className="section" id="experience">
      <div className="section-head">
        <p className="kicker">The path so far</p>
        <h2>Experience</h2>
      </div>

      <div className="xp-list">
        {experience.map((row, i) => (
          <article key={i} className="xp-row">
            <div className="xp-logo" aria-hidden="true">
              {row.monogram}
            </div>
            <div className="xp-body">
              <div className="xp-head">
                <h3>{row.org}</h3>
                {row.example ? <span className="example-chip">Example</span> : null}
              </div>
              <p className="xp-role">{row.role}</p>
              <p className="xp-period muted">{row.period}</p>
              <p className="muted xp-blurb">{row.blurb}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="section-note">
        Real chapters — clubs, teams, internships, freelance work — live here
        once added from the owner dashboard.
      </p>
    </section>
  );
}
