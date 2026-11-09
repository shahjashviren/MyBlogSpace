# Jash Shah — Personal Blog Website

Night-city dark theme · emerald-botanical light theme · portal-wipe theme switch ·
3D solar-system projects · native rich-text editor · full owner dashboard on Firebase (free tier).

## ⚠️ FINAL SETUP (do these once — required for comment edit/delete)

1. **Firebase → Firestore Database → Rules** → paste the ENTIRE contents of
   `firestore.rules` from this zip → Publish. (Owner is now
   password-sign-in only — anonymous visitors can never touch your site.)
2. **Firebase → Authentication → Sign-in method → Anonymous** → **Enable**.
   (This gives every commenter's browser a durable identity so they — and
   only they — can edit/delete their own comments. If you skip this,
   comments still post; own-comment editing falls back to the session key.)
3. **Moderating comments**: be signed in via **Owner login** first.

## What's new — feedback round 3 (v10)

- **Brand**: header shows **Jash — My BlogSpace**, tab title **Jash Shah — My BlogSpace**.
- **Comments**: owner-first edit/delete (works under any rules version), visible
  error messages instead of silent failures.
- **Projects**: broken horizontal rain replaced by the **red flicker field** —
  72 digits drifting + blinking on black, randomly flipping 0↔1; **hand-built
  CSS server rack** (animated LEDs, no image); click-open fixed earlier.
- **Experience**: newest role always first; "+ Add role" inserts at the top.
- **Leaf trail**: fills the whole cursor path (fast flicks keep a continuous
  trail), cap 40.
- **Buttons**: all four social buttons stay on one line (desktop).
- **Back to home** sits below the header with proper breathing room.
- **Hobby markers**: redrawn clean hollow leaves.
- **Shy branch**: light theme only — never in dark.
- Backgrounds: **light botanical paper wallpaper** installed; dark wallpaper
  = your original skyline, enhanced (lively gold, left skyline filled,
  warm near-black sky) with a readability-tuned veil.

## What's new — feedback round 2 (v9)

- **Experience v2 (LinkedIn-style)**: role-first entries, org logos, location
  chip, **month pickers with auto duration** ("Oct 2026 – Present · 2 mos"),
  and **multiple roles inside one organization** ("+ Add role" in the editor —
  promotions, second positions). Public section has a **left timeline rail
  with a leaf node per organization**. Old entries still work — open Edit and
  press "Use LinkedIn-style roles" to convert one.
- **Projects**: **black stage + red binary "hacking" rain** (blue server/bolts
  kept — your redblue pick), **generated high-tech server image** (blends into
  the stage, breathing glow), laptops gained a **keyboard deck + webcam**,
  **click now opens the project** (pointer-capture bug fixed — Enter was the
  workaround), modal shows the **project image as a faded backdrop**.
- **Canopy branch v2** — denser sub-branches, ~24 clustered leaves, 3 berries;
  return-after-3.5s bug fixed (timer was cancelling itself).
- **Favicon**: transparent gold notebook-and-pen **SVG** (no black tile).
- **Glitch batch**: select options readable in dark, email icon visible at
  rest, hobby leaf markers bigger/brighter, reveals 0.75s→0.45s, hydration-safe
  storage reads (the likely "1 Issue"), leaf trail spawns at 13px (was 26).

## What's new — feedback round (v8)

- **Projects scene v3**: navy data-storm stage (both themes), orange 0/1
  binary rain, white ~360px laptops, blue server kept, click → modal.
- **Comments ⋯ menu**: each comment gets Edit / Delete. Your browser keeps a
  private `editKey` (sessionStorage) so only your tab can edit that row;
  edits show an **Edited** badge and the **original post time never changes**.
  The signed-in owner gets a hard Delete. Soft-deleted rows vanish for
  everyone. → **re-paste `firestore.rules`** after pulling this zip.
- **Blog cards show cover images** (cover → first body image → none), grid +
  list layouts.
- **Categories**: up to **3 comma-separated** per post; chips are human-made
  outline labels (no pills, no gold).
- **Experience org logos**: upload a crisp image in the dashboard; it renders
  beside the org name (falls back to letters when absent).
