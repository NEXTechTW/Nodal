/**
 * Validation + migration.
 * Every file carries `schemaVersion` (PROJECT.md §3). Migrations are pure.
 */
import { CURRENT_SCHEMA_VERSION, type MetroMap } from "./types.js";

export interface ValidationIssue {
  path: string;
  message: string;
}

const ANCHORS = new Set(["N","NE","E","SE","S","SW","W","NW"]);
const STATION_KINDS = new Set(["normal","interchange","terminus"]);
const LINE_STYLES = new Set(["solid","dashed","double"]);
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function validateMap(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (path: string, message: string) => issues.push({ path, message });
  const isObj = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

  if (!isObj(value)) {
    push("$", "Root must be an object");
    return issues;
  }

  if (value.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    push("$.schemaVersion", `Expected ${CURRENT_SCHEMA_VERSION}, got ${String(value.schemaVersion)}`);
  }
  if (!isObj(value.meta) || typeof value.meta.title !== "string") {
    push("$.meta.title", "meta.title must be a string");
  }
  if (!isObj(value.stations)) push("$.stations", "stations must be an object");
  if (!isObj(value.lines)) push("$.lines", "lines must be an object");
  if (!isObj(value.labels)) push("$.labels", "labels must be an object");
  if (!isObj(value.style)) {
    push("$.style", "style must be an object");
    return issues;
  }

  const style = value.style as Record<string, unknown>;
  if (typeof style.background !== "string" || !HEX_RE.test(style.background)) {
    push("$.style.background", "must be a hex color");
  }
  if (typeof style.gridStep !== "number" || !(style.gridStep > 0)) {
    push("$.style.gridStep", "must be a number > 0");
  }
  if (typeof style.cornerRadius !== "number" || style.cornerRadius < 0) {
    push("$.style.cornerRadius", "must be a number >= 0");
  }
  // snap45 is deprecated and ignored; validate only when present.
  if (style.snap45 !== undefined && typeof style.snap45 !== "boolean") push("$.style.snap45", "must be boolean");
  if (typeof style.labelLanguage !== "string") push("$.style.labelLanguage", "must be string");
  if (typeof style.fontSize !== "number" || !(style.fontSize > 0)) push("$.style.fontSize", "must be number > 0");
  if (typeof style.stationRadius !== "number" || !(style.stationRadius > 0)) push("$.style.stationRadius", "must be number > 0");

  const stations = value.stations as Record<string, unknown>;
  for (const [id, raw] of Object.entries(stations)) {
    if (!isObj(raw)) { push(`$.stations.${id}`, "must be object"); continue; }
    const pos = raw.position as { x?: unknown; y?: unknown } | undefined;
    if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
      push(`$.stations.${id}.position`, "position.x/y must be numbers");
    }
    if (typeof raw.kind !== "string" || !STATION_KINDS.has(raw.kind)) {
      push(`$.stations.${id}.kind`, "unknown station kind");
    }
    if (typeof raw.labelAnchor !== "string" || !ANCHORS.has(raw.labelAnchor)) {
      push(`$.stations.${id}.labelAnchor`, "unknown anchor");
    }
    if (raw.rotation !== undefined && typeof raw.rotation !== "number") {
      push(`$.stations.${id}.rotation`, "rotation must be a number");
    }
    if (!isObj(raw.name)) push(`$.stations.${id}.name`, "name must be an object");
  }

  const lines = value.lines as Record<string, unknown>;
  for (const [id, raw] of Object.entries(lines)) {
    if (!isObj(raw)) { push(`$.lines.${id}`, "must be object"); continue; }
    if (typeof raw.color !== "string" || !HEX_RE.test(raw.color)) {
      push(`$.lines.${id}.color`, "must be hex color");
    }
    if (typeof raw.style !== "string" || !LINE_STYLES.has(raw.style)) {
      push(`$.lines.${id}.style`, "unknown line style");
    }
    const segs = raw.segments;
    if (!Array.isArray(segs)) { push(`$.lines.${id}.segments`, "must be array"); continue; }
    for (const [i, s] of segs.entries()) {
      if (!isObj(s)) { push(`$.lines.${id}.segments[${i}]`, "must be object"); continue; }
      if (typeof s.from !== "string" || typeof s.to !== "string") {
        push(`$.lines.${id}.segments[${i}]`, "from/to must be station IDs");
        continue;
      }
      if (!(s.from in stations)) push(`$.lines.${id}.segments[${i}].from`, `unknown station ${String(s.from)}`);
      if (!(s.to in stations)) push(`$.lines.${id}.segments[${i}].to`, `unknown station ${String(s.to)}`);
    }
  }

  return issues;
}

export function migrateMap(value: unknown): { map: MetroMap; from: number } {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid map file: root must be an object");
  }
  const v = value as Record<string, unknown>;
  const from = typeof v.schemaVersion === "number" ? v.schemaVersion : 0;
  // v0 → v1: fill defaults added in v1 (labels, style fields).
  // Currently v1 is the first published version, so only fill missing fields.
  const map = value as MetroMap;
  const issues = validateMap(map);
  if (issues.length > 0 && from >= CURRENT_SCHEMA_VERSION) {
    throw new Error(`Invalid map: ${issues[0]!.path} — ${issues[0]!.message}`);
  }
  return { map, from };
}

/** Safe JSON parse → MetroMap, with friendly errors (better-writing: errors name the fix). */
export function parseMapFile(text: string): MetroMap {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Unable to load map file. It is not valid JSON. Choose a .json file exported from Nodal and try again.");
  }
  const { map } = migrateMap(parsed);
  const issues = validateMap(map);
  if (issues.length > 0) {
    throw new Error(
      `Unable to load map file. ${issues[0]!.path}: ${issues[0]!.message}. Fix the file or start from the example map.`,
    );
  }
  return map;
}
