# Format specification — MetroMap v1

Every Nodal file is a `MetroMap` object with `schemaVersion: 1`.
Machine-readable schema: `packages/schema/src/schema.ts` (JSON Schema).
Example: `examples/lumen-city.json`.

## Top level

```ts
{
  schemaVersion: 1,
  meta: { title: string, author?: string, createdAt: string /* ISO */ },
  stations: Record<ID, Station>,
  lines: Record<ID, Line>,
  labels: Record<ID, Label>,
  style: MapStyle,
}
```

IDs are opaque strings (UUID v4 today). Never assume ordering — iterate by key.

## Station

`{ id, name: Record<locale, string>, position: {x, y}, kind, labelAnchor, labelOffset? }`
- `kind`: `normal | interchange | terminus` (circle / ring / square)
- `labelAnchor`: `N NE E SE S SW W NW`

## Line

`{ id, name, color: "#RRGGBB", style: "solid|dashed|double", width?, segments: Segment[] }`

`Segment = { from: ID, to: ID, waypoints?: {x, y}[] }` — `from`/`to` must exist.

## Style

`{ background: "#RRGGBB", gridStep, cornerRadius, snap45, labelLanguage, fontSize, stationRadius }`

## Compatibility

- Unknown fields are rejected by `core.validateMap` only for typed fields; new
  optional fields are ignored by older builds until a minor bump.
- Bump `CURRENT_SCHEMA_VERSION` in `packages/core/src/types.ts` and add a pure
  migration in `validate.ts` before v1.0 freezes the format.
