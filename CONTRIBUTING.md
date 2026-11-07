# Contributing

Get started:

```
pnpm install
pnpm dev
```

Tests and checks: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`. Run them before you push.

Branches: fork, make a small branch (`feat/…`, `fix/…`, `docs/…`), keep the change focused. Commit messages in Conventional Commits style, e.g. `feat(core): parse station names by locale`. Bigger ideas: open an issue first.

Code rules that matter:

- Leave `packages/core` alone as a plain-TS package. No React, no DOM, no state library. If it needs the browser, it goes in `renderer` or `app`.
- Edits go through `packages/core/src/commands.ts` (commands with apply/revert). Do not mutate the map in components.
- Colors, spacing, radii come from `packages/app/src/styles/tokens.css`. Do not hard-code hex in components.
- Buttons start with a verb. Errors tell the user what to do next. Empty states offer one next step.

Files: every map has `schemaVersion`. If you change the format, bump `CURRENT_SCHEMA_VERSION` in `packages/core/src/types.ts`, add the migration in `validate.ts`, and update `packages/schema/src/schema.ts` and `examples/lumen-city.json`.

Licenses: MIT only. No GPL or source-available dependencies. Fonts must be SIL OFL (Noto Sans qualifies). The browser build uses system fonts for now; the desktop bundle will include Noto Sans.

Fictional names only in examples. Anyone who draws a real city is responsible for the logos and type they use.
