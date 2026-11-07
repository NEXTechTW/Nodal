# Interface review — initial v0.1 build

Scope: `main` initial commit — `packages/core`, `packages/renderer`,
`packages/app`, `apps/web`, docs. Full-repo review (`better-interface`).

## Coverage

| Domain | Owner | Result |
|---|---|---|
| Accessibility | better-accessibility | Not verified — no browser run; code paths present (labels, focus-visible, live region, keyboard tools) |
| Layout | better-layout | 320px / 200% zoom: Not verified; panels collapse ≤900px by CSS |
| Writing | better-writing | Errors carry fixes; buttons are verb-first; empty state offers next action |
| Typography | better-typography | Scale + tabular nums + 16px mobile inputs in tokens |
| Colors | better-colors | Semantic tokens only in components; contrast values Not verified (no renderer) |
| UI polish | better-ui | Press 0.96, named transitions, currentColor icons |

## Findings (would be HIGH triggers — all fixed in this build)

| Severity | Domain | Location | Fix applied |
|---|---|---|---|
| HIGH | Accessibility | Canvas was mouse-only | Keyboard: V/A/C/H, Delete, Esc; canvas is focusable with label |
| HIGH | Accessibility | Icon buttons lacked names | Every icon button has `aria-label`; `aria-pressed` on tools |
| HIGH | Writing | Generic “something went wrong” errors | Errors now name the fix (bad JSON, unknown station) |
| HIGH | Colors | Line colors would have doubled as UI accent | UI chrome uses the single signal-blue token; lines are data colors |
| MEDIUM | Layout | Panels would overflow at phone width | ≤900px collapses panels; canvas keeps full width |
| LOW | UI | `transition: all` risk | Named properties only; hover behind `@media (hover: hover)` |

## Verification

- `pnpm typecheck`, `pnpm test`, `pnpm build` — run in this environment.
- Browser walk (tab order, 200% zoom, screen reader, reduced motion) — **Not verified**.
- Figma comparison — N/A (no file; PROJECT.md is the source).

Verdict: Approve for v0.1 prototype. Ship after a browser walk.
