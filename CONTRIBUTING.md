# Contributing to Nodal

## Quick start

```sh
pnpm install
pnpm dev        # web editor at http://localhost:5173
pnpm test       # all packages (Vitest)
pnpm typecheck  # TS strict across the monorepo
pnpm lint       # ESLint
pnpm build      # production build
```

## Branches and commits

1. Fork, create a feature branch: `feat/…`, `fix/…`, `docs/…`
2. Changes are small and scoped — one concern per PR
3. Use [Conventional Commits](https://www.conventionalcommits.org/):
   `feat(core): add 45° snap helper`
4. Open a PR describing motivation. Large features: open an issue first.

## Architecture rules

- `packages/core` must stay zero-UI-deps (no React, no DOM, no zustand).
  If it needs the DOM, it belongs in `renderer` or `app`.
- Edits go through `packages/core/src/commands.ts`. No direct mutation in components.
- Colors, spacing, and radius come from tokens in
  `packages/app/src/styles/tokens.css`. No raw hex in components.
- Interface copy: verb-first buttons, errors state the fix, empty states
  name the next action (see `docs/brand-guidelines.md`).

## Format policy

- Every map file has `schemaVersion`. Bump `CURRENT_SCHEMA_VERSION` in
  `packages/core/src/types.ts`, add a migration in `validate.ts`, update
  `packages/schema/src/schema.ts` and `examples/lumen-city.json`.

## Licenses

- Code: MIT (see `LICENSE`). Do not add GPL / source-available dependencies.
- Fonts: SIL OFL only (e.g. Noto Sans). Default stack loads system fonts;
  bundling Noto Sans is planned for the desktop build.

## Trademark note

Examples use only fictional cities. Users are responsible for copyright in
their own maps (real-city logos, type, and photography).
