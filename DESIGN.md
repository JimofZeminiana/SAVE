# DESIGN.md — SAVE

> Read order: tokens in `stile-test.css` and in the `<style>` of `index.html` → this file.

## 1. Product truth
- **Users:** people who live or see gender-based violence (often on a phone, sometimes on a device someone else may check), and professionals in the network (operatori).
- **Purpose:** recognise forms of violence, find a centre, know what to do for someone close, and give operatori the risk-assessment tools.
- **Constraints:** quick exit always visible (button + Esc); the page title is a decoy ("Meteo di oggi"); nothing is sent anywhere, answers stay in the browser; Italian only; AA contrast.
- **Real content:** PDFs and guides in `paper/`, data in `centri-*.js`, `attivita-data.js`.

## 2. Design Read and surface types
Reading this as: a resource map for citizens and operatori, with a quiet ruled-paper language (SEI-style rules, Inter Light), on static HTML/CSS/JS.

| Surface | Type | V | M | D |
|---|---|---|---|---|
| `index.html` (shell + rail) | read / operate | 3 | 2 | 6 |
| questionnaires, orientamento, SARA-S | operate | 2 | 3 | 5 |
| cosa-fare, stare-accanto, The Small Act | read | 3 | 3 | 5 |
| trova-centro, archivio, attività | operate | 3 | 2 | 7 |

## 3. Visual direction and project bans
- Black hairlines and ruled rows instead of cards and shadows. One box radius (12px) for ruled containers, pills only for controls.
- Large Inter Light for titles is the house look (deliberate, documented exception to "weightless display").
- Colour has a job: maroon = exit and operatori, vermilion = tool to use, ochre = something to read. Nothing else is coloured.
- Bans: no decorative eyebrows above titles (source names go in the facts box as "Fonte"), no decorative 01/02/03 numbers, no imagery of people, no metrics.
- Allowed: backdrop blur only on sticky bars that content scrolls under; edge fade only on horizontal scrollers; small step labels ("Domanda 3 di 12", "Sezione 2 di 7") above a question, since they are real sequence.

## 4. Color tokens

```design-tokens
fonts: Inter
colors: #ffffff, #151515, #6b6b6b, #e8e8e8, #7b002c, #ff5233, #bd8100, #888888, #f1f1ef, #a3a3a0, #2a2a2a, #d8507a, #ff6c52, #d9a43a, #a3123f, #fff, #000
radii: 0, 2px, 4px, 5px, 12px, 999px, 50%, inherit
```

| Token | Light | Dark | Job |
|---|---|---|---|
| `--paper` | #ffffff | #151515 | page |
| `--ink` | #151515 | #f1f1ef | text and rules |
| `--muted` | #6b6b6b | #a3a3a0 | secondary text |
| `--land` | #e8e8e8 | #2a2a2a | tracks, empty states |
| `--maroon` / `--exit` | #7b002c | #d8507a / #a3123f | quick exit, operatori |
| `--vermilion` | #ff5233 | #ff6c52 | tools |
| `--ochre` | #bd8100 | #d9a43a | reading |

## 5. Typography
- One family: Inter (opsz), 300 for body and display, 500 for emphasis.
- Scale: `--t-small` .8125rem · body 1.0625rem · `--t-intro` 1.25–1.525rem · `--t-question` 1.5–2.125rem · `--t-title` 3–6.5rem.
- Titles `text-wrap: balance`, leads `text-wrap: pretty`.

## 6. Spacing and layout
- Max width 1440px, gutter `clamp(16px, 3vw, 40px)`. Reading blocks capped at 36em / 62ch.

## 7. Components
- Ruled rows (`.test-row`) for lists of destinations; ruled boxes (`.box`, `.cells`) for facts and short groups; pills for buttons and filters.

## 8. Motion
- `--ease: cubic-bezier(.32,.72,0,1)`, steps settle in .48s and leave in .2s; everything off under `prefers-reduced-motion`.

## 11. Decision log
- 2026-10-29 · Removed decorative kickers above page titles; source names moved to the facts box. Removed 01–06 numbers on "Cosa fa un centro". Comunità view now links to Cosa fare caso per caso, Come stare accanto and The Small Act. Subpage home links point to `index-pagina-unica.html`.
- 2026-10-29 · Rail split by audience following the "SAVE Repository" scheme (see `ARCHITETTURA.md`): each tab lists its own sections, then "In comune con…" and the shared Test, Attività, Risorse e media. Groups carry `audience` (citizen / operator / both); a link into the other tab switches tab. New views: `#percorsi` (Attività hub), `#handbook` (archivio filtered by `?tipo=`). "Evidenze operative" became Metodologie, "Documenti usati" became Letteratura scientifica.
- 2026-10-29 · `index-pagina-unica.html` is now `index.html`; the previous `index.html` is kept as `index-old.html`. Subpage links updated.
