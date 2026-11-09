/**
 * ─────────────────────────────────────────────────────────────
 *  SITE IDENTITY — single source of truth for the brand.
 *  (The dashboard will edit this content in Firestore later;
 *  this file is the build-time fallback/defaults.)
 * ─────────────────────────────────────────────────────────────
 */
export const site = {
  name: "Jash Shah",

  /** Under the name in the hero; also footer. Line break after the smiley. */
  tagline:
    "I like to learn and experience life to its fullest :)\nWelcome to my BlogSpace, folks!",
  firstName: "Jash",

  /** Hero greeting — one line, bigger. */
  hello: "Hello Everyone 👋🏼 I am",
  /** Single subtitle line under the name. */
  roleLine: "Student Builder | Computer Science | Explorer",

  /** Short line for meta/SEO (one sentence, no emoji). */
  description:
    "Jash Shah — a personal blog documenting learning in public: projects, lessons, and reflective notes from the journey.",

  /** Hero quick-link boxes. Empty href = rendered disabled until you fill these in. */
  // EITHER block works: entries in `connect` (below) override `links`.
  links: {
    linkedin: "https://www.linkedin.com/in/jash-shah-1a1a5436a/", // e.g. ""
    github: "https://github.com/shahjashviren", // e.g. ""
    leetcode: "https://leetcode.com/u/Hawk_7x/", // e.g. ""
    substack: "https://substack.com/@hawk070?utm_campaign=profile&utm_medium=profile-page", // e.g. ""
    instagram: "https://www.instagram.com/jash_98x/", // e.g. ""
    x: "https://x.com/", // test link (yours to replace)
    email: "jashshawk29@gmail.com", // e.g. "you@example.com"  (mailto: is added automatically)
  },

  /** Full social set for the Connect section. */
  connect: [
    { id: "github", label: "GitHub", href: "" },
    { id: "linkedin", label: "LinkedIn", href: "" },
    { id: "leetcode", label: "LeetCode", href: "" },
    { id: "substack", label: "Substack", href: "" },
    { id: "instagram", label: "Instagram", href: "" },
    { id: "x", label: "X", href: "https://x.com/" },
  ],

  /** Photo slideshow pair — drop photo-1.jpg / photo-2.jpg into public/images/. */
  photos: ["/images/photo-1.jpg", "/images/photo-2.jpg"],
} as const;

/**
 * Resolve a social URL by id ("github", "x", "email", …).
 * Fills the gap that made edits invisible: `connect` entries win when set,
 * otherwise `links` is used. Both blocks are user-editable.
 */
export function socialUrl(id: string): string {
  const fromConnect = site.connect.find((c) => c.id === id)?.href;
  if (fromConnect) return fromConnect;
  const fromLinks = site.links as Record<string, string>;
  return fromLinks[id] || "";
}
