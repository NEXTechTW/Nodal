/**
 * AARC → MetroMap import (user-supplied format).
 * AARC is a single-file transit editor format:
 *   lines:  [{ id, pts: [stationId], name, nameSub, color, ... }]
 *   points: [{ id, pos: [x, y], name, nameS, nameP: [dx, dy], ... }]
 * Nodal maps it onto MetroMap so the file can be saved as Nodal JSON afterwards.
 */
import { CURRENT_SCHEMA_VERSION, emptyMap, type Anchor, type MetroMap, type Segment, type Station } from "./types.js";

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
  textTags?: { pos?: [number, number]; text?: string; textS?: string }[];
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

  // Merge points that are drawn at (almost) the same spot into one interchange
  // so CY/O lines sharing a station do not double-draw.
  const rawPoints = aarc.points ?? [];
  const idMap = new Map<number, number>();
  for (let i = 0; i < rawPoints.length; i++) {
    for (let j = i + 1; j < rawPoints.length; j++) {
      const a = rawPoints[i]!;
      const b = rawPoints[j]!;
      const d = Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1]);
      if (d < 25) idMap.set(b.id, a.id);
    }
  }
  // Unnamed points are junctions, not stations — keep them as waypoints.
  const waypoints = new Map<number, { x: number; y: number }>();
  for (const p of rawPoints) {
    if (!p.name && !p.nameS && Array.isArray(p.pos)) {
      waypoints.set(p.id, { x: p.pos[0], y: p.pos[1] });
    }
  }
  const merged = rawPoints.filter((p) => !idMap.has(p.id) && (p.name || p.nameS));
  for (const p of merged) {
    const id = String(p.id);
    // Collect names from merged-away twins too.
    const name: Record<string, string> = {};
    if (p.name) name["zh-TW"] = p.name;
    if (p.nameS) name.en = p.nameS;
    for (const [gone, host] of idMap) {
      if (host === p.id) {
        const twin = rawPoints.find((q) => q.id === gone);
        if (twin?.name && !name["zh-TW"]) name["zh-TW"] = twin.name;
        if (twin?.nameS && !name.en) name.en = twin.nameS;
      }
    }
    const isInterchange = [...idMap.entries()].some(([, host]) => host === p.id) || (p.sta !== undefined && p.sta > 1);
    const station: Station = {
      id,
      name: Object.keys(name).length ? name : { en: "" },
      position: { x: p.pos?.[0] ?? 0, y: p.pos?.[1] ?? 0 },
      kind: isInterchange ? "interchange" : "normal",
      labelAnchor: aarcDirToAnchor(p.dir),
    };
    if (Array.isArray(p.nameP) && typeof p.nameP[0] === "number" && typeof p.nameP[1] === "number") {
      station.labelOffset = { x: p.nameP[0], y: p.nameP[1] };
    }
    map.stations[id] = station;
  }

  // AARC type 2 pointLinks are dashed transfer footpaths. Their label
  // lives in textTags near the midpoint (e.g. "透過林口長庚醫院").
  const links = aarc.pointLinks ?? [];
  const tags = aarc.textTags ?? [];
  if (links.length) {
    map.transfers = {};
    links.forEach((link, idx) => {
      if (!Array.isArray(link.pts) || link.pts.length < 2) return;
      const fromId = idMap.get(link.pts[0]!) ?? link.pts[0]!;
      const toId = idMap.get(link.pts[1]!) ?? link.pts[1]!;
      const from = String(fromId);
      const to = String(toId);
      if (from === to) return;
      const a = map.stations[from];
      const b = map.stations[to];
      if (!a || !b) return;
      const mid = { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 };
      let label: Record<string, string> | undefined;
      let best = Infinity;
      for (const tag of tags) {
        if (!Array.isArray(tag.pos)) continue;
        const d = Math.hypot(tag.pos[0] - mid.x, tag.pos[1] - mid.y);
        if (d < 400 && d < best) {
          best = d;
          label = {};
          if (tag.text) label["zh-TW"] = tag.text;
          if (tag.textS) label.en = tag.textS;
        }
      }
      map.transfers![`aarc-link-${idx}`] = label
        ? { id: `aarc-link-${idx}`, from, to, label }
        : { id: `aarc-link-${idx}`, from, to };
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
    // Carry unnamed junction positions through as waypoints so Y-forks land
    // between stations instead of forcing a join at a station.
    const full = (l.pts ?? []).map((pt) => ({
      pid: idMap.get(pt) ?? pt,
      wp: waypoints.get(pt),
    }));
    const segs: Segment[] = [];
    let lastStationId: string | null = null;
    let pending: { x: number; y: number }[] = [];

    for (const pt of full) {
      const sid = String(pt.pid);
      if (map.stations[sid]) {
        if (lastStationId !== null && lastStationId !== sid) {
          segs.push(
            pending.length
              ? { from: lastStationId, to: sid, waypoints: [...pending] }
              : { from: lastStationId, to: sid }
          );
        }
        lastStationId = sid;
        pending = [];
      } else if (pt.wp) {
        pending.push(pt.wp);
      }
    }
    map.lines[id]!.segments = segs;
  }

  return map;
}
