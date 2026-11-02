import { writingPreview } from "@/lib/data";

export default function WritingSection() {
  return (
    <section className="section" id="writing">
      <div className="section-head">
        <p className="kicker">The journal</p>
        <h2>My Blog Posts</h2>
        <p className="section-sub">
          Grouped as albums — every post wears its reading time like a byline.
        </p>
      </div>

      <div className="writing-list">
        {writingPreview.map((post) => (
          <article key={post.title} className="writing-row glass">
            <div className="writing-meta">
              <time>{post.date}</time>
              <span className="reading-chip">{post.readingTime} min read</span>
            </div>
            <div className="writing-body">
              <h3>{post.title}</h3>
              <p className="muted">{post.excerpt}</p>
              <div className="tag-row">
                {post.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="section-note">
        The full archive opens with the first entries — everything here is
        editable from the owner dashboard.
      </p>
    </section>
  );
}
