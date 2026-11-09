# Jash Shah — Personal Blog Website

Night-city dark theme · emerald-botanical light theme · portal-wipe theme switch ·
orbiting 3D laptop projects around a live server rack · red 0/1 flicker field ·
rich-text blog with comments.

Live site: hosted on **Vercel**, code on **GitHub**.

## A note for visitors

- Welcome in — this space is where I share projects, experience and writing.
- Drag the laptops in the projects section to spin them; click one to open it.
- Every blog post can be liked and commented on — say hi, I read everything.
- Flip the theme toggle in the header; the site remembers your choice.
- Found a bug or have feedback? The connect section has my email — I'd love to hear it.

## Tech stack

| Layer | Tech |
|---|---|
| Framework | **Next.js 16** (App Router) with **React 19** |
| Language | **TypeScript** |
| Styling | **Tailwind CSS 4** + hand-written CSS (custom 3D scenes & animations) |
| Rich-text editor | **TipTap 3** (headings, lists, images, tables, video embeds) |
| Auth & database | **Firebase** — Authentication (owner login) + Firestore (posts, projects, comments) |
| Media | **Cloudinary** CDN for image uploads & optimization |
| Package manager | **pnpm** |
| Hosting | **Vercel** (auto-deploys on every push to GitHub) |

## Run it locally

```bash
pnpm install
pnpm run dev
```

Open http://localhost:3000 — run these in the folder that contains `package.json`.

## Project structure

```
src/
  app/         Next.js routes (home, /blogs, /blogs/[slug], /dashboard, /login, API routes)
  components/  UI components & sections (Hero, SolarProjects, dashboard panels, editor…)
  lib/         Firebase config, Cloudinary helpers, site content, types, store
```
