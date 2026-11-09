"use client";

import { useState } from "react";
import { compressImage } from "@/lib/images";
import { deleteDocById, describeSaveError, saveProject } from "@/lib/store";
import type { Project } from "@/lib/types";

type Draft = {
  name: string;
  status: Project["status"];
  description: string;
  githubUrl: string;
  liveUrl: string;
  thumbnail: string;
};

const empty: Draft = {
  name: "",
  status: "live",
  description: "",
  githubUrl: "",
  liveUrl: "",
  thumbnail: "",
};

export default function ProjectsPanel({
  items,
  onChanged,
}: {
  items: Project[];
  onChanged: () => Promise<unknown> | void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const startNew = () => {
    setDraft(empty);
    setEditId(null);
    setMsg("");
  };

  const startEdit = (p: Project) => {
    setDraft({
      name: p.name,
      status: p.status,
      description: p.description,
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
      thumbnail: p.thumbnail,
    });
    setEditId(p.id);
    setMsg("");
  };

  const save = async () => {
    if (!draft || !draft.name.trim() || !draft.description.trim()) {
      setMsg("Name and description are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await saveProject(editId, draft);
      await onChanged();
      setDraft(null);
      setEditId(null);
      setMsg("Saved ✓ — it's live on the site.");
    } catch (e) {
      setMsg(`Save failed — ${describeSaveError(e)} Check the Firestore rules from the README.`);
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (draft) {
    return (
      <div className="editor glass">
        <h2>{editId ? "Edit project" : "New project"}</h2>
        <div className="editor-row">
          <label>
            Name
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as Project["status"] })
              }
            >
              <option value="live">Live</option>
              <option value="renovating">Under renovation</option>
              <option value="paused">Out of service</option>
            </select>
          </label>
        </div>
        <label>
          About the project — 1–2 paragraphs (blank line between)
          <textarea
            rows={7}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </label>
        <div className="editor-row">
          <label>
            GitHub repo URL
            <input
              placeholder="https://github.com/…"
              value={draft.githubUrl}
              onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
            />
          </label>
          <label>
            Live site URL
            <input
              placeholder="https://…"
              value={draft.liveUrl}
              onChange={(e) => setDraft({ ...draft, liveUrl: e.target.value })}
            />
          </label>
        </div>
        <label>
          Landing-page thumbnail (auto-compressed)
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setDraft((d) => (d ? { ...d, thumbnail: "" } : d));
              const url = await compressImage(f, { maxDim: 1100, quality: 0.75, maxKB: 380 });
              setDraft((d) => (d ? { ...d, thumbnail: url } : d));
            }}
          />
        </label>
        {draft.thumbnail && (
          <div className="thumbs">
            <span className="thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.thumbnail} alt="" />
              <button
                type="button"
                onClick={() => setDraft({ ...draft, thumbnail: "" })}
                aria-label="Remove thumbnail"
              >
                ✕
              </button>
            </span>
          </div>
        )}
        <div className="editor-actions">
          <button type="button" className="btn-ghost" onClick={() => setDraft(null)}>
            Cancel
          </button>
          <button type="button" className="btn-gold" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save project"}
          </button>
        </div>
        {msg && <p className="editor-msg">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Projects</h2>
        <button type="button" className="btn-gold" onClick={startNew}>
          + New project
        </button>
      </div>
      {msg && <p className="editor-msg">{msg}</p>}
      <div className="panel-list">
        {items.map((p) => (
          <div key={p.id} className="panel-item glass">
            <div>
              <strong>{p.name}</strong>
              <span className="muted">{p.status}</span>
            </div>
            <div className="panel-item-actions">
              <button type="button" className="btn-ghost" onClick={() => startEdit(p)}>
                Edit
              </button>
              <button
                type="button"
                className="btn-ghost is-danger"
                onClick={async () => {
                  if (!confirm(`Delete “${p.name}”?`)) return;
                  await deleteDocById("projects", p.id);
                  await onChanged();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="muted">No projects yet — add the first one.</p>}
      </div>
    </div>
  );
}
