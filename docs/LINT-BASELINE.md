# Lint Baseline

ESLint was introduced during the repo cleanup. The project had **no JavaScript linting at all** before this (the only static analysis was Spanish spell-check via cspell).

The first run surfaced **95 findings: 51 errors, 44 warnings.**

Failing CI on all of them immediately would have blocked every future PR, so the rule categories that were already violated are downgraded to `warn` in `eslint.config.js`. They are **not** suppressed — they print on every run, and every rule *not* on that list still fails the build. New regressions in other categories are blocked from day one.

## Baseline inventory

### Errors (downgraded to warn — burn these down)

| Count | Rule | What it means |
|---|---|---|
| 19 | `react-hooks/set-state-in-effect` | `setState` called synchronously in an effect body → cascading re-renders |
| 12 | `no-empty` | Empty block, usually a swallowed `catch {}` — hides real failures |
| 10 | `react-hooks/immutability` | State or props mutated directly |
| 6 | `react-hooks/refs` | Ref accessed during render, or otherwise misused |
| 2 | `react-hooks/purity` | Side effect during render |
| 1 | `react-hooks/preserve-manual-memoization` | Broken `useMemo`/`useCallback` dependency contract |
| 1 | `no-useless-assignment` | Value assigned then immediately overwritten |

### Warnings (already non-blocking)

| Count | Rule |
|---|---|
| 31 | `no-unused-vars` |
| 13 | `react-hooks/exhaustive-deps` |

### Concentration by file

| Errors | File |
|---|---|
| 27 | `src/Mapas.jsx` |
| 3 | `src/admin/AdminPanel.jsx` |
| 2 | `src/Gallery2.jsx` |
| 2 | `src/GalleryPage.jsx` |
| 2 | `src/Glossary.jsx` |
| 2 | `src/admin/GalleryManager.jsx` |
| 2 | `src/admin/GlossaryManager.jsx` |
| 2 | `src/admin/RoutesInteractivasManager.jsx` |

## Why `Mapas.jsx` dominates

`src/Mapas.jsx` is 2,184 lines with **36 `useState` and 9 `useEffect`**, coordinating Mapbox GL, `navigator.geolocation`, the Web Speech API, live re-routing, and navigation state persisted to `sessionStorage`. More than half the codebase's correctness findings are in this one file. It is the highest-value refactor target, and it should be split before it is fixed.

## Burn-down

There are **no tests**, so fixing these requires manual verification per change. Suggested order — cheapest and safest first:

1. **`no-empty` (12)** — mechanical. Each is a swallowed error; either log it or handle it. Low risk, immediate diagnostic value.
2. **`no-unused-vars` (31)** — mechanical dead-code removal.
3. **`react-hooks/exhaustive-deps` (13)** — review each individually. Some are genuine stale-closure bugs; some are deliberate. Add an explicit `eslint-disable-next-line` with a *reason* where deliberate.
4. **`react-hooks/set-state-in-effect` (19)** — real re-render churn. Usually fixed by deriving state during render or moving the update into an event handler.
5. **`react-hooks/immutability` / `refs` / `purity` (18)** — most are inside `Mapas.jsx`; do these as part of splitting that file, not before.

As each category reaches zero, delete its line from the downgrade block in `eslint.config.js` so it starts failing the build again.

## Commands

```bash
npx eslint src                 # full report
npx eslint src --fix           # auto-fixable subset
npx eslint src/Mapas.jsx       # single file
npm run lint                   # what CI runs
```
