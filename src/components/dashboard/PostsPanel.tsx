"use client";

import { useEffect, useRef, useState } from "react";
import RichEditor from "@/components/editor/RichEditor";
import { cleanupImage, cleanupPostImages, uploadImage } from "@/lib/uploads";
import { deleteDocById, describeSaveError, savePost, uniqueSlug } from "@/lib/store";
import { stripHtml } from "@/lib/types";
import type { Post } from "@/lib/types";

/** Up to 3 comma-separated categories per post. */
function limitCats(raw: string): string {
  return (
    raw
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(", ") || "journey"
  );
}

type Draft = {
  title: string;
  category: string;
  date: string;
  bodyHtml: string;
  cover: string;
  published: boolean;
};

const empty: Draft = {
  title: "",
  category: "journey",
  date: new Date().toISOString().slice(0, 10),
  bodyHtml: "",
  cover: "",
  published: true,
};

const draftKeyOf = (id: string | null) => (id ? `jash-draft-${id}` : "jash-draft-new");

function readLocalDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft & { savedAt?: number };
    if (typeof parsed.title !== "string" || typeof parsed.bodyHtml !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Rough byte size of the HTML — keeps the owner aware of Firestore's 1 MB cap. */
function htmlKB(html: string): number {
  return Math.max(1, Math.round(new Blob([html]).size / 1024));
}

export default function PostsPanel({
  items,
  onChanged,
}: {
  items: Post[];
  onChanged: () => Promise<unknown> | void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [autosavedAt, setAutosavedAt] = useState<number | null>(null);
  const [localDraftExists, setLocalDraftExists] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draftKey = draftKeyOf(editId);

  // Debounced local autosave while typing.
  useEffect(() => {
    if (!draft) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ ...draft, savedAt: Date.now() })
        );
        setAutosavedAt(Date.now());
        setLocalDraftExists(true);
      } catch {
        /* storage full/blocked — autosave is best-effort */
      }
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, draftKey]);

  const clearDraftCache = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
    setAutosavedAt(null);
    setLocalDraftExists(false);
    setMsg("Local draft cache cleared.");
  };

  const startNew = () => {
    const saved = readLocalDraft("jash-draft-new");
    const restore =
      saved && window.confirm("A local draft exists. Restore it instead of starting fresh?");
    setDraft(restore && saved ? saved : empty);
    setEditId(null);
    setMsg("");
    setAutosavedAt(null);
    setLocalDraftExists(!!saved);
  };

  const startEdit = (p: Post) => {
    const key = draftKeyOf(p.id);
    const saved = readLocalDraft(key);
    const restore =
      saved &&
      window.confirm(
        `An unsaved local draft of “${p.title}” exists. Restore it instead of the published version?`
      );
    setDraft(
      restore && saved
        ? saved
        : {
            title: p.title,
            category: p.category,
            date: p.date,
            bodyHtml: p.bodyHtml ?? "",
            cover: p.cover ?? "",
            published: p.published !== false,
          }
    );
    setEditId(p.id);
    setMsg("");
    setAutosavedAt(null);
    setLocalDraftExists(!!saved);
  };

  const pickCover = async (file: File | undefined) => {
    if (!file || !draft) return;
    setCoverBusy(true);
    try {
      const { url } = await uploadImage(file, "cover");
      setDraft({ ...draft, cover: url });
    } catch {
      setMsg("Cover upload failed — try another image.");
    } finally {
      setCoverBusy(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    const html = draft.bodyHtml;
    const plain = stripHtml(html);
    if (!draft.title.trim() || !plain.trim()) {
      setMsg("Title and body are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const existing = editId ? items.find((p) => p.id === editId) : undefined;
      const slug = existing?.slug ?? uniqueSlug(draft.title);
      await savePost(editId, {
        slug,
        title: draft.title.trim(),
        category: limitCats(draft.category),
        date: draft.date,
        body: plain,
        bodyHtml: html,
        cover: draft.cover,
        images: [],
        published: draft.published,
      });
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
      await onChanged();
      setDraft(null);
      setEditId(null);
      setAutosavedAt(null);
      setLocalDraftExists(false);
      setMsg("Saved ✓ — live on the site.");
    } catch (e) {
      setMsg(
        `Save failed — ${describeSaveError(e)} If this keeps happening, paste the Firestore rules from firestore.rules into the Firebase console.`
      );
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (draft) {
    const words = stripHtml(draft.bodyHtml).split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    const sizeKB = htmlKB(draft.bodyHtml);

    return (
      <div className="editor glass post-editor">
        <h2>{editId ? "Edit post" : "New post"}</h2>

        <label>
          Title
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="A title worth clicking"
          />
        </label>

        <div className="editor-row">
          <label>
            Categories (up to 3, comma-separated)
            <input
              value={draft.category}
              maxLength={80}
              placeholder="journey, systems, design"
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </label>
        </div>

        <label className="cover-row">
          Cover image — optional (defaults to the first image in the post)
          <div className="cover-line">
            <input
              type="file"
              accept="image/*"
              disabled={coverBusy}
              onChange={(e) => void pickCover(e.target.files?.[0])}
            />
            {draft.cover && (
              <span className="cover-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.cover} alt="Cover preview" />
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, cover: "" })}
                  aria-label="Remove cover"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </label>

        <div className="rte-shell">
          <RichEditor
            key={editId ?? "new"}
            initialHtml={draft.bodyHtml}
            onChange={(html) => setDraft((d) => (d ? { ...d, bodyHtml: html } : d))}
          />
        </div>

        <div className="editor-meta">
          <span>
            {minutes} min read · {words} words
          </span>
          <span className={sizeKB > 700 ? "size-warn" : ""}>
            content {sizeKB} KB
          </span>
          <span className="autosave-state">
            {autosavedAt
              ? `local draft saved ${new Date(autosavedAt).toLocaleTimeString()}`
              : localDraftExists
                ? "local draft exists"
                : "autosave on"}
          </span>
        </div>

        <div className="editor-row check-row">
          <label className="check">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            />
            Published
          </label>
          <span className="muted">
            {draft.published ? "Visible to everyone now" : "Draft — only you can see it"}
          </span>
        </div>

        <div className="editor-actions">
          <button type="button" className="btn-ghost" onClick={() => setDraft(null)}>
            Cancel
          </button>
          <button type="button" className="btn-ghost" onClick={clearDraftCache}>
            Clear draft cache
          </button>
          <button type="button" className="btn-gold" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save post"}
          </button>
        </div>
        {msg && <p className="editor-msg">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Posts</h2>
        <button type="button" className="btn-gold" onClick={startNew}>
          + New post
        </button>
      </div>
      {msg && <p className="editor-msg">{msg}</p>}
      <div className="panel-list">
        {items.map((p) => (
          <div key={p.id} className="panel-item glass">
            <div>
              <strong>{p.title}</strong>
              <span className="muted">
                {p.date} · {p.readingTime} min · {p.category} ·{" "}
                {p.published === false ? "draft" : "published"}
              </span>
            </div>
            <div className="panel-item-actions">
              <button type="button" className="btn-ghost" onClick={() => startEdit(p)}>
                Edit
              </button>
              <button
                type="button"
                className="btn-ghost is-danger"
                onClick={async () => {
                  if (!confirm(`Delete “${p.title}”? This also removes its images.`)) return;
                  await cleanupPostImages(p.bodyHtml, p.cover);
                  await Promise.all(
                    (p.images ?? []).map((src) => cleanupImage(src))
                  );
                  await deleteDocById("posts", p.id);
                  await onChanged();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="muted">No posts yet — create the first one.</p>}
      </div>
    </div>
  );
}
