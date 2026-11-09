"use client";

/**
 * Image upload pipeline — Cloudinary (free tier) first, silent Firestore
 * fallback when the API isn't configured or an upload fails.
 *
 *  · Cloudinary: original bytes preserved (≤ ~9.5 MB), CDN serves them.
 *  · Firestore fallback: compressed ≤1600px / ~480 KB into `imageRecords`.
 *
 * Firestore-fallback images are referenced in HTML as `firestore-image://id`
 * and resolved at render/edit time — post documents stay tiny.
 */

import { addDoc, collection, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { compressImage } from "./images";

export type UploadResult = {
  url: string; // https://… (Cloudinary) or firestore-image://id (fallback)
  source: "cloudinary" | "firestore";
};

const FIRESTORE_PREFIX = "firestore-image://";

/** Resolved-dataURL cache so each fallback image is fetched at most once. */
const resolveCache = new Map<string, string>();

async function signUpload(folder: string): Promise<{
  cloud: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
} | null> {
  try {
    const res = await fetch("/api/cloudinary-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function cloudinaryUpload(
  payload: File | string,
  folder: string
): Promise<string | null> {
  const sign = await signUpload(folder);
  if (!sign) return null;
  try {
    const form = new FormData();
    if (typeof payload === "string") {
      form.append("file", payload); // data URL
    } else {
      form.append("file", payload, payload.name || "photo.jpg"); // original bytes
    }
    form.append("api_key", sign.apiKey);
    form.append("timestamp", String(sign.timestamp));
    form.append("signature", sign.signature);
    form.append("folder", sign.folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sign.cloud}/image/upload`,
      { method: "POST", body: form }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { secure_url?: string };
    return json.secure_url ?? null;
  } catch {
    return null;
  }
}

/**
 * Upload one image. Tries Cloudinary with the original file (quality
 * untouched); falls back to a compressed Firestore record.
 */
export async function uploadImage(file: File, context = "post"): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }

  const folder = `jash-blog/${context.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24) || "misc"}`;

  // Cloudinary free tier caps uploads at 10 MB — pre-shrink anything bigger.
  let payload: File | string = file;
  if (file.size > 9.5 * 1024 * 1024) {
    payload = await compressImage(file, { maxDim: 4000, quality: 0.9, maxKB: 9000 });
  }

  const cdnUrl = await cloudinaryUpload(payload, folder);
  if (cdnUrl) return { url: cdnUrl, source: "cloudinary" };

  // ── Silent fallback: compressed record in Firestore ──
  const compact = await compressImage(file, {
    maxDim: 1600,
    quality: 0.8,
    maxKB: 480,
  });
  const ref = await addDoc(collection(db, "imageRecords"), {
    dataUrl: compact,
    createdAt: Date.now(),
  });
  const url = `${FIRESTORE_PREFIX}${ref.id}`;
  resolveCache.set(url, compact);
  return { url, source: "firestore" };
}

export function isFirestoreImage(url: string): boolean {
  return url.startsWith(FIRESTORE_PREFIX);
}

export function firestoreImageId(url: string): string {
  return url.slice(FIRESTORE_PREFIX.length);
}

/** Resolve any image src (https URLs pass straight through). */
export async function resolveImageSrc(url: string): Promise<string> {
  if (!url || !isFirestoreImage(url)) return url;
  const cached = resolveCache.get(url);
  if (cached) return cached;
  try {
    const snap = await getDoc(doc(db, "imageRecords", firestoreImageId(url)));
    const dataUrl = (snap.data()?.dataUrl as string) ?? "";
    if (dataUrl) resolveCache.set(url, dataUrl);
    return dataUrl;
  } catch {
    return "";
  }
}

/** Resolve every `firestore-image://` reference inside an HTML string. */
export async function resolveHtmlImages(html: string): Promise<string> {
  const refs = collectImageRefs(html);
  let out = html;
  for (const ref of refs) {
    const resolved = await resolveImageSrc(ref);
    if (resolved) {
      out = out.split(`src="${ref}"`).join(`src="${resolved}"`);
    }
  }
  return out;
}

/** All firestore-image:// references appearing in an HTML string. */
export function collectImageRefs(html: string | undefined | null): string[] {
  if (!html) return [];
  const matches = html.match(/firestore-image:\/\/[A-Za-z0-9]+/g) ?? [];
  return Array.from(new Set(matches));
}

/** Delete a Firestore image record (and clear cache). */
export async function deleteImageRef(url: string): Promise<void> {
  if (!isFirestoreImage(url)) return;
  resolveCache.delete(url);
  try {
    await deleteDoc(doc(db, "imageRecords", firestoreImageId(url)));
  } catch {
    /* already gone */
  }
}

/** Ask the server to destroy a Cloudinary asset. */
export async function destroyCloudinaryImage(url: string): Promise<void> {
  if (!url.startsWith("http")) return;
  try {
    await fetch("/api/cloudinary-destroy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    /* best-effort cleanup */
  }
}

/** Full cleanup for one image reference (either source). */
export async function cleanupImage(url: string): Promise<void> {
  if (isFirestoreImage(url)) await deleteImageRef(url);
  else if (url.includes("/upload/")) await destroyCloudinaryImage(url);
}

/** Delete every image referenced by a post's HTML + cover (post deletion). */
export async function cleanupPostImages(
  html: string | undefined | null,
  cover?: string
): Promise<void> {
  const refs = collectImageRefs(html);
  if (cover && isFirestoreImage(cover)) refs.push(cover);
  const cloudinaryUrls = Array.from(
    new Set(
      [
        ...(html?.match(/https:\/\/res\.cloudinary\.com\/[^"'\s)]+/g) ?? []),
        ...(cover && cover.includes("/upload/") ? [cover] : []),
      ]
    )
  );
  await Promise.all([
    ...refs.map((r) => deleteImageRef(r)),
    ...cloudinaryUrls.map((u) => destroyCloudinaryImage(u)),
  ]);
}
