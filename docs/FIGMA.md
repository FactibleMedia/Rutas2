# Figma

**File:** Página Web Rutas de Valledupar
**URL:** https://www.figma.com/design/xWVp3VADrMQFDbI8P0DCM0/Página-Web-Rutas-de-Valledupar
**File key:** `xWVp3VADrMQFDbI8P0DCM0`
**Access:** connected via the Figma MCP under the `Factible Media` account (confirmed working — `whoami` and `get_metadata` both succeed).

This is a large, actively-worked file — not a small clean handoff. It mixes finished-looking screens with animation tests and exploratory duplicates on the same page, at real scale (the "Diseño" page alone is ~660,000 characters of metadata). **Don't call `get_design_context` on a whole page** — it'll blow the context budget. Get the node ID for a specific frame first (from the table below, or `get_metadata` scoped to a section) and load `figma-design-to-code` guidance before calling it, per that tool's own instructions.

## Pages

| Page | Node ID | Contents |
|---|---|---|
| Diseño | `0:1` | The actual screens/prototype — one canvas, frames scattered across a large pasteboard, not organized into sections |
| Componentes | `82:1523` | Design-system counterpart to `src/styles/` — buttons, nav states, animation variants, category chips, grouped into named `<section>`s |

## Screen frames on "Diseño" → app route

Matched by name against `README.md`'s route list. Node IDs are as of the exploration in this doc — re-run `get_metadata` if the file has moved on.

| Route | Frame name | Node ID | Size |
|---|---|---|---|
| `/inicio` | Inicio completo | `161:3153` | 1920×1137 |
| `/inicio` (alt/longer) | Inicio completo 2 | `2797:32763` | 1920×5354 |
| `/inicio` (alt, wide) | Inicio completo | `2797:32646` | 10065×1266 |
| `/mapas` | Mapa completo | `161:3174` | 1920×1080 |
| `/mapas` (alt) | MAPA | `504:10692` | 3938×1126 |
| `/mapas` (alt, wide/strip) | Mapas | `150:2337` | 8726×1666 |
| `/glosario` | Glosario Inicio | `3:1047` | 1920×1137 |
| `/glosario` (alt) | Glosario costeño | `504:9953` | 3975×1042 |
| `/galeria` | Galería | `845:27347` | 1920×1137 |
| `/galeria` (patrimonial filter) | Galería patrimonial | `2343:37185` | 1920×1080 |
| `/galeria` (gastronómica filter) | Galería Gastronómica | `1682:25845` | 1920×1080 |
| `/acerca-de` | Acerca de | `1415:22149` | 1920×1137 |
| `/acerca-de` (decorative pattern) | Patron | `1415:22395` | 1920×991 |
| `/acerca-de` (contact section) | Contacto | `1107:22330` | 1920×1080 |
| `/rutas-interactivas` | Rutas | `2748:33075` | 1920×1080 |
| `/rutas-interactivas` (patrimonial) | Ruta patrimonial | `2140:139` | 453×1260 |
| `/rutas-interactivas` (gastronómica) | Ruta gastronómico | `2142:148` | 458×762 |
| `/rutas-interactivas` (mística) | Ruta mística | `2142:199` | 458×945 |
| `/terminos-y-condiciones` | Términos y condiciones | `3:1484` | 1920×3362 |
| SubmitWordModal | Escribir la palabra | `442:16472` | 1920×1080 |
| AuthModal (register) | Registro *(symbol)* | `150:1578` | 500×832 |
| AuthModal (login) | Iniciar sesión *(symbol)* | `150:1652` | 500×636 |
| AuthModal (forgot password) | Recuperar la contraseña *(symbol)* | `150:1667` | 500×511 |
| ProfileModal? | perfil *(instance)* | `2387:31988` | 1201×779 |
| Mobile viewport reference | Telefono | `2264:32409` | 402×874 |

**Not found at the top level** (may not be designed yet, or nested deeper — didn't do a full recursive search): `/mis-aportes`, `/terminos-de-uso-y-cookies`, `/admin` and `/admin/panel/*`. The admin back office in particular is often intentionally left undesigned for internal tools — don't assume it's missing by accident.

**Ambiguity to resolve before implementing, not now:** `/inicio` and `/mapas` each have 2–3 candidate frames at different sizes/aspect ratios (likely current vs. superseded iterations, or a wide multi-state animation strip rather than a single screen). Same for `/glosario`. **Ask which one is current before building from it** — don't guess.

Everything else on the page (`Carga 1-4`, `Prueba ani*`, `Animación *`, the `Categorías selección*` sections) reads as loading-state mockups, animation prototyping, or exploratory scratch work rather than a screen to implement 1:1. Treat frame names containing "Prueba," "Animación," or a trailing number as draft/exploration unless told otherwise.

## Componentes page — sections

Grouped by `<section>` in the file; useful for finding button/nav/state variants when implementing a screen from the table above.

`Animación palabras` · `Animación en las palabras fal` · `Botones generales` (the actual interactive-button variants — Explora, Rutas/Mapas nav, Iniciar sesión, Recuperar contraseña, Escribe tu palabra, Mandar palabra, Ver ahora, Botón términos, social icons, Nivel 2 Razón, etc.) · `Aniamción Galeria` · `Acerca de` · `Navegador` (TopBar states: `Navegador inicio`, `Navegador sesión iniciada` with Cuenta iniciada / Buscador / Navegador Mapa sub-states, `Nav Item` with Enabled/Hover/Pressed/Active/Disabled) · `Palabras popu` (glossary stamp-card variants) · `Glosario Cat` (glossary category chips, including a full Spanish-alphabet `Glosario categorias Abecedario` set) · `Glosario inicio` · `Galería` (gallery card/animation variants) · `Input Contacto`.

## Workflow

1. Before implementing any screen, load the `figma-design-to-code` skill (mandatory — the MCP tool itself refuses good output without it).
2. Get the node ID from the table above (or `get_metadata` on a specific section if it's not listed).
3. `get_design_context` on that node — returns reference code + a screenshot + metadata to adapt to this project's existing components and `src/styles/` tokens, not to paste in verbatim.
4. Cross-reference `src/styles/tokens.css` before inventing new color/spacing values — the design system doc (`README.md`'s "Design system" section) explains what's already tokenized.
