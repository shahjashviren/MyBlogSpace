# Jash Shah — personal blog

## Run it

```bash
pnpm install     # first time only (needs Node 20+: node -v)
pnpm dev         # open http://localhost:3000
```

Other commands: `pnpm build` (production build) · `pnpm start` (serve the
build) · `pnpm lint` (check code).

---

## 📸 How to add YOUR photos (very simple)

Your photos live **only on your computer** — they are never pushed to GitHub
(this folder is ignored on purpose).

**Step 1 — prepare the two photos**

1. Open the photos on your phone/computer.
2. Make sure they are saved as **JPG** (on iPhone: Share → Save as JPEG;
   on Android/PC: "export" or "save as" → JPG). Any size works — bigger
   looks sharper (1000 px wide or more is plenty).
3. Rename them **exactly**:
   - `photo-1.jpg`  (first photo)
   - `photo-2.jpg`  (second photo)
   - ⚠️ no spaces, no capitals, `.jpg` at the end. If Windows hides
     extensions, turn on "File name extensions" in the File Explorer View
     menu before renaming.

**Step 2 — put them in the right folder**

```
jash-site/
└── public/
    └── images/        ← drop photo-1.jpg and photo-2.jpg RIGHT HERE
```

**Step 3 — refresh the browser**

That's it. If `pnpm dev` is running, just refresh http://localhost:3000 —
your photos appear in the slideshow on the right side of the homepage.
If you see the "JS" monogram placeholder, the files aren't named/located
right — check Step 1 again.

> The homepage background is a gradient by design — no image needed there.

---

## Where things live

| I want to change… | Edit this |
|---|---|
| Name, tagline, social links | `src/lib/site.ts` |
| Colors (dark + light themes) | `src/app/globals.css` → `:root` and `[data-theme="light"]` |
| Homepage sections | `src/app/page.tsx` |
| Fonts | `src/app/layout.tsx` |

Sections (About, Writing, Projects, Experience, Connect) arrive in **M2** —
the strip under the homepage says so until then.
