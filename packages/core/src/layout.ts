/**
 * Auto-layout: parallel-line offsets + label auto-avoidance (PROJECT.md §5, §9).
 * Pure and deterministic so renderer + Canvas share the same result.
 * The parallel-offset boundary cases are isolated here for heavy unit tests.
 */
import { anchorOffset, normalOf } from "./geometry.js";
import { displayName } from "./types.js";
import type { Vec2, MetroMap, Anchor } from "./types.js";

/** Unordered station-pair key so A→B and B→A count as the same track. */
export function trackKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

/** Ordered station-id chains for one line (branching lines yield several chains). */
export function lineChains(map: MetroMap, lineId: string): string[][] {
  const line = map.lines[lineId];
  if (!line) return [];
  const chains: string[][] = [];
  for (const seg of line.segments) {
    const idx = chains.findIndex((c) => c[c.length - 1] === seg.from);
    if (idx >= 0) chains[idx]!.push(seg.to);
    else {
      // Reverse match: from is the end of a chain stored backwards.
      const revIdx = chains.findIndex((c) => c[0] === seg.to);
      if (revIdx >= 0) chains[revIdx]!.unshift(seg.from);
      else chains.push([seg.from, seg.to]);
    }
  }
  return chains.filter((c) => c.length > 1);
}

/**
 * Octilinear routing: stay on 0°/45°/90° like real transit maps.
 * If the delta is not axis-aligned or 45°, split it into a 45° diagonal
 * plus an orthogonal remainder through one elbow.
 */
export function routedPoints(a: import("./types.js").Vec2, b: import("./types.js").Vec2): import("./types.js").Vec2[] {
  if (a.x === b.x || a.y === b.y) return [a, b];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 1) return [a, b]; // already 45°
  if (Math.abs(dx) >= Math.abs(dy)) {
    // Diagonal first (dy worth), then horizontal.
    const mid = { x: a.x + Math.sign(dx) * Math.abs(dy), y: b.y };
    return [a, mid, b];
  }
  // Vertical remainder: diagonal dx worth, then vertical.
  const mid = { x: b.x, y: a.y + Math.sign(dy) * Math.abs(dx) };
  return [a, mid, b];
}

/** Expand station chains into routed map points (elbow + waypoints per segment). */
export function chainPoints(map: MetroMap, chain: string[], lineId?: string): import("./types.js").Vec2[] {
  const pts: import("./types.js").Vec2[] = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const a = map.stations[chain[i]!]?.position;
    const b = map.stations[chain[i + 1]!]?.position;
    if (!a || !b) continue;
    // Explicit waypoints win over auto-routing.
    let routed = routedPoints(a, b);
    if (lineId) {
      const line = map.lines[lineId];
      const seg = line?.segments.find((s) => s.from === chain[i] && s.to === chain[i + 1]);
      if (seg?.waypoints?.length) routed = [a, ...seg.waypoints, b];
    }
    if (i === 0) pts.push(...routed);
    else pts.push(...routed.slice(1));
  }
  return pts;
}

export interface ParallelOffsets {
  /** lineId → segIndex → lateral offset (map units). Missing = 0. */
  bySegment: Map<string, Map<number, number>>;
  /** How many tracks carry ≥2 lines (for UI badges). */
  sharedTracks: number;
}

/**
 * Assign each line a lateral offset where several lines share the same track.
 * Offsets are centred: for n lines on one track, positions are
 * -(n-1)/2 … +(n-1)/2 times `step`. Single-line tracks get 0 (no jitter).
 */
