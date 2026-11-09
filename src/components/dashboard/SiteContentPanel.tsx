"use client";

import { useEffect, useState } from "react";
import { describeSaveError, loadSettings, saveSettings, SITE_DEFAULTS } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

type FieldKey =
  | "hello"
  | "nameLine"
  | "roleLine"
  | "tagline"
  | "kickerAbout"
  | "aboutHeading"
  | "aboutBody"
  | "hobbiesTitle"
  | "hobbiesBody"
  | "headingWriting"
  | "headingProjects"
  | "headingExperience"
  | "headingConnect"
  | "connectSubtitle"
  | "footerLine";

const FIELDS: { key: FieldKey; label: string; type: "input" | "textarea"; hint?: string }[] = [
  { key: "hello", label: "Hero greeting", type: "input" },
  { key: "nameLine", label: "Name line", type: "input" },
  { key: "roleLine", label: "Role line", type: "input" },
  {
    key: "tagline",
    label: "Tagline",
    type: "textarea",
    hint: "Two lines — the line break in the middle is preserved",
  },
  { key: "kickerAbout", label: "About eyebrow (small text)", type: "input" },
  { key: "aboutHeading", label: "About heading", type: "input" },
  {
    key: "aboutBody",
    label: "WHO I AM paragraphs",
    type: "textarea",
    hint: "Blank line = new paragraph. A first line starting with “Hello Everyone!” gets the gold accent automatically",
  },
  { key: "hobbiesTitle", label: "Side card title", type: "input" },
  {
    key: "hobbiesBody",
    label: "Off the clock — hobbies",
    type: "textarea",
    hint: "One hobby per line — shows as the leaf-marked list beside WHO I AM",
  },
  { key: "headingWriting", label: "Blog section heading", type: "input" },
  { key: "headingProjects", label: "Projects heading", type: "input" },
  { key: "headingExperience", label: "Experience heading", type: "input" },
  { key: "headingConnect", label: "Connect heading", type: "input" },
  { key: "connectSubtitle", label: "Connect subtitle", type: "textarea" },
  { key: "footerLine", label: "Footer line", type: "input" },
];

const EMPTY: Record<FieldKey, string> = {
  hello: "",
  nameLine: "",
  roleLine: "",
  tagline: "",
  kickerAbout: "",
  aboutHeading: "",
  aboutBody: "",
  hobbiesTitle: "",
  hobbiesBody: "",
  headingWriting: "",
  headingProjects: "",
  headingExperience: "",
  headingConnect: "",
  connectSubtitle: "",
  footerLine: "",
};

export default function SiteContentPanel() {
  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadSettings().then((s) => {
      if (cancelled) return;
      const next = { ...EMPTY };
      for (const f of FIELDS) {
        const v = s[f.key];
        next[f.key] = typeof v === "string" ? v : "";
      }
      setForm(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const payload: Partial<SiteSettings> = {};
      for (const f of FIELDS) payload[f.key] = form[f.key];
      await saveSettings(payload);
      setMsg("Saved — the live site updated ✓");
    } catch (e) {
      setMsg(`Couldn't save — ${describeSaveError(e)} Check that Firestore rules are published.`);
    } finally {
      setBusy(false);
    }
  }

  function resetField(key: FieldKey) {
    const def = SITE_DEFAULTS[key];
    setForm((f) => ({ ...f, [key]: typeof def === "string" ? def : "" }));
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Site content</h2>
        <p className="muted">
          Every line of public copy lives here — save and the homepage updates
          instantly, no redeploy.
        </p>
      </div>

      <div className="editor glass">
        {FIELDS.map((f) => (
          <div key={f.key} className="editor-row site-field">
            <label htmlFor={`site-${f.key}`}>
              {f.label}
              <button
                type="button"
                className="field-reset"
                onClick={() => resetField(f.key)}
                title="Reset this field to its default"
              >
                Reset
              </button>
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={`site-${f.key}`}
                rows={f.key === "aboutBody" ? 8 : 3}
                value={form[f.key]}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            ) : (
              <input
                id={`site-${f.key}`}
                type="text"
                value={form[f.key]}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            )}
            {f.hint && <p className="field-hint">{f.hint}</p>}
          </div>
        ))}

        <div className="editor-actions">
          <button type="button" className="btn-gold" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save site content"}
          </button>
          {msg && <p className="editor-msg">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
