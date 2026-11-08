# Beecome Through Play: full redesign (two designs)

Two complete versions of the site, built from the `ui-*` web skills and her original palette
(teal, aqua, wreath greens, white; no yellow), with her line-art bee.

- **Playroom**: aqua shelves, building blocks, cubbies, folder-tab menu.
- **Honeycomb**: hexagon logo, honeycomb hero, hexagon icon badges and steps.

Both share the same content, blog and questionnaire; only `src/themes/<name>/` differs.

## Build

```bash
npm install
node scripts/build.mjs       # writes dist/playroom, dist/honeycomb and dist/index.html (the "choose a design" page)
```

`dist/` works straight from a folder (double-click `dist/index.html`): blog posts are pre-rendered
and the icons are built into every page.

## Where things live

| Path | What |
| --- | --- |
| `src/pages/*.html` | Page content (shared by both designs) |
| `src/posts/*.md` | Blog posts (become `post-<name>.html`) |
| `src/content/site.js` | Contact links, memberships, locations |
| `src/content/questionnaire.js` | Google Form field numbers for the questionnaire |
| `src/css/base.css` | Shared layout and components |
| `src/themes/<name>/` | Each design's colours, shapes, hero, page art and footer art |
| `src/js/` | Menu, Display settings, questionnaire wizard, bee animations |

## Checked with

- checkcraft on every page of both designs: 0 errors, 0 warnings (light, dark, phone, tablet, 200% text).
- Questionnaire walkthrough with the Google submission intercepted: all 32 answers map to the right form fields.
