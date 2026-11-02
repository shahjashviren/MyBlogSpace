/**
 * Seed content — everything here becomes dashboard-editable once the
 * owner panel ships (Firestore). Placeholders are honest and designed,
 * never fake metrics.
 */

export type WritingPreview = {
  title: string;
  date: string; // display form
  readingTime: number; // minutes — news-style badge
  excerpt: string;
  tags: string[];
};

export const writingPreview: WritingPreview[] = [
  {
    title: "Hello, BlogSpace — why this exists",
    date: "1 Nov 2026",
    readingTime: 4,
    excerpt:
      "A learning-in-public journal: what I try, what breaks, and what I'd do differently — written down before I forget.",
    tags: ["journey"],
  },
  {
    title: "Choosing the stack, and committing to it",
    date: "30 Oct 2026",
    readingTime: 6,
    excerpt:
      "Next.js, Firestore, and a personal rule about not re-deciding the same thing twice.",
    tags: ["building"],
  },
  {
    title: "The quiet discipline of showing up weekly",
    date: "27 Oct 2026",
    readingTime: 3,
    excerpt:
      "Consistency beats polish — a note to myself before week two of documenting all of this.",
    tags: ["reflection"],
  },
];

export type Status = "live" | "renovating" | "paused" | "soon";

export type Project = {
  name: string;
  blurb: string;
  status: Status;
  /** Landing-page screenshot path (public/images/) — optional. */
  image?: string;
  url?: string;
  repo?: string;
  /** Renders the designed "add me" slot instead of a project. */
  slot?: boolean;
};

export const statusLabel: Record<Status, string> = {
  live: "Live",
  renovating: "Under renovation",
  paused: "Out of service",
  soon: "Coming soon",
};

export const projects: Project[] = [
  {
    name: "BlogSpace",
    blurb:
      "This website — a dynamic personal blog with a private owner dashboard, comments, and analytics.",
    status: "live",
    image: "",
  },
  { name: "", blurb: "", status: "soon", slot: true },
  { name: "", blurb: "", status: "soon", slot: true },
];

export type ExperienceRow = {
  org: string;
  monogram: string; // 1–2 letters shown in the logo tile
  role: string;
  period: string;
  blurb: string;
  example?: boolean;
};

export const experience: ExperienceRow[] = [
  {
    org: "Example Organization",
    monogram: "EX",
    role: "Your role title",
    period: "2026 — Present",
    blurb:
      "One honest line about what you did, learned, or built there. Editable from the owner dashboard.",
    example: true,
  },
];
