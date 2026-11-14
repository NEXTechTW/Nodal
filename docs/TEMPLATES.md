# Upload your own template

A template is one small JSON file that restyles the whole map. Stations and segments never move.

## Format

```json
{
  "name": "Taoyuan style",
  "description": "Thick lines, big labels, white grid.",
  "style": {
    "background": "#FFFFFF",
    "gridStep": 40,
    "cornerRadius": 36,
    "fontSize": 14,
    "stationRadius": 8,
    "fontFamily": "Noto Sans, sans-serif",
    "labelColor": "#000000",
    "fontWeight": 500
  },
  "linePalette": ["#62A130", "#774499", "#FFA500", "#00FFFF"],
  "stationRadius": 8
}
```

- `name` (required): shown in the toast.
- `style`: any field from `MapStyle` in `packages/core/src/types.ts`. Omit what you do not want to change.
- `linePalette`: colours are cycled across your lines in order. Omit to keep existing colours.
- `stationRadius`: shortcut for the common case.

## With the editor

Design it here, no file needed:

1. Open the **Map** tab.
2. Tune background, fonts, station size, corner radius, and line colours with the controls.
3. Click **Export style as template…** to save it, or **Upload template…** to apply someone else's.

Uploading does the same thing in reverse: the map recolours instantly. Undo (Ctrl+Z) reverts it.

## What people build first

- Station symbols: tune `stationRadius` + `cornerRadius` so general stations (`R03`), interchanges with badges (`BL12 / R10`), and termini (`BL01`) read at a glance. Thick lines + bilingual labels is the usual starting point.
- Print templates: white background, `labelColor: "#000000"`, high weight.
- Dark boards: dark background, light `labelColor`, saturated palette.

Validate yours with the same field names as `packages/schema`. Typos are reported with the field that failed.
