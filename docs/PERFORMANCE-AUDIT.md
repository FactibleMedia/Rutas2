# Imagery & payload audit — 2026-09-04

Snapshot of what the site actually downloaded before this pass, what changed,
and what is still outstanding. Measured with a headless Chromium run against
`npm run preview`, summing `content-length` per response on a cold load at
1440×900, no scrolling.

## Headline finding

The homepage downloaded **714 MB**. Not the local assets in `public/` — those
total ~6 MB — but the Supabase-hosted gallery images, which are camera
originals: **6000×4000 PNGs, 25–50 MB each**, rendered into a 1175×510 slide.
The carousel holds **51 slides** and mounted every one of them at once.

`loading="lazy"` was already on those `<img>` tags and did nothing, because
every slide is stacked at the same position inside the viewport — the browser
correctly considers all 51 "visible" and fetches the lot.

## Before / after

| Route | Before | After | |
|---|---|---|---|
| `/inicio` | 714.5 MB | **63.2 MB** | −91% |
| `/acerca-de` | 13.4 MB + 67 MB video | **13.4 MB**, video deferred | video off the critical path |
| `/glosario` | 2.30 MB | 2.30 MB | already fine |
| `/galeria` | 296.9 MB | 296.9 MB | **unchanged — see Outstanding** |

Repo/deploy payload:

| | Before | After |
|---|---|---|
| tracked `public/` | 151 MB | **6.2 MB** |

## What changed

**Homepage carousel windowing** (`src/inicio/InicioPage.jsx`)
Only the active slide and its two neighbours mount an `<img>`; the rest render
empty until the carousel reaches them. Verified: 51 slides, 3 images mounted,
advancing loads the next correctly.

**Manifesto video** (`src/acerca de/AcercaDe.jsx`)
- Re-encoded 1080×1920 @ 11.9 Mbps → 540×960 CRF 32, audio stripped, faststart:
  **66.9 MB → 5.09 MB**. At the element's actual render width (≤380 px) the two
  are visually indistinguishable — compared frame-for-frame before adopting.
- The 77.5 MB `.mov` is **deleted**. No browser ever fetched it: `<source>` order
  put MP4 first and every browser that reads QuickTime also reads H.264 MP4.
- `preload="none"` + a 17 KB poster + an IntersectionObserver that only attaches
  the source when the section is within 300 px of the viewport. Confirmed: not
  fetched on load, fetched on scroll.

**Upload compression** (`src/lib/compressImage.js`, new — the durable fix)
All four upload paths (`GalleryManager`, `TeamManager`, `RouteForm`,
`ProfileModal`) now resize to a 2000 px long edge and re-encode to WebP q0.82
before hitting Storage; avatars cap at 512 px. Falls back to the untouched file
on any decode/encode failure, and never uploads something larger than the
original. This is what stops the 6000 px originals recurring.

`cacheControl` on those uploads went from `3600` (1 hour) to a year — the
filenames are already unique per upload, so revalidating hourly bought nothing.

**Local images**

| file | before | after |
|---|---|---|
| `gallery/shadows.png` | 1296 KB | **175 KB** WebP |
| `gallery/image_02.png` | 257 KB | **36 KB** WebP |
| `gallery/image_00.png` | 217 KB | **24 KB** WebP |
| `gallery/image_01.png` | 201 KB | **16 KB** WebP |
| `favicon.png` | 190 KB | **32 KB** (192 px) |

Alpha channels were checked per file and preserved (`shadows` is 77%
transparent). Superseded PNGs, the orphaned `postal3.webp` /
`Postal_Plaza_CON MARCO 1.webp`, and both video originals are untracked and
gitignored — still on disk locally, just no longer shipped.

**Lazy loading** added to below-the-fold images in `Footer.jsx` (5) and
`AcercaDe.jsx` (9, including the remote Unsplash team photos), with
`decoding="async"` alongside.

## Outstanding — needs your call

**1. `/galeria` still transfers 297 MB.** Same root cause as the homepage, but
windowing doesn't apply: it's a grid the user genuinely scrolls through, and
each thumbnail is a 25–50 MB original. No client-side change fixes a 40 MB
thumbnail.

The fix is to re-compress the ~51 images already in the `media-rutas` bucket.
That means downloading, re-encoding, and re-uploading **production storage
objects**, so it isn't something to run unattended — say the word and I'll write
the migration script for you to review before it touches anything.

**2. Supabase image transforms are not available on this plan.** The
`/render/image/public/...` endpoint returns `429 Too many requests`, the free-tier
response. Enabling transforms (Pro) would make this a URL-parameter change
instead of a re-upload, and would cover future uploads regardless of what the
admin flow does. Worth pricing against the migration work.

**3. `.git` is 616 MB.** The videos were committed in `64c6d37`, so removing
them now shrinks the deploy but not the history — the blobs are still in there.
This repo went 531 MB → 54 MB via `git-filter-repo` in the `chore/repo-hygiene`
pass; undoing this would need the same treatment, coordinated with everyone
holding a clone. Cloning is the only thing affected; deploys are not.

## Integrity

`npm run build`, `npm run lint` (0 errors, 63 warnings — unchanged baseline),
`npm run check:assets` (91 references, all resolve). All five main routes load
with no console errors and no broken images.
