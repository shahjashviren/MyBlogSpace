/** Firestore data shapes — shared by the public site and owner dashboard. */

export type Post = {
  id: string;
  slug: string;
  title: string;
  category: string; // album
  date: string; // display ISO "2026-11-01"
  readingTime: number; // minutes @ ~220 wpm
  body: string; // plain paragraphs (fallback / SEO text)
  bodyHtml?: string; // rich editor output — preferred for rendering when present
  cover?: string; // card image; "" / undefined → first image in the body
  images: string[]; // compressed dataURLs (legacy gallery)
  published: boolean;
  createdAt?: number;
};

export type Project = {
  id: string;
  name: string;
  status: "live" | "renovating" | "paused";
  description: string; // 1–2 paragraphs
  githubUrl: string;
  liveUrl: string;
  thumbnail: string; // compressed dataURL ("" → designed plate)
  published?: boolean; // public reads only see published == true
  createdAt?: number;
};

/** One position inside an organization (LinkedIn-style history). */
export type ExperienceRole = {
  title: string;
  start: string; // "2026-10" (month picker)
  end?: string; // "" / undefined = Present
};

export type ExperienceRow = {
  id: string;
  org: string;
  monogram: string;
  logo?: string; // Cloudinary / Firestore image URL shown crisp next to org
  role: string; // legacy single role (kept for old rows)
  period: string; // legacy free-text period (kept for old rows)
  location?: string; // "On-site" / "Vizag, Andhra Pradesh"
  roles?: ExperienceRole[]; // structured history — wins over legacy fields
  blurb: string;
  example?: boolean;
  published?: boolean; // public reads only see published == true
  createdAt?: number;
};

/* ---------------- experience date helpers (LinkedIn-style) --------------- */
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthIndex(ym: string): number | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || "");
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return Number(m[1]) * 12 + (month - 1);
}

export function monthLabel(ym: string): string {
  const idx = monthIndex(ym);
  if (idx == null) return ym || "";
  const y = Math.floor(idx / 12);
  const m = idx % 12;
  return `${MONTH_ABBR[m]} ${y}`;
}

/** "Oct 2026 – Present" */
export function rolePeriod(start: string, end?: string): string {
  if (!start) return end ? monthLabel(end) : "";
  return `${monthLabel(start)} – ${end ? monthLabel(end) : "Present"}`;
}

/** Inclusive month count (Oct 2026 → now in Nov 2026 = 2). */
export function monthsBetween(start: string, end?: string): number {
  const s = monthIndex(start);
  if (s == null) return 0;
  let e: number;
  const endIndex = end ? monthIndex(end) : null;
  if (endIndex != null) {
    e = endIndex;
  } else {
    const now = new Date();
    e = now.getFullYear() * 12 + now.getMonth();
  }
  return Math.max(1, e - s + 1);
}

/** 13 → "1 yr", 13+2 → "1 yr 2 mos", 4 → "4 mos" */
export function durationLabel(totalMonths: number): string {
  if (totalMonths <= 0) return "";
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y && m) return `${y} yr ${m} mos`;
  if (y) return `${y} yr`;
  return `${totalMonths} mo${totalMonths === 1 ? "" : "s"}`;
}

export type Comment = {
  id: string;
  postId: string;
  name: string; // blank → "Anonymous"
  text: string;
  createdAt: number; // original post time — always shown, even after edits
  editKey?: string; // set by the creator's browser; powers the ⋯ menu
  uid?: string | null; // commenter's browser identity — durable ownership
  editedAt?: number; // present → "Edited" badge
  deleted?: boolean; // soft-deleted by the comment's owner
};

export type SiteSettings = {
  heroPhotos: string[]; // compressed dataURLs, empty → local photo-1/photo-2
  // ── Site Content tab — every field optional, overrides SITE_DEFAULTS ──
  hello?: string; // "Hello Everyone 👋🏼 I am"
  nameLine?: string; // "Jash Shah"
  roleLine?: string; // "Student Builder | Computer Science | Explorer"
  tagline?: string; // two lines, \n separated
  aboutHeading?: string; // "WHO I AM"
  aboutBody?: string; // paragraphs separated by blank lines
  connectSubtitle?: string;
  kickerAbout?: string; // small "About" eyebrow
  headingWriting?: string; // "My Blog Posts"
  headingProjects?: string; // "Projects"
  headingExperience?: string; // "Experience"
  headingConnect?: string; // "Let's Connect!"
  footerLine?: string;
  hobbiesTitle?: string; // "Off the clock"
  hobbiesBody?: string; // one hobby per line
};

export const statusLabel: Record<Project["status"], string> = {
  live: "Live",
  renovating: "Under renovation",
  paused: "Out of service",
};

/** News-style reading time, ~220 words per minute. */
export function readingTimeOf(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

/** Strip HTML down to readable text (reading time, excerpts, meta descriptions). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
