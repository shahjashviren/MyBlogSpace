"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePosts } from "@/lib/store";
import { resolveImageSrc } from "@/lib/uploads";
import { stripHtml } from "@/lib/types";
import type { Post } from "@/lib/types";

/** Cover image: explicit cover → first image in the body → none. */
function firstBodyImage(html?: string): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src="([^"]+)"/);
  return m ? m[1] : null;
}

function CoverThumb({ post }: { post: Post }) {
  const raw0 = post.cover || firstBodyImage(post.bodyHtml) || "";
  // https covers (Cloudinary) render immediately — even in SSR.
  const [src, setSrc] = useState<string | null>(
    raw0.startsWith("http") ? raw0 : null
  );
  useEffect(() => {
    const raw = post.cover || firstBodyImage(post.bodyHtml);
    if (!raw || raw.startsWith("http")) return; // already set
    let alive = true;
    resolveImageSrc(raw).then((r) => {
      if (alive && r) setSrc(r);
    });
    return () => {
      alive = false;
    };
  }, [post.cover, post.bodyHtml]);
  if (!src) return null;
  return (
    <span className="blog-card-cover">
      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary keeps exact editorial crops */}
      <img src={src} alt="" loading="lazy" />
    </span>
  );
}

type Sort = "latest" | "oldest";
type View = "grid" | "list";

function excerptOf(body: string): string {
  const first = body.split("\n\n")[0]?.replace(/\s+/g, " ").trim() ?? "";
  return first.length > 200 ? `${first.slice(0, 197)}…` : first;
}

function BackArrow() {
  return (
    <Link href="/" className="post-back blogs-back">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      <span>Back to home</span>
    </Link>
  );
}

export default function BlogsPage() {
  const { posts } = usePosts();
  const [sort, setSort] = useState<Sort>("latest");
  const [view, setView] = useState<View>("grid");

  const sorted = useMemo(() => {
    const copy = [...posts];
    copy.sort((a, b) =>
      sort === "latest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    );
    return copy;
  }, [posts, sort]);

  return (
    <main className="blogs-page">
      <BackArrow />
      <section className="section">
        <div className="section-head blogs-head">
          <p className="kicker">The archive</p>
          <h2>My BlogSpace</h2>
          <p className="section-sub">
            Every post I&apos;ve written, newest ideas first — pick a view that
            suits your reading.
          </p>
        </div>

        <div className="blogs-toolbar glass">
          <div className="toolbar-group">
            <span className="toolbar-label">Sort by</span>
            <div className="seg" role="group" aria-label="Sort posts">
              <button
                type="button"
                className={sort === "latest" ? "is-on" : ""}
                onClick={() => setSort("latest")}
              >
                Latest
              </button>
              <button
                type="button"
                className={sort === "oldest" ? "is-on" : ""}
                onClick={() => setSort("oldest")}
              >
                Oldest
              </button>
            </div>
          </div>
          <div className="toolbar-group">
            <span className="toolbar-label">View</span>
            <div className="seg" role="group" aria-label="View mode">
              <button
                type="button"
                className={view === "grid" ? "is-on" : ""}
                onClick={() => setView("grid")}
              >
                Grids
              </button>
              <button
                type="button"
                className={view === "list" ? "is-on" : ""}
                onClick={() => setView("list")}
              >
                Lists
              </button>
            </div>
          </div>
        </div>

        <div className={`blogs-grid is-${view}`}>
          {sorted.map((post) => (
            <Link
              key={post.id}
              href={`/blogs/${post.slug}`}
              className={`blog-card glass ${view === "list" ? "is-row" : ""}`}
            >
              <CoverThumb post={post} />
              <div className="blog-card-meta">
                <time>{post.date}</time>
                <span className="reading-chip">{post.readingTime} min read</span>
                {post.category
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
                .slice(0, 3)
                .map((c) => (
                  <span key={c} className="tag">
                    {c}
                  </span>
                ))}
              </div>
              <h3>{post.title}</h3>
              <p className="muted">
                {excerptOf(post.bodyHtml ? stripHtml(post.bodyHtml) : post.body)}
              </p>
              <span className="row-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
          {sorted.length === 0 ? (
            <p className="muted blogs-empty">No posts published yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
