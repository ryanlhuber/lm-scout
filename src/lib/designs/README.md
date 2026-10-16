# Design iterations

The header dropdown switches the whole site between these iterations. The choice comes from `?design=<id>` (shareable) or a cookie that remembers the last pick, and `hooks.server.ts` renders it into `<html data-design>` so the first paint is already correct.

Each iteration re-skins the shadcn-svelte tokens in `tokens.css`, so shared components (the Select dropdown, the model detail page) follow it. The home page is a separate component per iteration in `<id>/Home.svelte`. All of them read one shared `Catalog` (`$lib/catalog-state.svelte.ts`), so switching keeps the loaded models and any active filters.

Directions were planned with Anthropic's frontend-design skill: what LM Scout is (a way for engineers to narrow a large model catalog down by price, context, reasoning, and capabilities), a token plan for each direction, then a check against the generic defaults the skill lists.

| Id | Idea | The one memorable thing | Type | Palette |
| --- | --- | --- | --- | --- |
| `original` | The current interface, unchanged | — | System sans | Neutral shadcn |
| `field-guide` | A naturalist's field guide: each model is an entry, grouped by family | Italic specimen names under family headings, with a sticky family index | Alegreya, Alegreya Sans | Sage paper, forest ink, moss, marker yellow |
| `datasheet` | An electronics part datasheet | Features / Applications / Description, then a sortable characteristics table | Archivo (width axis) | White, navy ink, datasheet blue |
| `stat-cards` | Collectible stat cards | Pick two cards and see who wins each of five stats | Bricolage Grotesque | Cobalt, white cards, sunshine yellow |
| `price-map` | A chart first, list second | Interactive scatter of input price against context window, with the frontier line | Schibsted Grotesk | Quiet chart-paper grays; a validated three-hue series palette |
| `matchmaker` | A conversation, not a catalog | A fill-in sentence that drives ranked matches | Red Hat Display, Red Hat Text | Lilac, plum ink, marigold |

To add an iteration, add it to `registry.ts`, add a token block to `tokens.css`, create `<id>/Home.svelte`, and register the component in `src/routes/+page.svelte`.