- **"Off the clock" card** replaced the old Now card — edit the title and
  one-hobby-per-line list from **Site Content**.
- **Shy tree branch** in the hero: it peeks from the right, dodges your
  cursor, returns after ~3.5s.
- **Header links work from /blogs** (smart `/#section` navigation).
- **YouTube defaults to 720p** (`vq=720`).
- **Browser Cloudinary test**: open `/api/cloudinary-sign` in a tab —
  JSON keys = configured, `503 not-configured` = missing env.
- **Social links**: fill **either** `links:` or `connect:` in `site.ts` —
  both now render (connect wins when set).
- **Images never vanish**: slideshow keeps its position across theme/page
  switches; reveals run once per session with a viewport safety net.
- **Wider shell (~1320px)**, tighter sections, calmer dark veil + text
  scrim, light-hero typography fixed (name/role/tagline wrap gone).

## Run it

```bash
pnpm install
pnpm run dev
```

Open http://localhost:3000 — run these in the folder that contains `package.json`.

---

## ONE-TIME SETUP (in order)

### 1. Firestore security rules (required)

1. https://console.firebase.google.com → project **Jash-BlogSpace**
2. **Build → Firestore Database → Rules** tab
3. Delete everything, paste the **entire contents of `firestore.rules`** (this folder) → **Publish**

This makes drafts private to you, public visitors read only *published* content,
comments validated, likes increment-only. Without it the dashboard can't save.

### 2. Cloudinary (image storage — free, no card) — ALREADY DONE ✓

If you haven't yet: sign up at cloudinary.com → note **Cloud name / API Key / API Secret**
→ Settings → Upload → Add upload preset → name `jash-blog` → Signing Mode: **Signed**.

Put the three values in **`.env.local`** (project root):

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=jash-blog
```

Without these, uploads silently fall back to Firestore (still works, compressed).

### 3. Your social links

Open **`src/lib/site.ts`** → `links:` → paste your URLs between the quotes
(linkedin, github, leetcode, substack, instagram, x, email). Save → live everywhere.
Empty links render as disabled chips (never jump the page).

### 4. Deploy to Vercel

1. Push the repo to GitHub (wallpaper ships automatically; photos never do)
2. Import in Vercel → add the **3 Cloudinary env vars** above (Settings → Environment Variables)
3. If login ever errors on the live URL: Firebase Auth → Settings → Authorized domains → add `*.vercel.app`

---

## Owner dashboard

Header right side: **Owner login** → sign in with your Firebase email/password →
redirected to the dashboard. While signed in the button says **Dashboard**.

| Tab | What you do there |
|---|---|
| Overview | Stats + **Load sample content** (first visit) |
| **Posts** | Native rich editor: headings, bold/italic/underline, lists, quote, links, highlight · **images** (button / Ctrl+V paste / drag-drop, inline in text, drag corners to resize, align) · **tables** (insert, rows/cols, header) · **video** (paste YouTube/Vimeo/.mp4 link → player at your cursor) · Write\|Preview · cover image · Draft ↔ Publish · autosave + **Clear draft cache** · live reading time |
| Projects | CRUD for the orbiting laptops (GitHub/live links, thumbnails) |
| Experience | CRUD for the experience list |
| Hero photos | Upload the two slideshow photos (compress → Cloudinary) |
| **Site Content** | Every line of public copy: hero greeting, name, role, tagline, WHO I AM, connect subtitle, all section headings, footer |

Everything saves to Firebase → **the public site updates instantly, no redeploy**.
Drafts are locked by security rules — only you can read them.

## Content rules of the road

- **Images**: originals preserved on Cloudinary (display served at ~1600px); if Cloudinary
  is unavailable they're compressed into Firestore records instead — never breaks.
- **Videos**: upload to YouTube → **Unlisted** → paste the link in the editor.
  Direct .mp4/.webm/.mov links also work (native player, fullscreen).
- **Wallpaper**: `public/images/wallpaper.jpg` ships with the code — don't delete it.
- Local `photo-1.jpg`/`photo-2.jpg` are optional fallbacks only (git-ignored).

## Tech

Next.js 16 · TipTap editor · Firebase Auth + Firestore · Cloudinary CDN · Spark plan ($0) friendly.
