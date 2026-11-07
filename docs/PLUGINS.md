# Plugins (still just an idea)

For 1.0 we have not decided if plugins are needed. If they are, keep them small:

- Exporters: register a new way to write a map out (a PNG size, a folder of SVGs).
- Importers: read some other format into a `MetroMap`.
- Checks: read-only warnings like "this station has no line yet".
- Commands: edits that still go through the undo stack so undo keeps working.

What we will not do: let plugins redraw everything themselves, touch the DOM directly, or make network calls from the core path. If something does not fit in the four shapes above, it is probably a feature for Nodal itself, not an extension point.