export function computeParallelOffsets(map: MetroMap, step = 10): ParallelOffsets {
  const byTrack = new Map<string, string[]>(); // trackKey → lineIds in first-seen order
  for (const [lineId, line] of Object.entries(map.lines)) {
    for (const seg of line.segments) {
      const key = trackKey(seg.from, seg.to);
      const list = byTrack.get(key) ?? [];
      if (!list.includes(lineId)) list.push(lineId);
      byTrack.set(key, list);
    }
  }
  const bySegment = new Map<string, Map<number, number>>();
  let sharedTracks = 0;
  for (const [key, lineIds] of byTrack) {
    if (lineIds.length < 2) continue;
    sharedTracks++;
    const n = lineIds.length;
    lineIds.forEach((lineId, rank) => {
      const offset = (rank - (n - 1) / 2) * step;
      if (offset === 0) return;
      const line = map.lines[lineId];
      if (!line) return;
      line.segments.forEach((seg, idx) => {
        if (trackKey(seg.from, seg.to) !== key) return;
        const m = bySegment.get(lineId) ?? new Map<number, number>();
        m.set(idx, offset);
        bySegment.set(lineId, m);
      });
    });
  }
  return { bySegment, sharedTracks };
}

/**
 * Offset a polyline laterally. Straight segments use their own normal;
 * for simplicity waypoints reuse the overall segment normal so straight
 * 45° tracks (the common case) stay perfectly parallel.
 */
export function offsetPolyline(points: Vec2[], offset: number): Vec2[] {
  if (offset === 0 || points.length < 2) return [...points];
  const n = normalOf(points[0]!, points[points.length - 1]!);
  return points.map((p) => ({ x: p.x + n.x * offset, y: p.y + n.y * offset }));
}

/* ---------------- Label auto-avoidance ---------------- */

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function boxesOverlap(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

/** Rough label box: width ≈ 0.62 × fontSize × charCount, height ≈ fontSize × 1.2. */
export function labelBox(
  station: MetroMap["stations"][string],
  map: MetroMap,
  anchor: Anchor = station.labelAnchor,
): Box {
  const off = anchorOffset(anchor, map.style.stationRadius + 8);
  const cx = station.position.x + off.x;
  const cy = station.position.y + off.y;
  const text = displayName(station.name, "Station");
  const w = Math.max(24, text.length * map.style.fontSize * 0.62);
  const h = map.style.fontSize * 1.25;
  let x0: number, x1: number;
  if (anchor.includes("E")) { x0 = cx; x1 = cx + w; }
  else if (anchor.includes("W")) { x0 = cx - w; x1 = cx; }
  else { x0 = cx - w / 2; x1 = cx + w / 2; }
  let y0: number, y1: number;
  if (anchor.startsWith("N")) { y0 = cy - h; y1 = cy; }
  else if (anchor.startsWith("S")) { y0 = cy; y1 = cy + h; }
  else { y0 = cy - h / 2; y1 = cy + h / 2; }
  return { x0, y0, x1, y1 };
}

const PREFERRED: Anchor[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/**
 * Greedy first-fit label placement: walk stations in id order, keep the
 * current anchor if free, otherwise try the next preferred anchor.
 * Manual placements are preserved when they already avoid overlap.
 * Returns a new map (immutable, undoable as one command).
 */
export function avoidLabelOverlaps(map: MetroMap): MetroMap {
  const placed: Box[] = [];
  const stations: MetroMap["stations"] = {};
  // Deterministic order: by id so results don't depend on object insertion order.
  const ids = Object.keys(map.stations).sort();
  for (const id of ids) {
    const station = map.stations[id]!;
    const order: Anchor[] = [station.labelAnchor, ...PREFERRED.filter((a) => a !== station.labelAnchor)];
    let chosen: Anchor = station.labelAnchor;
    let chosenBox = labelBox(station, map, station.labelAnchor);
    for (const anchor of order) {
      const box = labelBox(station, map, anchor);
      if (!placed.some((p) => boxesOverlap(box, p))) {
        chosen = anchor;
        chosenBox = box;
        break;
      }
    }
    placed.push(chosenBox);
    stations[id] = { ...station, labelAnchor: chosen };
  }
  return { ...map, stations };
}
