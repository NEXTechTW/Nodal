import type { MetroMap, Station, StationSymbol } from "./types.js";
import type { ValidationIssue } from "./validate.js";

export const MAX_STATION_SYMBOL_LAYERS = 100;
export const MAX_STATION_SYMBOL_PATH_LENGTH = 10000;
const COLOR = /^(?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|none|currentColor)$/;
const PATH = /^[Mm][MmZzLlHhVvCcSsQqTtAa0-9eE+.,\s-]*$/;
const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

/** Validate the reusable mark independently of its map references. */
export function validateStationSymbol(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (path: string, message: string) => issues.push({ path, message });
  const object = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  if (!object(value)) return [{ path: "$", message: "symbol must be an object" }];
  if (typeof value.id !== "string" || !value.id) push("$.id", "must be a nonempty string");
  if (typeof value.name !== "string") push("$.name", "must be a string");
  if (!Array.isArray(value.layers)) return [...issues, { path: "$.layers", message: "must be an array" }];
  if (value.layers.length > MAX_STATION_SYMBOL_LAYERS) push("$.layers", `must contain at most ${MAX_STATION_SYMBOL_LAYERS} layers`);
  const ids = new Set<string>();
  for (const [i, layer] of value.layers.entries()) {
    const path = `$.layers[${i}]`;
    if (!object(layer)) { push(path, "must be an object"); continue; }
    if (typeof layer.id !== "string" || !layer.id || ids.has(layer.id)) push(`${path}.id`, "must be a unique nonempty string");
    else ids.add(layer.id);
    if (!["circle", "rect", "line", "path"].includes(String(layer.type))) push(`${path}.type`, "unknown layer type");
    for (const [key, min, max] of [
      ["x", -24, 24], ["y", -24, 24], ["width", 0, 100000], ["height", 0, 100000],
      ["strokeWidth", 0, 100000], ["rotation", -360, 360],
    ] as const) {
      const n = layer[key];
      if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) push(`${path}.${key}`, `must be a finite number from ${min} to ${max}`);
    }
    for (const key of ["fill", "stroke"] as const) {
      if (typeof layer[key] !== "string" || !COLOR.test(layer[key])) push(`${path}.${key}`, "must be a hex color, none, or currentColor");
    }
    if (layer.matrix !== undefined && (!Array.isArray(layer.matrix) || layer.matrix.length !== 6 ||
      layer.matrix.some((n) => typeof n !== "number" || !Number.isFinite(n) || Math.abs(n) > 10000))) {
      push(`${path}.matrix`, "must be six finite numbers with absolute value at most 10000");
    }
    if (layer.type === "path" || layer.d !== undefined) {
      const d = layer.d;
      if (typeof d !== "string" || d.length > MAX_STATION_SYMBOL_PATH_LENGTH || !PATH.test(d.trim()) ||
        d.replace(NUMBER, "").match(/[^MmZzLlHhVvCcSsQqTtAa,\s]/) ||
        !(d.match(NUMBER) ?? []).length || (d.match(NUMBER) ?? []).some((n) => !Number.isFinite(Number(n)))) {
        push(`${path}.d`, `must contain only SVG path commands and finite numbers, at most ${MAX_STATION_SYMBOL_PATH_LENGTH} characters`);
      }
    }
  }
  return issues;
}

/** Safe SVG primitives in the centered 48 x 48 design space, without an outer scale. */
export function stationSymbolSVG(symbol: StationSymbol): string {
  const issues = validateStationSymbol(symbol);
  if (issues.length) throw new Error(`Invalid station symbol: ${issues[0]!.path}: ${issues[0]!.message}`);
  return symbol.layers.map((layer) => {
    const matrix = layer.matrix ? ` matrix(${layer.matrix.join(" ")})` : "";
    const attrs = `transform="translate(${layer.x} ${layer.y}) rotate(${layer.rotation})${matrix}" fill="${layer.fill}" stroke="${layer.stroke}" stroke-width="${layer.strokeWidth}"`;
    switch (layer.type) {
      case "circle": return `<ellipse cx="0" cy="0" rx="${layer.width / 2}" ry="${layer.height / 2}" ${attrs}/>`;
      case "rect": return `<rect x="${-layer.width / 2}" y="${-layer.height / 2}" width="${layer.width}" height="${layer.height}" ${attrs}/>`;
      case "line": return `<line x1="${-layer.width / 2}" y1="${-layer.height / 2}" x2="${layer.width / 2}" y2="${layer.height / 2}" ${attrs}/>`;
      case "path": return `<path d="${layer.d}" ${attrs}/>`;
    }
  }).join("");
}

/** Conservative custom-mark extent in map units, shared by labels and exports. */
export function stationSymbolExtent(map: MetroMap, station: Station): number {
  return station.symbolId !== undefined && Object.hasOwn(map.stationSymbols ?? {}, station.symbolId)
    ? 40 * map.style.stationRadius / 12
    : map.style.stationRadius;
}
