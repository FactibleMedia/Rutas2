# Rutas de Valledupar

Interactive cultural-routes site for Valledupar, Colombia: guided city routes on a live map, a vallenato glossary open to community submissions, a multimedia gallery, and an admin back office.

## Stack

| Layer | Choice |
|---|---|
| UI | React 19, React Router 7 |
| Build | Vite 8 |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Maps | Mapbox GL JS 3 |
| Animation | framer-motion |
| Icons | lucide-react |
| Hosting | Vercel |

No TypeScript and no tests yet — see [Known gaps](#known-gaps).

## Getting started

Requires Node **>= 20.19**.

```bash
npm ci
cp .env.example .env.local   # then fill in real values
npm run dev
```

### Environment

These are client-side (`VITE_*` values are embedded in the browser bundle — never put a secret here).

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `VITE_MAPBOX_TOKEN` | Mapbox → Account → Access tokens (public `pk.*`, URL-restricted) |
| `VITE_MAINTENANCE_MODE` | Set to `true` to gate every public route behind `src/MaintenancePage.jsx`; `/admin` and `/admin/panel` stay reachable. Defaults to off. |

> `.env.local` was committed to this repo until recently. If you are working from an older clone, see [`SECURITY-ROTATION.md`](SECURITY-ROTATION.md) — those credentials are considered compromised.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run lint` | ESLint |
| `npm run spell:check` | cspell, Spanish + English |
| `npm run check:assets` | confirms every `/assets/...` string in the source resolves to a real file under `public/` |

## Layout

```
src/
  App.jsx              route table (all routes lazy except /inicio)
  main.jsx             entry — imports styles/{fonts,tokens,reset,components}.css
  styles/              design system — see below
  supabaseClient.js    Supabase client + readiness guards
  mapLocationsStore.js useSyncExternalStore store over ubicaciones_mapa
  inicio/              landing page
  mapas/               Mapbox route map (+ Mapas.jsx at src root)
  rutas-interactivas/  illustrated SVG route explorer
  acerca de/            about page  (note: folder name contains a space)
  admin/               admin back office, ~8,500 lines
  lib/notifications.js wrapper over the send-notification edge function
supabase/
  config.toml
  migrations/          ordered schema — see docs/DATABASE.md
  functions/send-notification/
docs/                  DATABASE.md, LINT-BASELINE.md
public/assets/         runtime assets, referenced by URL string — checked by `npm run check:assets`
public/fonts/          Heritage Sans, Trattatello — .woff2 primary, .otf/.ttf fallback
```

### Design system (`src/styles/`)

Four files, imported once from `main.jsx` rather than scattered per-component:

| File | Contents |
|---|---|
| `tokens.css` | `--ds-*` palette (RGB triplets), font stacks, a pill-radius token, a letter-spacing scale, and the recurring shadow families |
| `fonts.css` | Every `@font-face` and the one consolidated Google Fonts request |
| `reset.css` | The one real global reset (box-sizing, body background/font) |
| `components.css` | Shared treatments unified only where the source CSS was byte-identical across files — the paper-texture background and the primary CTA button |

Existing per-file `:root` blocks (`styles.css`, `Glossary.css`, `GalleryPage.css`, `AuthModal.css`) still define their own variable names (`--orange`, `--glos-primary`, etc.) — those now resolve *through* the shared tokens rather than repeating the hex value, so a color still only needs to be corrected in one place. Component classes were **not** globally rewired to new names; that would touch ~1,000+ declarations across 18,000+ lines of CSS for marginal gain over the token-indirection approach. `--font-heritage` deliberately still has two different values between `styles.css` (`serif` fallback) and `Glossary.css`/`GalleryPage.css` (`Georgia, serif` fallback) — a real pre-existing inconsistency, not a duplicate.

## Routes

`/inicio` · `/mapas` · `/glosario` · `/galeria` · `/mis-aportes` · `/acerca-de` · `/rutas-interactivas` · `/terminos-y-condiciones` · `/terminos-de-uso-y-cookies` · `/admin` · `/admin/panel/*`

## Database

Schema lives in `supabase/migrations/`, ordered by dependency. Read [`docs/DATABASE.md`](docs/DATABASE.md) before touching it — it documents the ordering, the migration that closed a storage RLS hole, and seven known issues that are still open.

## Known gaps

Deliberately recorded rather than hidden:

- **No tests.** Nothing automated verifies behaviour; every change needs a manual click-through.
- **Lint debt.** 65 findings remain (down from 95), about half in `src/Mapas.jsx`. Pre-existing categories are downgraded to warnings so CI can be green while new regressions are still blocked. See [`docs/LINT-BASELINE.md`](docs/LINT-BASELINE.md).
- **Open security items.** Admin route guard fails open and never re-checks role; signup emails plaintext passwords; the notification function is an open relay. See [`SECURITY-ROTATION.md`](SECURITY-ROTATION.md).
- **Missing video asset.** `AcercaDe.jsx` has a `<video src="/assets/acerca/video.mp4">` that was never actually committed (it was listed for Git LFS, but LFS was never configured). Flagged, not hidden, by `npm run check:assets`.
- **Remaining CSS duplication.** The design system (`src/styles/`) unified fonts, the dead footer copy, and a handful of byte-identical components (see above), but most of the ~18,000 lines of per-page CSS — card layouts, the ~15-shade orange family used across different surfaces, 182 distinct `box-shadow` declarations — is untouched. Unifying it further means touching component structure, not just shared values, and was out of scope for a "don't change the design" pass.
- **Dead surfaces.** `/mi-blog` is linked from `TopBar.jsx` but has no route; `admin/ContentEditor.jsx` is routed but has no sidebar entry.
- **Design sources live outside the repo.** `rutas1/`, `glosario1/`, `glosario/`, `diseños glosario/`, `diseño galeria/`, `recursos/` (267 MB of Figma/QGIS output) were removed and archived. `public/assets/` is the live asset source and is unaffected.

## Contributing

CI runs install → lint → spell → build on every push and PR. `npm ci` requires `package-lock.json` to stay in sync with `package.json` — commit both together.

### Remotes

`origin` is the `FactibleMedia/Rutas2` fork; `upstream` is the original `jogutierrezc/Rutas2` repo, where FactibleMedia now has write access limited in practice to a `deploy` branch (never `main`, which stays Jose's). Routine pushes go to `origin` as normal; `npm run push:both` pushes the current branch to `origin` and to `upstream:deploy` in one step. See `CLAUDE.md` for the full setup.
