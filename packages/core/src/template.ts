/**
 * Uploadable station/line templates.
 * People share small JSON files that re-style the whole map.
 */
import type { MetroMap } from "./types.js";

export interface StationTemplate {
  name: string;
  description?: string;
  /** MapStyle patch (background, gridStep, cornerRadius, fontSize, ...). */
  style?: Partial<MetroMap["style"]>;
  /** Recolour lines from this palette (cycled in order). */
  linePalette?: string[];
  /** Station mark radius multiplier. */
  stationRadius?: number;
}

export function validateTemplate(value: unknown): string[] {
  const issues: string[] = [];
  if (typeof value !== "object" || value === null) return ["Root must be an object"];
  const v = value as Record<string, unknown>;
  if (typeof v.name !== "string" || !v.name.trim()) issues.push("name must be a non-empty string");
  if (v.linePalette !== undefined && !Array.isArray(v.linePalette)) issues.push("linePalette must be an array");
  return issues;
}

export function applyTemplate(map: MetroMap, tpl: StationTemplate): MetroMap {
  const lines: MetroMap["lines"] = {};
  const ids = Object.keys(map.lines);
  ids.forEach((id, idx) => {
    const line = map.lines[id]!;
    const copy = structuredClone(line);
    if (tpl.linePalette?.length) copy.color = tpl.linePalette[idx % tpl.linePalette.length]!;
    lines[id] = copy;
  });
  return {
    ...map,
    style: {
      ...map.style,
      ...(tpl.style ?? {}),
      ...(tpl.stationRadius !== undefined ? { stationRadius: tpl.stationRadius } : {}),
    },
    lines,
  };
}
