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
| Icons | lucide-react, reicon |
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

All three are client-side (`VITE_*` values are embedded in the browser bundle — never put a secret here).

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `VITE_MAPBOX_TOKEN` | Mapbox → Account → Access tokens (public `pk.*`, URL-restricted) |

> `.env.local` was committed to this repo until recently. If you are working from an older clone, see [`SECURITY-ROTATION.md`](SECURITY-ROTATION.md) — those credentials are considered compromised.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run lint` | ESLint |
| `npm run spell:check` | cspell, Spanish + English |

## Layout

```
src/
  App.jsx              route table (all routes lazy except /inicio)
  main.jsx             entry
  supabaseClient.js    Supabase client + readiness guards
  mapLocationsStore.js useSyncExternalStore store over ubicaciones_mapa
  inicio/              landing page
  mapas/               Mapbox route map (+ Mapas.jsx at src root)
  rutas-interactivas/  illustrated SVG route explorer
  acerca de/           about page  (note: folder name contains a space)
  admin/               admin back office, ~8,500 lines
  lib/notifications.js wrapper over the send-notification edge function
supabase/
  config.toml
  migrations/          ordered schema — see docs/DATABASE.md
  functions/send-notification/
docs/                  DATABASE.md, LINT-BASELINE.md
public/assets/         runtime assets, referenced by URL string
```

## Routes

`/inicio` · `/mapas` · `/glosario` · `/galeria` · `/galeria2` · `/mis-aportes` · `/acerca-de` · `/rutas-interactivas` · `/terminos-y-condiciones` · `/terminos-de-uso-y-cookies` · `/admin` · `/admin/panel/*`

## Database

Schema lives in `supabase/migrations/`, ordered by dependency. Read [`docs/DATABASE.md`](docs/DATABASE.md) before touching it — it documents the ordering, the migration that closed a storage RLS hole, and seven known issues that are still open.

## Known gaps

Deliberately recorded rather than hidden:

- **No tests.** Nothing automated verifies behaviour; every change needs a manual click-through.
- **Lint debt.** 95 findings, 27 of them in `src/Mapas.jsx`. Pre-existing categories are downgraded to warnings so CI can be green while new regressions are still blocked. See [`docs/LINT-BASELINE.md`](docs/LINT-BASELINE.md).
- **Open security items.** Admin route guard fails open and never re-checks role; signup emails plaintext passwords; the notification function is an open relay. See [`SECURITY-ROTATION.md`](SECURITY-ROTATION.md).
- **CSS duplication.** ~20,000 lines of global CSS with 8 competing `:root` blocks, 6 duplicate `@font-face` declarations, 12 separate Google Fonts `@import`s, and a real `.footer__*` collision between `styles.css` and `Footer.css`.
- **Dead surfaces.** `/mi-blog` is linked from `TopBar.jsx` but has no route; `admin/ContentEditor.jsx` is routed but has no sidebar entry; `/galeria2` is an unfinished redesign reachable from one button.
- **Design sources live outside the repo.** `rutas1/`, `glosario1/`, `glosario/`, `diseños glosario/`, `diseño galeria/`, `recursos/` (267 MB of Figma/QGIS output) were removed and archived. `public/assets/` is the live asset source and is unaffected.

## Contributing

CI runs install → lint → spell → build on every push and PR. `npm ci` requires `package-lock.json` to stay in sync with `package.json` — commit both together.
