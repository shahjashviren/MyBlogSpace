"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CommentSection from "@/components/CommentSection";
import Lightbox from "@/components/Lightbox";
import { fetchLikeCount, incrementLike, usePost } from "@/lib/store";
import { resolveHtmlImages } from "@/lib/uploads";

function BackArrow() {
  return (
    <Link href="/blogs" className="post-back">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      <span>Back to all posts</span>
    </Link>
  );
}

/** Renders rich post HTML: resolves fallback images, hydrates video blocks,
 *  and makes inline images open in the lightbox. */
function RichBody({
  html,
  onImages,
}: {
  html: string;
  onImages: (urls: string[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = useState(html);

  useEffect(() => {
    let alive = true;
    resolveHtmlImages(html).then((r) => {
      if (alive) setResolved(r);
    });
    return () => {
      alive = false;
    };
  }, [html]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // Hydrate video placeholder blocks into real players.
    root.querySelectorAll<HTMLDivElement>("div[data-video-embed]").forEach((el) => {
      if (el.dataset.hydrated) return;
      el.dataset.hydrated = "1";
      const kind = el.getAttribute("kind") ?? "youtube";
      const embed = el.getAttribute("embed") ?? "";
      if (!embed) return;
      if (kind === "file") {
        const v = document.createElement("video");
        v.src = embed;
        v.controls = true;
        v.preload = "metadata";
        v.className = "video-player";
        el.replaceChildren(v);
      } else {
        const f = document.createElement("iframe");
        f.src = embed;
        f.className = "video-player";
        f.title = "Embedded video";
        f.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        f.setAttribute("allowfullscreen", "");
        el.replaceChildren(f);
      }
      el.classList.add("is-live");
    });

    // Collect inline images for the lightbox (skip empty/placeholder srcs).
    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"))
      .map((i) => i.src)
      .filter((s) => s && !s.endsWith("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"));
    onImages(imgs);
  }, [resolved, onImages]);

  return <div ref={ref} className="post-rich" dangerouslySetInnerHTML={{ __html: resolved }} />;
}

export default function PostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { post, loading } = usePost(slug);

  const [lightbox, setLightbox] = useState<number | null>(null);
  const [contentImgs, setContentImgs] = useState<string[]>([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!post) return;
    void (async () => {
      setLikes(await fetchLikeCount(post.id));
      try {
        setLiked(localStorage.getItem(`liked-${post.id}`) === "1");
      } catch {
        /* ignore */
      }
    })();
  }, [post?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const like = async () => {
    if (!post || liked) return;
    try {
      await incrementLike(post.id);
      setLikes((l) => l + 1);
      setLiked(true);
      localStorage.setItem(`liked-${post.id}`, "1");
    } catch {
      /* rules pending */
    }
  };

  if (!post && loading) {
    return (
      <main className="post-page">
        <div className="section">
          <p className="muted">Loading…</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="post-page">
        <div className="section post-missing">
          <h1>This post isn&apos;t here.</h1>
          <p className="muted">It may have been unpublished or the link is off.</p>
          <BackArrow />
        </div>
      </main>
    );
  }

  const paragraphs = post.body.split("\n\n").filter((p) => p.trim());
  const lightboxList =
    contentImgs.length > 0 ? contentImgs : post.images ?? [];
  const lightboxSrc = lightbox !== null ? lightboxList[lightbox] : null;

  return (
    <main className="post-page">
      <article className="section post-article">
        <BackArrow />

        <header className="post-head">
          <div className="post-meta">
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
            <time>{post.date}</time>
            <span className="reading-chip">{post.readingTime} min read</span>
          </div>
          <h1>{post.title}</h1>
        </header>

        {post.bodyHtml ? (
          <div
            className="post-body"
            onClick={(e) => {
              const t = e.target as HTMLElement;
              if (t.tagName === "IMG" && lightboxList.length > 0) {
                const idx = lightboxList.indexOf((t as HTMLImageElement).src);
                if (idx >= 0) setLightbox(idx);
              }
            }}
          >
            <RichBody html={post.bodyHtml} onImages={setContentImgs} />
          </div>
        ) : (
          <div className="post-body">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {!post.bodyHtml && post.images.length > 0 && (
          <div className="post-images">
            {post.images.map((src, i) => (
              <button
                key={i}
                type="button"
                className="post-image"
                onClick={() => setLightbox(i)}
                aria-label={`Open image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="post-foot">
          <button type="button" className={`like-btn ${liked ? "is-liked" : ""}`} onClick={like}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
            {likes}
          </button>
        </div>

        <CommentSection postId={post.id} />
      </article>

      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          index={lightbox ?? 0}
          count={lightboxList.length}
          onClose={() => setLightbox(null)}
          onNav={(dir) =>
            setLightbox((i) =>
              i === null ? null : (i + dir + lightboxList.length) % lightboxList.length
            )
          }
        />
      )}
    </main>
  );
}
