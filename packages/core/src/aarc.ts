/**
 * AARC → MetroMap import (user-supplied format).
 * AARC is a single-file transit editor format:
 *   lines:  [{ id, pts: [stationId], name, nameSub, color, ... }]
 *   points: [{ id, pos: [x, y], name, nameS, nameP: [dx, dy], ... }]
 * Nodal maps it onto MetroMap so the file can be saved as Nodal JSON afterwards.
 */
import { CURRENT_SCHEMA_VERSION, emptyMap, type Anchor, type MetroMap, type Station } from "./types.js";

export interface AarcPoint {
  id: number;
  pos: [number, number];
  name?: string;
  nameS?: string;
  nameP?: [number, number];
  dir?: number;
  sta?: number;
}

export interface AarcLine {
  id: number;
  pts: number[];
  name?: string;
  nameSub?: string;
  color?: string;
  type?: number;
  width?: number;
}

export interface AarcFile {
  lines?: AarcLine[];
  points?: AarcPoint[];
  meta?: { title?: string; author?: string };
  pointLinks?: { pts?: number[]; type?: number }[];
}

export function isAarc(value: unknown): value is AarcFile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.lines) && Array.isArray(v.points);
}

/** dir (0–7) → label anchor. AARC point `dir` is a compass direction for the name leader. */
function aarcDirToAnchor(dir: unknown): Anchor {
  const d = typeof dir === "number" ? dir : 1;
  const map: Anchor[] = ["E", "NE", "N", "NW", "W", "SW", "S", "SE"];
  return map[d % 8] ?? "N";
}

export function aarcToMetroMap(aarc: AarcFile): MetroMap {
  const map = emptyMap("Imported map");
  map.schemaVersion = CURRENT_SCHEMA_VERSION;
  const metaTitle = (aarc as { meta?: { title?: string } }).meta?.title;
  if (typeof metaTitle === "string" && metaTitle.trim()) map.meta.title = metaTitle;

  for (const p of aarc.points ?? []) {
    const id = String(p.id);
    const name: Record<string, string> = {};
    if (p.name) name["zh-TW"] = p.name;
    if (p.nameS) name.en = p.nameS;
    const station: Station = {
      id,
      name: Object.keys(name).length ? name : { en: `Station ${p.id}` },
      position: { x: p.pos?.[0] ?? 0, y: p.pos?.[1] ?? 0 },
      kind: p.sta !== undefined && p.sta > 1 ? "interchange" : "normal",
      labelAnchor: aarcDirToAnchor(p.dir),
    };
    if (Array.isArray(p.nameP) && typeof p.nameP[0] === "number" && typeof p.nameP[1] === "number") {
      station.labelOffset = { x: p.nameP[0], y: p.nameP[1] };
    }
    map.stations[id] = station;
  }

  // AARC type 2 pointLinks are dashed transfer footpaths (their midpoint
  // label text lives in textTags; keep it simple and draw the dashed link).
  const links = aarc.pointLinks ?? [];
  if (links.length) {
    map.transfers = {};
    links.forEach((link, idx) => {
      if (!Array.isArray(link.pts) || link.pts.length < 2) return;
      const from = String(link.pts[0]);
      const to = String(link.pts[1]);
      if (!map.stations[from] || !map.stations[to]) return;
      map.transfers![`aarc-link-${idx}`] = { id: `aarc-link-${idx}`, from, to };
    });
  }

  for (const l of aarc.lines ?? []) {
    const id = `aarc-${l.id}`;
    const name: Record<string, string> = {};
    if (l.name) name["zh-TW"] = l.name;
    if (l.nameSub) name.en = l.nameSub;
    map.lines[id] = {
      id,
      name: Object.keys(name).length ? name : { en: `Line ${l.id}` },
      color: typeof l.color === "string" && /^#/.test(l.color) ? l.color : "#0067C0",
      style: "solid",
      segments: (l.pts ?? [])
        .filter((pt) => map.stations[String(pt)])
        .map((pt, i, arr) => ({ from: String(pt), to: String(arr[(i + 1) % arr.length]) }))
        .filter((s, i, arr) => Math.floor(arr.length / 2) > 0 && i < arr.length - 1),
    };
    // Fix: consecutive pairs, not wrap-around.
    const ids = (l.pts ?? []).filter((pt) => map.stations[String(pt)]).map(String);
    map.lines[id]!.segments = ids.slice(0, -1).map((from, i) => ({ from, to: ids[i + 1]! }));
  }

  return map;
}
