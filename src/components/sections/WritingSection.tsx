"use client";

import Link from "next/link";
import { usePosts, useSettings } from "@/lib/store";
import { stripHtml } from "@/lib/types";

function excerptOf(body: string): string {
  const first = body.split("\n\n")[0]?.replace(/\s+/g, " ").trim() ?? "";
  return first.length > 170 ? `${first.slice(0, 167)}…` : first;
}

export default function WritingSection() {
  const { posts } = usePosts();
  const settings = useSettings();

  const latest = [...posts]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  return (
    <section className="section" id="writing">
      <div className="section-head">
        <p className="kicker">The journal</p>
        <h2>{settings.headingWriting}</h2>
        <p className="section-sub">
          Few things that I document from my life every week, that I find
          closer to my heart…
        </p>
      </div>

      <div className="writing-list">
        {latest.map((post) => (
          <Link
            key={post.id}
            href={`/blogs/${post.slug}`}
            className="writing-row glass"
          >
            <div className="writing-meta">
              <time>{post.date}</time>
              <span className="reading-chip">{post.readingTime} min read</span>
            </div>
            <div className="writing-body">
              <h3>{post.title}</h3>
              <p className="muted">
                {excerptOf(post.bodyHtml ? stripHtml(post.bodyHtml) : post.body)}
              </p>
            </div>
            <span className="row-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>

      <Link className="all-blogs" href="/blogs">
        My BlogSpace <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
