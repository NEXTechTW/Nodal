# File format (v1)

All maps are one object with `schemaVersion: 1`. The shape is in `packages/schema/src/schema.ts` and `examples/lumen-city.json` is a real file you can open.

```ts
{
  schemaVersion: 1,
  meta: { title, author?, createdAt },
  stations: Record<ID, Station>,
  lines: Record<ID, Line>,
  labels: Record<ID, Label>,
  style: MapStyle,
}
```

IDs are strings. UUIDs today, but do not assume anything about their order. Look things up by key.

Station: `id`, `name` (a map from locale to string, like `{ en: "Central", "zh-TW": "中央" }`), `position {x, y}`, `kind` (`normal` / `interchange` / `terminus`), `labelAnchor` (`N`, `NE`, `E`, ...), optional `labelOffset`.

Line: `id`, `name`, `color` (hex), `style` (`solid` / `dashed` / `double`), optional `width`, plus `segments`. A segment is `from` / `to` station ids with optional `waypoints`. Both ends have to point at real stations or the file is invalid.

Style: map background, grid step, corner radius, which language labels show, font size, station size. Old files may still have a `snap45` field. It is ignored on load.

If we ever bump the version, put the migration in `packages/core/src/validate.ts` and bump `CURRENT_SCHEMA_VERSION` in `types.ts`. The validator only complains about fields it knows about, so extra fields pass through until then.
