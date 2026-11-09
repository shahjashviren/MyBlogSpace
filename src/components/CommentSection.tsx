"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  addComment,
  deleteComment,
  loadCommentKeys,
  rememberCommentKey,
  softDeleteCommentOwn,
  updateComment,
  updateCommentOwn,
  useComments,
} from "@/lib/store";

/**
 * Public comments — write as your name or Anonymous.
 * • The creator's browser keeps a private editKey → its ⋯ menu offers
 *   Edit (shows an "Edited" badge) and a soft Delete.
 * • The signed-in owner gets the same ⋯ menu with a hard Delete.
 * • The original post time always stays visible.
 */
export default function CommentSection({ postId }: { postId: string }) {
  const { comments, reload } = useComments(postId);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  // SSR renders no keys; restore right after hydration (async → no mismatch).
  const [keys, setKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.resolve().then(() => setKeys(loadCommentKeys()));
  }, []);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Anonymous sign-in (used to post comments) must NOT count as the owner —
    // otherwise every comment shows the ⋯ menu and fails with an error.
    const unsub = auth.onAuthStateChanged((u) =>
      setIsOwner(!!u && !u.isAnonymous)
    );
    return () => unsub();
  }, []);

  // close the ⋯ menu on outside click
  useEffect(() => {
    if (!menuFor) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuFor(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuFor]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const { id, editKey } = await addComment(postId, name, text);
      rememberCommentKey(id, editKey);
      setKeys(loadCommentKeys());
      setText("");
      await reload();
    } catch {
      /* rules may not be pasted yet — stay quiet, form keeps content */
    } finally {
      setBusy(false);
    }
  };

  const canManage = (id: string) => isOwner || !!keys[id];

  /** Firestore rules denial — the raw error stays in the console only. */
  const isPermissionDenied = (e: unknown) =>
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "permission-denied";

  const saveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    setBusy(true);
    setActionErr("");
    let done = false;
    let denied = false;
    // 1) signed-in browser (owner password session or the comment's own
    //    anonymous identity) → direct update, allowed by uid/owner rules
    if (auth.currentUser) {
      try {
        await updateComment(id, editingText);
        done = true;
      } catch (e) {
        if (isPermissionDenied(e)) denied = true;
        console.warn("Direct edit refused, trying editKey proof:", e);
      }
    }
    // 2) legacy editKey proof path
    if (!done && keys[id]) {
      try {
        await updateCommentOwn(id, keys[id], editingText);
        done = true;
      } catch (e) {
        if (isPermissionDenied(e)) denied = true;
        console.warn("editKey edit refused:", e);
      }
    }
    if (done) {
      setEditingId(null);
      await reload();
    } else if (denied) {
      setActionErr("You cannot edit someone else's comment.");
    } else {
      console.error("Comment edit failed.");
      setActionErr(
        "Edit failed — owner: sign in via Owner login first. Commenter: enable Anonymous auth (Firebase → Authentication → Sign-in method) and re-paste firestore.rules."
      );
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    setMenuFor(null);
    setBusy(true);
    setActionErr("");
    let done = false;
    let denied = false;
    // 1) signed-in browser → hard delete (owner password session or the
    //    comment's own anonymous uid — both allowed by the final rules)
    if (auth.currentUser) {
      try {
        await deleteComment(id);
        done = true;
      } catch (e) {
        if (isPermissionDenied(e)) denied = true;
        console.warn("Direct delete refused, trying editKey soft-delete:", e);
      }
    }
    // 2) legacy editKey → soft delete
    if (!done && keys[id]) {
      try {
        await softDeleteCommentOwn(id, keys[id]);
        done = true;
      } catch (e) {
        if (isPermissionDenied(e)) denied = true;
        console.warn("editKey delete refused:", e);
      }
    }
    if (done) {
      await reload();
    } else if (denied) {
      setActionErr("You cannot delete someone else's comment.");
    } else {
      console.error("Comment delete failed.");
      setActionErr(
        "Delete failed — owner: sign in via Owner login first. Commenter: enable Anonymous auth (Firebase → Authentication → Sign-in method) and re-paste firestore.rules."
      );
    }
    setBusy(false);
  };

  return (
    <section className="comments">
      <h3>
        Comments <span className="muted">({comments.length})</span>
      </h3>

      <form className="comment-form glass" onSubmit={submit}>
        <input
          type="text"
          placeholder="Your name (leave empty for Anonymous)"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Write a comment…"
          value={text}
          rows={3}
          maxLength={2000}
          required
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={busy || !text.trim()}>
          {busy ? "Posting…" : "Post comment"}
        </button>
      </form>

      {actionErr ? <p className="comment-err">{actionErr}</p> : null}

      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="muted comment-empty">No comments yet — start the conversation.</p>
        ) : (
          comments.map((c) => (
            <article key={c.id} className="comment glass">
              <header>
                <strong>{c.name}</strong>
                {/* original post time — never replaced by edit time */}
                <time dateTime={new Date(c.createdAt).toISOString()}>
                  {new Date(c.createdAt).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
                {c.editedAt ? <span className="edited-badge">Edited</span> : null}

                {canManage(c.id) ? (
                  <div className="comment-menu" ref={menuFor === c.id ? menuRef : undefined}>
                    <button
                      type="button"
                      className="comment-more"
                      aria-label="Comment options"
                      aria-expanded={menuFor === c.id}
                      onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                    >
                      ⋯
                    </button>
                    {menuFor === c.id ? (
                      <div className="comment-menu-pop glass" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditingText(c.text);
                            setMenuFor(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="danger"
                          disabled={busy}
                          onClick={() => remove(c.id)}
                        >
                          {isOwner && !keys[c.id] ? "Delete" : "Delete"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </header>

              {editingId === c.id ? (
                <div className="comment-editor">
                  <textarea
                    value={editingText}
                    rows={3}
                    maxLength={2000}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <div className="comment-editor-actions">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-gold"
                      disabled={busy || !editingText.trim()}
                      onClick={() => saveEdit(c.id)}
                    >
                      {busy ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <p>{c.text}</p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
