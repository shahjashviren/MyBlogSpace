"use client";

import { useEffect, useState } from "react";
import { compressImage } from "@/lib/images";
import { describeSaveError, loadSettings, saveSettings } from "@/lib/store";

/** Upload the two hero photographs — compressed, stored in Firestore. */
export default function PhotosPanel() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadSettings().then((s) => setPhotos(s.heroPhotos));
  }, []);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setMsg("");
    const room = Math.max(0, 2 - photos.length);
    const picked = Array.from(files).slice(0, room);
    if (picked.length === 0) {
      setMsg("Two photos max — delete one first to replace it.");
      return;
    }
    const out: string[] = [];
    for (const f of picked) {
      out.push(await compressImage(f, { maxDim: 1500, quality: 0.78, maxKB: 460 }));
    }
    setPhotos((p) => [...p, ...out].slice(0, 2));
  };

  const persist = async () => {
    setBusy(true);
    setMsg("");
    try {
      await saveSettings({ heroPhotos: photos });
      setMsg("Saved ✓ — refresh the homepage to see them.");
    } catch (e) {
      setMsg(`Save failed — ${describeSaveError(e)} Check the Firestore rules from the README.`);
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Hero photographs</h2>
      </div>
      <p className="muted panel-intro">
        The two photos in your hero slideshow. They&apos;re compressed in your
        browser, stored in Firestore, and never touch git — so they appear on
        the live site without leaving your control.
      </p>

      <div className="hero-photo-grid">
        {[0, 1].map((i) => (
          <div key={i} className="hero-photo-slot glass">
            {photos[i] ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[i]} alt={`Hero photo ${i + 1}`} />
                <button
                  type="button"
                  className="btn-ghost is-danger"
                  onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </>
            ) : (
              <span className="muted">Photo {i + 1} — empty</span>
            )}
          </div>
        ))}
      </div>

      <label className="upload-btn btn-ghost">
        Add photo{photos.length < 2 ? "s" : " (full)"}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void onFiles(e.target.files)}
        />
      </label>

      <div className="editor-actions">
        <button type="button" className="btn-gold" disabled={busy} onClick={() => void persist()}>
          {busy ? "Saving…" : "Save photos"}
        </button>
      </div>
      {msg && <p className="editor-msg">{msg}</p>}
    </div>
  );
}
