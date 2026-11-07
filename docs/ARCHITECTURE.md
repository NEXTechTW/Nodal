# Architecture (explain-interface)

How Nodal's frontend paints a transit map, in layers.

| Layer | Technique | What you see |
|---|---|---|
| 1. Map | `MetroMap` JSON (`core`) | Stations, lines, labels, style. Serializable, versioned. |
| 2. Canvas | React SVG, `translate(x,y) scale(k)` | Pan/zoom via pointer + wheel-to-cursor. Grid is an SVG `<pattern>`. |
| 3. Lines | `roundedPolyline` → `<path d>` | Straight segments with interpolated quadratic arcs at corners. |
| 4. Stations | `<g>` + circle/ring/rect | Normal = circle, interchange = ring, terminus = square. |
| 5. Labels | `<text>` + anchor math | `anchorOffset` positions the label; `dominantBaseline` aligns it. |
| 6. Export | `renderer.toSVGString` | Same geometry as the canvas, standalone file with `<title>` and `role="img"`. |

## State machine (state-machine skill)

Tool states: `select`, `add-station`, `connect`, `pan` (+ transient `spaceDown`).
Data states: empty (0 stations, CTA), loaded (≥1 station), error (failed JSON),
toast (undoable save/delete/duplicate-connect). Every state is reachable in the
editor; the empty state offers “Add a station” and the fictional-city example.

## Command stack

Every edit is a `Command { apply, revert }` over an immutable `MetroMap`.
`CommandStack.dispatch` clears redo; `undo`/`redo` replay the opposite direction.
Delete-station also strips touching segments (documented edge case in v0.1).

## Renderer (teardown skill framing)

The renderer is a plate stack: `core` model → `linePathPoints` → `svgPath` →
`toSVGString`. Swapping SVG for Canvas later touches only this layer; the
model, commands, and schema do not change (PROJECT.md §9).

## Zoom & hit tolerance

Wheel zoom is exponential (`exp(-deltaY * 0.0012)`) and anchored to the cursor.
Hit tolerance scales inversely with `k` (`16 / k`, min 14 map units) so stations
stay grabbable at any zoom.
