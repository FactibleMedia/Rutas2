# CLAUDE.md

Guidance for Claude Code (or any agent) working in this repo.

## What this is

"Rutas de Valledupar" — a React 19 + Vite 8 + Supabase + Mapbox SPA for a cultural-tourism site: an interactive route map, a community-editable vallenato glossary, a multimedia gallery, and an admin back office. See `README.md` for the full stack table, environment variables, and route list — don't duplicate that here.

This repo was heavily rehabilitated across two sessions (git log tells the story: `chore/repo-hygiene` cleanup, then a `feat/design-system` pass). Both left detailed commit messages and companion docs — **read the commit message before re-deriving context from the diff.**

## Design source: Figma

There's a working prototype in Figma — **"Página Web Rutas de Valledupar,"** connected via the Figma MCP (`Factible Media` account). Read `docs/FIGMA.md` before touching it: the file key, a frame-name → app-route map with node IDs, and — important — several routes have 2-3 candidate frames at different sizes (superseded iterations, or animation strips rather than single screens). **Don't guess which one is current; ask.** The `Componentes` page is the Figma-side counterpart to `src/styles/` — check it for existing button/nav/state variants before inventing a new one. `figma-design-to-code` skill is mandatory before any `get_design_context` call, and never call it on a whole page (the "Diseño" page alone is ~660,000 characters of metadata) — get a specific node ID from the doc first.

## Remotes and the dual-push workflow

```
origin    -> github.com/FactibleMedia/Rutas2      (fork, full write access)
upstream  -> github.com/jogutierrezc/Rutas2        (original repo -- write access recently granted to FactibleMedia)
```

`upstream` here means "the original repo," not the traditional read-only sense — FactibleMedia has push access to it now, but only ever pushes to its **`deploy`** branch, never `main`. `main` on the original repo is Jose's and is never touched by anything in this workflow.

- Routine work: commit and push to `origin` on whatever feature branch you're on, same as any repo.
- To also update the deploy branch on the original repo: `npm run push:both` (runs `scripts/push-both.sh`) pushes the current branch to `origin/<branch>` **and** `upstream:deploy` in one step.
- `git push` alone only ever touches `origin` — `push:both` is opt-in, not automatic, so routine commits don't spam the original repo's `deploy` branch on every save.
- The branch pushed to `origin` was built on a **rewritten** git history (531MB → 54MB via `git-filter-repo`, done in the `chore/repo-hygiene` pass) that shares no common ancestor with `jogutierrezc/Rutas2`'s `main`. That's fine for `deploy` (a plain new-branch push doesn't require shared history), but if this is ever merged back into Jose's `main`, it'll need `--allow-unrelated-histories` or a squash-merge via PR, not a plain `git merge`.

## Before making changes

- **No tests exist.** Every change needs a manual click-through of the affected route(s) — see `README.md`'s route list. Don't claim something works without actually loading it (`npm run dev` and visit it, or `npm run build && npm run preview`).
- **`public/assets/...` paths are runtime strings, not build-time imports.** Renaming or deleting a file there fails silently (404 in the browser, not a build error). Run `npm run check:assets` after touching anything under `public/assets/`. It's also in CI.
- **This is a live production app with real users and a real Supabase project.** Nothing here is a sandbox. Treat schema changes, RLS policies, and anything touching auth with the same care as a deploy to prod, because it is one.
- **Verify float on visual changes.** Screenshots of this app are noisy — several pages have autoplay carousels, `requestAnimationFrame` orbit animations, and live Supabase-backed content, so two screenshots of *identical* code can differ by hundreds of thousands of pixels. Before treating a screenshot diff as a regression, re-shoot the *same* unchanged state once to establish the noise floor for that specific page, or use a computed-style check instead (see `scripts/verify-tokens.mjs` for the pattern). Don't trust a nonzero pixel diff on its own.

## Known landmines (read before touching)

- **`Mapas.jsx` (~2,150 lines) is the highest-risk file in the codebase.** Mapbox GL + geolocation + Web Speech API + live re-routing + `sessionStorage`-persisted navigation state, all in one component. It accounts for roughly half of the project's ESLint findings (see `docs/LINT-BASELINE.md`). Don't refactor it opportunistically alongside an unrelated change — it deserves its own dedicated pass.
- **Two parallel session systems**, neither aware of the other: `TopBar.jsx` owns the public user session (`localStorage` key `rutas_user_session`), `admin/adminAuth.js` owns the admin session (`rutas_admin_session`). No shared auth context exists anywhere in the app.
- **`admin/AdminProtectedRoute.jsx` fails *open*** when Supabase is unconfigured, and never re-checks the user's `rol` after the initial login — RLS is the only real backstop. See `SECURITY-ROTATION.md` for the full list of open security items (plaintext password in the welcome email, an open-relay notification function, a storage-RLS hole that has since been fixed).
- **`--font-heritage` deliberately has two different values** — `"Heritage Sans", serif` in `styles.css` vs `"Heritage Sans", Georgia, serif` in `Glossary.css`/`GalleryPage.css`. This is a real, pre-existing inconsistency, not a duplicate someone forgot to merge. Don't "fix" it without checking both pages render correctly either way.
- **`Frame 143726283.webp`** (`public/assets/acerca/`) is a portrait `background-size: cover` image spanning the whole `/acerca-de` page. It was deliberately *not* downscaled during the image-optimization pass (unlike every other converted image) because doing so would blur it on tall viewports. If you're auditing image sizes, this one's size is intentional.
- **`AcercaDe.jsx` has a `<video src="/assets/acerca/video.mp4">` that has never actually existed in the repo.** It's allowlisted in `scripts/check-assets.mjs` as a known gap, not a bug in that script. Someone needs to supply the file or remove the element — don't "fix" the check script instead.
- **`no-unused-vars` findings on component props** (currently in `NavMap.jsx` and `rutas-interactivas/InteractiveMap.jsx`) are left alone on purpose — the parent may still be passing them intentionally. Don't blanket-delete unused destructured props without checking the call site.

## The design system (`src/styles/`)

Four files, imported once from `main.jsx`: `tokens.css`, `fonts.css`, `reset.css`, `components.css`. Read the header comment in each before adding to it — they explain what was and wasn't unified and why (mostly: only byte-identical values were merged; the ~15-shade orange family and Mapas' own green ramp are visually distinct, not redundant, and were deliberately left alone). Component-level CSS across the ~20 remaining per-page stylesheets is still mostly unmerged; see the README's "Known gaps" for the reasoning on why that was out of scope.

