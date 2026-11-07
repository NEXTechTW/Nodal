# Tutorial

Draw your first map in a few minutes.

1. Run `pnpm dev` and open http://localhost:5173.
2. Hit `Example` in the top bar. You get Lumen City, a made-up city with three lines.
3. Press `A` and click somewhere empty. You get a station. Click it in the right panel and rename it. You can also give it a Traditional Chinese name.
4. Type a line name on the left, press `C`, then drag from one station to another. That is a connection. If two lines use the same stretch they nudge apart so you can see both.
5. Press `Arrange labels to avoid overlap` in the right panel if names start to collide.
6. Export with `File` in the top bar: SVG for editing, PNG for pictures, PDF for printing. `Save` writes a JSON file you can check into git.

Keys worth knowing: `V` select, `A` add, `C` connect, `H` pan, `Delete` removes the selected station, `Esc` clears selection. Hold `Space` and drag to pan. Scroll to zoom. They are all listed in the panel too.
