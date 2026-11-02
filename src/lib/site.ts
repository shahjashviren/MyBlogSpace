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

  /** Hero greeting kicker (replaces the old "student creator explorer"). */
  hello: "Hello everyone 👋",
  /** Two-line subtitle under the name. */
  roleLine: "Student Builder",
  subRole: "a learner, an explorer, or whatever",

  /** Short line for meta/SEO (one sentence, no emoji). */
  description:
    "Jash Shah — a personal blog documenting learning in public: projects, lessons, and reflective notes from the journey.",

  /** Hero quick-link boxes. Empty href = rendered with "#" until you fill these in. */
  links: {
    linkedin: "", // e.g. "https://linkedin.com/in/yourhandle"
    github: "", // e.g. "https://github.com/yourhandle"
    leetcode: "", // e.g. "https://leetcode.com/u/yourhandle"
    substack: "", // e.g. "https://yourhandle.substack.com"
    instagram: "", // e.g. "https://instagram.com/yourhandle"
    email: "", // e.g. "you@example.com"  (mailto: is added automatically)
  },

  /** Full social set for the Connect section (M2). X stays "coming soon". */
  connect: [
    { id: "github", label: "GitHub", href: "" },
    { id: "linkedin", label: "LinkedIn", href: "" },
    { id: "leetcode", label: "LeetCode", href: "" },
    { id: "substack", label: "Substack", href: "" },
    { id: "instagram", label: "Instagram", href: "" },
    { id: "x", label: "X", href: "", comingSoon: true },
  ],

  /** Photo slideshow pair — drop photo-1.jpg / photo-2.jpg into public/images/. */
  photos: ["/images/photo-1.jpg", "/images/photo-2.jpg"],
} as const;
