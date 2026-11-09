"use client";

import { useState } from "react";
import { deleteDocById, describeSaveError, saveExperience } from "@/lib/store";
import { cleanupImage, uploadImage } from "@/lib/uploads";
import { rolePeriod, type ExperienceRow } from "@/lib/types";

type RoleDraft = { title: string; start: string; end: string };

type Draft = {
  org: string;
  monogram: string;
  logo: string;
  location: string;
  role: string; // legacy single-role fields
  period: string;
  blurb: string;
  roles: RoleDraft[]; // LinkedIn-style history
};

const empty: Draft = {
  org: "",
  monogram: "",
  logo: "",
  location: "",
  role: "",
  period: "",
  blurb: "",
  roles: [{ title: "", start: "", end: "" }],
};

function rolesOf(row: ExperienceRow): RoleDraft[] {
  return (row.roles ?? []).map((r) => ({
    title: r.title,
    start: r.start,
    end: r.end ?? "",
  }));
}

export default function ExperiencePanel({
  items,
  onChanged,
}: {
  items: ExperienceRow[];
  onChanged: () => Promise<unknown> | void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [origLogo, setOrigLogo] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);

  const save = async () => {
    if (!draft || !draft.org.trim()) {
      setMsg("Organization is required.");
      return;
    }
    const roles = draft.roles.filter(
      (r) => r.title.trim() || r.start.trim()
    );
    const payload = {
      ...draft,
      roles,
      // legacy fields only meaningful when there is no structured history
      role: roles.length ? draft.role : draft.role,
      location: draft.location.trim(),
    };
    setBusy(true);
    try {
      await saveExperience(editId, payload);
      if (origLogo && origLogo !== draft.logo) {
        cleanupImage(origLogo).catch(() => {});
      }
      await onChanged();
      setDraft(null);
      setEditId(null);
      setOrigLogo("");
      setMsg("Saved ✓");
    } catch (e) {
      setMsg(`Save failed — ${describeSaveError(e)} Check the Firestore rules from the README.`);
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (draft) {
    const structured = draft.roles.length > 0;
    const setRole = (i: number, patch: Partial<RoleDraft>) =>
      setDraft((d) =>
        d
          ? {
              ...d,
              roles: d.roles.map((r, idx) =>
                idx === i ? { ...r, ...patch } : r
              ),
            }
          : d
      );

    return (
      <div className="editor glass">
        <h2>{editId ? "Edit entry" : "New experience"}</h2>

        <div className="editor-row">
          <label>
            Organization
            <input
              value={draft.org}
              onChange={(e) => setDraft({ ...draft, org: e.target.value })}
            />
          </label>
          <label>
            Logo letters (1–2)
            <input
              maxLength={2}
              placeholder="EX"
              value={draft.monogram}
              onChange={(e) =>
                setDraft({ ...draft, monogram: e.target.value.toUpperCase() })
              }
            />
          </label>
        </div>

        <div className="logo-row">
          <span className="logo-thumb">
            {draft.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.logo} alt="" />
            ) : (
              <b>{draft.monogram || "LOGO"}</b>
            )}
          </span>
          <label className="btn-ghost logo-pick">
            {logoBusy ? "Uploading…" : draft.logo ? "Replace logo" : "Upload logo"}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={logoBusy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setLogoBusy(true);
                try {
                  const res = await uploadImage(file, "xp");
                  if (draft.logo && draft.logo !== origLogo) {
                    cleanupImage(draft.logo).catch(() => {});
                  }
                  setDraft((d) => (d ? { ...d, logo: res.url } : d));
                } catch {
                  setMsg("Logo upload failed — check Cloudinary keys in .env.local");
                } finally {
                  setLogoBusy(false);
                }
              }}
            />
          </label>
          {draft.logo ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                if (draft.logo !== origLogo) cleanupImage(draft.logo).catch(() => {});
                setDraft({ ...draft, logo: "" });
              }}
            >
              Remove
            </button>
          ) : null}
          <span className="muted logo-hint">Square PNG/JPG — shown crisp beside the org</span>
        </div>

        <div className="editor-row">
          <label>
            Location / work mode
            <input
              placeholder="On-site · Vizag, Andhra Pradesh"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
          </label>
          <label>
            Blurb (one honest line)
            <input
              value={draft.blurb}
              onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
            />
          </label>
        </div>

        {/* ---------- roles: LinkedIn-style history ---------- */}
        <div className="roles-head">
          <span>Roles in this organization</span>
          {!structured ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                setDraft((d) =>
                  d
                    ? {
                        ...d,
                        roles: [
                          { title: d.role || "", start: "", end: "" },
                        ],
                      }
                    : d
                )
              }
            >
              Use LinkedIn-style roles →
            </button>
          ) : null}
        </div>

        {!structured ? (
          <div className="editor-row">
            <label>
              Role
              <input
                value={draft.role}
                placeholder="Technical Team Member"
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              />
            </label>
            <label>
              Period (free text)
              <input
                value={draft.period}
                placeholder="Oct 2026 – Present"
                onChange={(e) => setDraft({ ...draft, period: e.target.value })}
              />
            </label>
          </div>
        ) : (
          <div className="roles-list">
            {draft.roles.map((r, i) => (
              <div className="role-row" key={i}>
                <input
                  className="role-title"
                  placeholder="Associate Lead, VCode Team"
                  value={r.title}
                  onChange={(e) => setRole(i, { title: e.target.value })}
                />
                <input
                  type="month"
                  title="Start month"
                  value={r.start}
                  onChange={(e) => setRole(i, { start: e.target.value })}
                />
                <span className="role-dash">→</span>
                <input
                  type="month"
                  title="End month (leave empty = Present)"
                  value={r.end}
                  onChange={(e) => setRole(i, { end: e.target.value })}
                />
                <button
                  type="button"
                  className="btn-ghost is-danger"
                  aria-label="Remove role"
                  onClick={() =>
                    setDraft((d) =>
                      d
                        ? { ...d, roles: d.roles.filter((_, idx) => idx !== i) }
                        : d
                    )
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="role-row-hints muted">
              End month empty = <strong>Present</strong> · preview:{" "}
              {draft.roles
                .filter((r) => r.title || r.start)
                .map((r) => `${r.title || "Role"} (${rolePeriod(r.start, r.end || undefined)})`)
                .join(" · ") || "—"}
            </div>
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                setDraft((d) =>
                  d
                    ? {
                        ...d,
                        roles: [{ title: "", start: "", end: "" }, ...d.roles],
                      }
                    : d
                )
              }
            >
              + Add role (promotion, new position…)
            </button>
          </div>
        )}

        <div className="editor-actions">
          <button type="button" className="btn-ghost" onClick={() => setDraft(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-gold"
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : "Save entry"}
          </button>
        </div>
        {msg && <p className="editor-msg">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Experience</h2>
        <button
          type="button"
          className="btn-gold"
          onClick={() => {
            setDraft(empty);
            setEditId(null);
          }}
        >
          + New entry
        </button>
      </div>
      {msg && <p className="editor-msg">{msg}</p>}
      <div className="panel-list">
        {items.map((row) => {
          const rs = rolesOf(row);
          return (
            <div key={row.id} className="panel-item glass">
              <div>
                <strong>{row.org}</strong>
                <span className="muted">
                  {rs.length
                    ? rs.map((r) => r.title).filter(Boolean).join(" · ") ||
                      row.org
                    : `${row.role} · ${row.period}`}
                </span>
              </div>
              <div className="panel-item-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setDraft({
                      org: row.org,
                      monogram: row.monogram,
                      logo: row.logo ?? "",
                      location: row.location ?? "",
                      role: row.role,
                      period: row.period,
                      blurb: row.blurb,
                      roles: rs.length
                        ? rs
                        : row.role || row.period
                        ? [] // legacy → show simple fields + convert button
                        : [],
                    });
                    setOrigLogo(row.logo ?? "");
                    setEditId(row.id);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-ghost is-danger"
                  onClick={async () => {
                    if (!confirm(`Delete “${row.org}”?`)) return;
                    await deleteDocById("experience", row.id);
                    await onChanged();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
