# Plugin API evaluation (v1.0)

Question for v1.0: what do users actually need to extend beyond JSON import/export?

## Candidates (ranked by pull, least surface)

1. **Export hosts** — register a target (PNG sizes, PDF page, folder split).
   Smallest API: `exporters.register({ id, name, run(map): Promise<void> })`.
2. **Importers** — read foreign formats into `MetroMap` (`importers.register`).
3. **Map checks** — read-only lint over `MetroMap` (e.g. “station with no line”).
   Highest safety: no DOM access, pure function, return issues.
4. **Commands** — external commands that must go through `CommandStack` so undo
   keeps working. That invariant is non-negotiable.

## Non-goals

- No rendering overrides (the `renderer` layer stays swappable by the team).
- No DOM access from plugins; no network calls in the core path.
- No versioned plugin marketplace in v1.0 — load from `packages/app/src/plugins/*`
  as plain modules with the same MIT rule as everything else.

## Decision rule

If a plugin cannot be expressed as (1)–(4) over the public `MetroMap`, it is a
renderer/core change instead — not a plugin.