If you add a new global token, prefix it `--ds-` — `admin/AdminPanel.css` already owns unprefixed generic names (`--primary`, `--surface`, `--outline`, `--error`) on the same global `:root`, and an unprefixed new token will silently collide with it.

## Database (`supabase/migrations/`)

Read `docs/DATABASE.md` before writing a new migration — it documents the dependency ordering and, more importantly, seven known issues that were deliberately left unfixed (not idempotent yet, `usuarios.rol`'s default violates its own CHECK constraint, two parallel user tables that can drift, an admin-escalation vector in `admin_update_usuario()`). Don't assume the schema is clean just because it's now in `supabase/migrations/` instead of loose root SQL files — the move fixed the *organization*, not every bug it documented.

## Scripts (dev tooling, not part of the app)

`scripts/*.mjs` are one-off verification tools written during the cleanup, kept around because they're still useful:

| Script | Use it when |
|---|---|
| `check-assets.mjs` | Wired into `npm run check:assets` and CI. Run after touching `public/assets/`. |
| `visual-snapshot.mjs` | Screenshots all routes at 2 viewports. Requires `npx playwright install chromium` once and `npm install --no-save playwright@1.49` (not a real dependency — installing it and running `npm install` again will silently remove it, so reinstall with `--no-save` each time you need it). |
| `verify-tokens.mjs` | Pattern for confirming a CSS custom-property refactor didn't change any computed value — more reliable than screenshot diffing for token-layer changes. |
| `verify-fonts.mjs` | Confirms `document.fonts` reports `status: loaded` for the local webfonts after a real browser render — use after touching `src/styles/fonts.css` or `public/fonts/`. |
| `snapshot-modal.mjs` | Opens the "sugerir palabra" modal on `/glosario` and screenshots it — the one common UI surface not reachable via a plain page load. |

None of these are dependencies of the app itself and none should become one without discussion.

## Commands

```bash
npm run dev            # http://localhost:5173, hot reload
npm run build           # -> dist/
npm run preview         # serve the build
npm run lint             # ESLint — see docs/LINT-BASELINE.md before treating a new warning as pre-existing
npm run spell:check      # cspell, Spanish + English dictionary in cspell.json
npm run check:assets     # public/assets/ path integrity
```

CI (`.github/workflows/ci.yml`) runs all of the above except `preview` on every push and PR. `npm ci` requires `package-lock.json` to stay in sync with `package.json` — if you add a dependency, commit both.
