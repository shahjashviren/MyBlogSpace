import { site } from "@/lib/site";

const nowList = [
  "Building this site — and writing about every step",
  "Learning systems design, one concept explained in public at a time",
  "Reading widely outside tech: history, design, and human stories",
];

export default function About() {
  return (
    <section className="section" id="about">
      <div className="section-head">
        <p className="kicker">Who I am</p>
        <h2>About</h2>
      </div>

      <div className="about-grid">
        <div className="about-copy">
          <p>
            Hi, I&apos;m {site.firstName} — a learner, builder, and note-taker.
            This site is my BlogSpace: a documented journey where I try things,
            break things, and write down what I learn so the next person (and
            future me) gets a shortcut.
          </p>
          <p className="muted">
            Expect honest build logs, experiments with small but real scope,
            and reflections that don&apos;t pretend to be tutorials unless they
            actually are one.
          </p>
        </div>

        <aside className="now-card glass">
          <h3>Now</h3>
          <ul className="now-list">
            {nowList.map((item) => (
              <li key={item}>
                <span className="now-dot" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
