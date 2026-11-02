import TiltCard from "@/components/TiltCard";
import { projects, statusLabel, type Project } from "@/lib/data";

function ProjectVisual({ project }: { project: Project }) {
  return (
    <div className="project-visual">
      <div className="project-chrome" aria-hidden="true">
        <span className="chrome-dot" />
        <span className="chrome-dot" />
        <span className="chrome-dot" />
        <span className="chrome-url">
          {project.name.toLowerCase().replace(/\s+/g, "")}.app
        </span>
      </div>
      {project.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={project.image} alt={`${project.name} landing page`} />
      ) : (
        <div className="project-plate" aria-hidden="true">
          <span className="plate-mono">B</span>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  if (project.slot) {
    return (
      <TiltCard className="is-slot">
        <div className="project-slot">
          <span className="slot-plus" aria-hidden="true">
            +
          </span>
          <h3>Your project goes here</h3>
          <p className="muted">
            Add it from the owner dashboard with a landing-page screenshot —
            it will appear right on this shelf.
          </p>
        </div>
      </TiltCard>
    );
  }

  return (
    <TiltCard>
      <ProjectVisual project={project} />
      <div className="project-body">
        <div className="project-title-row">
          <h3>{project.name}</h3>
          <span className={`status-chip status-${project.status}`}>
            {statusLabel[project.status]}
          </span>
        </div>
        <p className="muted">{project.blurb}</p>
        {project.url ? (
          <a
            className="project-link"
            href={project.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            Visit site →
          </a>
        ) : null}
      </div>
    </TiltCard>
  );
}

export default function ProjectsSection() {
  return (
    <section className="section" id="projects">
      <div className="section-head">
        <p className="kicker">Featured</p>
        <h2>Projects</h2>
        <p className="section-sub">
          A small shelf of real things — maintained, renovated, or honestly
          retired. Nothing fake lives here.
        </p>
      </div>

      <div className="projects-grid">
        {projects.map((p, i) =>
          p.slot ? (
            <ProjectCard key={`slot-${i}`} project={p} />
          ) : (
            <ProjectCard key={p.name} project={p} />
          )
        )}
      </div>
    </section>
  );
}
