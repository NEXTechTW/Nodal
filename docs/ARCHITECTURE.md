# Architecture

A quick tour of how drawing works.

The map itself is just a JSON object (a `MetroMap`) in `packages/core`. The screen is a view over that object. If you change the screen logic, the file format does not change, and vice versa.

How a line gets on screen:

1. `core` holds stations, lines, labels, style.
2. The canvas is plain SVG. Pan/zoom is a transform on the group, so panning just moves the group.
3. Each line segment becomes a path. Corners are rounded by inserting a short quadratic curve at each vertex.
4. Stations are circles (normal), two circles (interchange), or squares (terminus).
5. Labels sit where `labelAnchor` says, using the same offset math as the export.
6. Export calls `renderer.toSVGString`, which uses the same geometry as the canvas. One place to fix a drawing bug, not two.

Tools are a small state set: select, add station, connect, pan. That lives in the store. There is also an empty state (nothing on the map yet) and error toasts for bad files. You can hit every state in the editor.

Every edit is a command with an `apply` and a `revert`. The stack keeps undo/redo honest. Deleting a station also removes the segments that touched it, and undo puts those back.

Zoom is exponential so it feels even, and anchored to the cursor. Hit testing gets more forgiving when zoomed out so small stations are still clickable.
