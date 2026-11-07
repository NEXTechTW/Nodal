# Brand guidelines — Nodal

Source of truth for brand voice and visual identity (brand skill).
Tokens in `packages/app/src/styles/tokens.css` implement this file.

## Identity

- Name: **Nodal** (product). Repo: `linewright`. Keep both; “Nodal” is the headline.
- Mark: three nodes joined as an interchange glyph — two circles sharing a ring.
  SVG at `apps/web/public/logo.svg`.
- Promise: “Schematic maps, without Illustrator.” State it in plain words.

## Voice

| Context | Tone |
|---|---|
| Onboarding, empty states, success | Warm, can be light |
| Routine actions, settings | Neutral, minimal |
| Errors, destructive actions | Calm, plain, zero playfulness |

Rules: address the reader (“you”), verb-first buttons (“Save map”, not “OK”),
errors name the fix (“Unable to load map file. Choose a .json file exported
from Nodal and try again.”), undo beats confirmation for reversible edits.

## Visual identity

- One neutral ramp + one accent ramp (signal blue). Metro-line colors are
  data colors, not UI chrome — never reuse a line color for buttons.
- Type: Noto Sans / system stack. Body 14, captions 12, tabular numerals for
  coordinates and zoom.
- Radius: outer = inner + padding where surfaces nest.
- Motion: 150 ms, `cubic-bezier(0.2, 0, 0, 1)`, gated behind
  `prefers-reduced-motion`. Press scales to 0.96.

## What this build does not claim

- No real-city examples, logos, or GIS data.
- No claims about performance or format stability before v1.0.
