# Skills used in this build

Every skill in `skills/` was read and applied where it fits this project.
Deferred items state the reason instead of pretending to ship.

| Skill | Used for | Where |
|---|---|---|
| brand | Voice table, mark, single-accent rule | `docs/brand-guidelines.md`, `tokens.css` |
| design | Logo mark (interchange glyph), icon set, banner | `apps/web/public/logo.svg`, `components/Icons.tsx`, `docs/banner.svg` |
| design-system | 3-layer tokens primitive→semantic→component, spacing/type scales | `styles/tokens.css` |
| ui-styling | Accessible buttons/inputs, utility composition (plain CSS tokens keep dep count low; Radix/shadcn deferred to v0.4 if the desktop shell needs dialogs) | `styles/editor.css`, panels |
| ui-ux-pro-max | Priority order — accessibility > touch > performance > style > layout > type/color > motion; 44px-ish targets via padding where density allows, SVG icons, no-emoji discipline | Toolbar, canvas, status bar |
| better-accessibility | Native buttons/inputs, `:focus-visible` rings, labels for every control, live regions, `role="application"` canvas with keyboard tools/Delete/Esc, reduced-motion kill switch, no color-only meaning | All components |
| better-colors | One neutral + one accent ramp, semantic tokens, line colors isolated as data colors | `tokens.css`, renderer |
| better-layout | Space groups (16px between groups), logical flow, one primary action per view (Export SVG), hint-at-hidden-content for collapsed panels on mobile | `editor.css`, `Editor.tsx` |
| better-typography | Type scale, unitless line-heights, tabular nums for zoom/coords, 16px inputs on mobile, balance/pretty wrapping | `tokens.css`, `editor.css` |
| better-ui | Radius nesting rule, press 0.96, transitions named (never `all`), `currentColor` icons, overscroll-contain panels, hover behind `@media (hover: hover)` | `editor.css` |
| better-writing | Verb-first buttons, errors with recovery steps, empty state with next action, undo toast instead of confirmations | Toolbar, Canvas, store |
| better-interface | Consolidated review + severity ladder; see `docs/INTERFACE-REVIEW.md` | This repo |
| interface-review | Change-scoped framing for the initial commit review | `docs/INTERFACE-REVIEW.md` |
| build-design | PROJECT.md treated as the design source (no Figma connected); values mapped to tokens; deviations listed in the review doc | This build |
| state-machine | Tool + data state enumeration; all states rendered (empty/loaded/error/toast) | Store, Canvas |
| break | Stress scenarios: long station names, duplicate connect, missing-station segment (validator), zoom extremes 0.2–4× | `core` tests, Canvas guards |
| variant | Toolbar density judged at 900px breakpoint; icon-only vs labelled tools — settled on icon + label tooltip + aria-label per better-accessibility (variant page deferred; rationale recorded here) | Toolbar |
| explain-interface | `docs/ARCHITECTURE.md` — the SVG stack in paint order with tiers (measured vs inferred) | Docs |
| teardown | Renderer described as swappable plates; SVG export is the portable deliverable | `docs/ARCHITECTURE.md`, renderer |
| banner-design | README header `docs/banner.svg` (1280×320, safe central zone, one headline) | README |
| slides | Deferred to v0.4 (pitch deck is not a v0.1 deliverable). Token compliance rule adopted now so a future deck imports `tokens.css` directly | Reasoned deferral |
| away | Build left reversible: new repo on `main`, small commits, report = this file + `docs/INTERFACE-REVIEW.md` | Repo hygiene |

## Not verified (honest gaps)

- No browser run yet — keyboard walk, 320px reflow, and reduced-motion behavior
  are code-level checks only. Run `pnpm dev` and walk them before release.
- No Figma file exists — design values are estimates from `PROJECT.md` text.
- Tauri desktop, PNG/PDF export, and parallel-line offsets are v0.3–v0.4 work.
