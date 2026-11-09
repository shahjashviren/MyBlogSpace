"use client";

/**
 * Firestore data layer: hooks for the public site
 * and plain CRUD functions for the owner dashboard.
 *
 * Rules-compliant querying: public hooks only request published docs;
 * owner hooks (used behind the dashboard auth guard) request everything.
 */

import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "./firebase";
import { site } from "./site";
import type { Comment, ExperienceRow, Post, Project, SiteSettings } from "./types";
import { readingTimeOf, slugify, stripHtml } from "./types";

type DocShape = { id: string; createdAt?: number };

/** Build-time copy defaults — Firestore settings override these per-field. */
export const SITE_DEFAULTS: SiteSettings = {
  heroPhotos: [],
  hello: site.hello,
  nameLine: site.name,
  roleLine: site.roleLine,
  tagline: site.tagline,
  aboutHeading: "WHO I AM",
  aboutBody:
    "Hello Everyone! I am a Computer Science sophomore at Vellore Institute of Technology - Andhra Pradesh, focused on building strong foundations in scalable software engineering and problem-solving.\n\nBeyond academics, I value discipline, consistency, and maintaining balance through sports, reading, and music.\n\nAlways open to meaningful conversations with professionals and peers building scalable, future-ready software systems!",
  connectSubtitle:
    "Whether it's code, ideas, playing games together & having fun, or just a hello — I'd love to hear from you.",
  kickerAbout: "About",
  headingWriting: "My Blog Posts",
  headingProjects: "Projects",
  headingExperience: "Experience",
  headingConnect: "Let's Connect!",
  footerLine:
    "© 2026 Jash Shah • Personal Blog Website • Documenting my Journey, one step at a time.",
  hobbiesTitle: "Off the clock",
  hobbiesBody:
    "Cricket and badminton whenever the day allows\nMusic on shuffle — always something new\nReading outside tech: history, design, human stories\nExploring new places and collecting small moments",
};

/* ----------------------------- public reads ---------------------------- */

/** Load a collection once; empty/failed → empty list (production behavior:
 *  the site reads only from Firestore, no hardcoded fallback content). */
export function useList<T extends DocShape>(
  path: string,
  opts?: { publishedOnly?: boolean }
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const buildSource = useCallback(() => {
    return opts?.publishedOnly
      ? query(collection(db, path), where("published", "==", true))
      : collection(db, path);
  }, [path, opts?.publishedOnly]);

  /* Owner rules may only permit the published-only query — when the unfiltered
     (owner) read is denied, retry with the filtered query so real Firestore
     docs (e.g. every project) still show. */
  const buildFallbackSource = useCallback(() => {
    return query(collection(db, path), where("published", "==", true));
  }, [path]);

  const handleSnap = useCallback(
    (snap: { empty: boolean; docs: Array<{ id: string; data: () => object }> }) => {
      if (snap.empty) {
        setItems([]);
      } else {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setItems(list);
      }
    },
    []
  );

  /** Try the primary source, then (owner mode only) the published-only retry. */
  const fetchSnap = useCallback(async () => {
    try {
      return await getDocs(buildSource());
    } catch {
      if (opts?.publishedOnly) return null;
      try {
        return await getDocs(buildFallbackSource());
      } catch {
        return null;
      }
    }
  }, [buildSource, buildFallbackSource, opts?.publishedOnly]);

  const load = useCallback(async () => {
    const snap = await fetchSnap();
    if (snap) handleSnap(snap);
    else setItems([]);
    setLoading(false);
  }, [fetchSnap, handleSnap]);

  useEffect(() => {
    let cancelled = false;
    fetchSnap()
      .then((snap) => {
        if (cancelled) return;
        if (snap) handleSnap(snap);
        else setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSnap, handleSnap]);

  return { items, loading, reload: load };
}

export function usePosts(mode: "public" | "owner" = "public") {
  const { items, loading, reload } = useList<Post>("posts", {
    publishedOnly: mode === "public",
  });
  const visible = mode === "public" ? items.filter((p) => p.published !== false) : items;
  return { posts: visible, loading, reload };
}

/** Single post by slug — public pages only ever see published posts. */
export function usePost(slug: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDocs(
      query(
        collection(db, "posts"),
        where("slug", "==", slug),
        where("published", "==", true)
      )
    )
      .then((snap) => {
        if (cancelled) return;
        if (!snap.empty) {
          const d = snap.docs[0];
          setPost({ id: d.id, ...d.data() } as Post);
        } else {
          setPost(null);
        }
      })
      .catch(() => {
        if (!cancelled) setPost(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { post, loading };
}

export function useProjects(owner = false) {
  return useList<Project>("projects", { publishedOnly: !owner });
}

export function useExperience(owner = false) {
  return useList<ExperienceRow>("experience", {
    publishedOnly: !owner,
  });
}

/** Live site copy — Firestore `settings/site` overrides SITE_DEFAULTS per-field. */
export function useSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(SITE_DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(db, "settings", "site"))
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        setSettings({ ...SITE_DEFAULTS, ...(snap.data() as Partial<SiteSettings>) });
      })
      .catch(() => {
        /* rules pending / offline → defaults already set */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}

export function useComments(postId: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([]);

  const load = useCallback(async () => {
    if (!postId) return;
    try {
      const snap = await getDocs(
        query(collection(db, "comments"), where("postId", "==", postId))
      );
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Comment)
        .filter((c) => !c.deleted); // hide soft-deleted rows
      list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setComments(list);
    } catch {
      setComments([]);
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    getDocs(query(collection(db, "comments"), where("postId", "==", postId)))
      .then((snap) => {
        if (cancelled) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment);
        list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setComments(list);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  return { comments, reload: load };
}

export async function fetchLikeCount(postId: string | undefined): Promise<number> {
  if (!postId) return 0;
  try {
    const snap = await getDoc(doc(db, "likes", postId));
    return (snap.data()?.count as number) ?? 0;
  } catch {
    return 0;
  }
}

/* ----------------------------- mutations ------------------------------ */

/** Private per-browser key that powers the ⋯ edit menu on your own comment. */
function newEditKey(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (v) => v.toString(16).padStart(2, "0")).join("");
}

export const COMMENT_KEYS = "jash-comment-keys";

export function loadCommentKeys(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(COMMENT_KEYS) || "{}");
  } catch {
    return {};
  }
}

export function rememberCommentKey(id: string, key: string) {
  try {
    const all = loadCommentKeys();
    all[id] = key;
    sessionStorage.setItem(COMMENT_KEYS, JSON.stringify(all));
  } catch {
    /* private mode */
  }
}

/** Creates the comment; returns its id + private edit key so the browser
 *  can remember which row belongs to it (powers the ⋯ menu). */
export async function addComment(
  postId: string,
  name: string,
  text: string
): Promise<{ id: string; editKey: string }> {
  const editKey = newEditKey();
  // Browser identity: silently sign in anonymously so the comment carries a
  // uid only THIS browser can ever edit/delete. Fails gracefully when the
  // Anonymous provider is off in the Firebase console — the comment still
  // posts (legacy editKey path stays available).
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn(
        "Anonymous auth unavailable — enable it in Firebase → Authentication → Sign-in method. Comment posts without browser-ownership.",
        e
      );
    }
  }
  const uid = auth.currentUser?.uid ?? null;
  const ref = await addDoc(collection(db, "comments"), {
    postId,
    name: name.trim() || "Anonymous",
    text: text.trim(),
    createdAt: Date.now(),
    editKey,
    uid,
  });
  return { id: ref.id, editKey };
}

/** Owner: edit any comment directly (rules' owner branch). */
export async function updateComment(id: string, text: string) {
  await updateDoc(doc(db, "comments", id), {
    text: text.trim(),
    editedAt: Date.now(),
  });
}

/** Edit your own comment — the rules require the editKey proof. */
export async function updateCommentOwn(id: string, editKey: string, text: string) {
  await updateDoc(doc(db, "comments", id), {
    text: text.trim(),
    editedAt: Date.now(),
    editProof: editKey,
  });
}

/** Soft-delete your own comment (owner moderates with hard delete). */
export async function softDeleteCommentOwn(id: string, editKey: string) {
  await updateDoc(doc(db, "comments", id), {
    text: "",
    deleted: true,
    editProof: editKey,
  });
}

export async function deleteComment(id: string) {
  await deleteDoc(doc(db, "comments", id));
}

export async function incrementLike(postId: string) {
  await setDoc(doc(db, "likes", postId), { count: increment(1) }, { merge: true });
}

/** No id → create a new doc; an id → update it. */
const realId = (id: string | null): string | null => id || null;

export async function savePost(
  id: string | null,
  data: Omit<Post, "id" | "readingTime" | "createdAt">
) {
  const text = data.bodyHtml ? stripHtml(data.bodyHtml) : data.body;
  const withTime = { ...data, readingTime: readingTimeOf(text) };
  id = realId(id);
  if (id) {
    await updateDoc(doc(db, "posts", id), { ...withTime });
    return id;
  }
  const ref = await addDoc(collection(db, "posts"), {
    ...withTime,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function saveProject(
  id: string | null,
  data: Omit<Project, "id" | "createdAt">
) {
  const withPublished = { published: true, ...data };
  id = realId(id);
  if (id) {
    await updateDoc(doc(db, "projects", id), { ...withPublished });
    return id;
  }
  const ref = await addDoc(collection(db, "projects"), {
    ...withPublished,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function saveExperience(
  id: string | null,
  data: Omit<ExperienceRow, "id" | "createdAt">
) {
  const withPublished = { published: true, ...data };
  id = realId(id);
  if (id) {
    await updateDoc(doc(db, "experience", id), { ...withPublished });
    return id;
  }
  const ref = await addDoc(collection(db, "experience"), {
    ...withPublished,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function deleteDocById(
  path: "posts" | "projects" | "experience" | "imageRecords",
  id: string
) {
  await deleteDoc(doc(db, path, id));
}

/** Human-readable save error: the real Firebase error code + current auth
 *  state, so a rules/owner mismatch is diagnosable from the UI itself. */
export function describeSaveError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const u = auth.currentUser;
  const who = !u
    ? "not signed in"
    : u.isAnonymous
      ? "anonymous session (not the owner)"
      : "owner (password)";
  return `${code ? code.replace(/^firebase:/, "") : "unknown error"} — signed in as ${who}`;
}

/** Read settings with defaults merged in (dashboard panels, slideshow). */
export async function loadSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(doc(db, "settings", "site"));
    if (snap.exists()) {
      return { ...SITE_DEFAULTS, ...(snap.data() as Partial<SiteSettings>) };
    }
  } catch {
    /* offline / rules pending */
  }
  return { ...SITE_DEFAULTS };
}

/** Partial update — merge on the server, so panels can save one field. */
export async function saveSettings(settings: Partial<SiteSettings>) {
  await setDoc(doc(db, "settings", "site"), settings, { merge: true });
}

export function uniqueSlug(title: string): string {
  return `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
}
