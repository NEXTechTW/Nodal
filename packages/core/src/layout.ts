/**
 * Auto-layout: parallel-line offsets + label auto-avoidance (PROJECT.md §5, §9).
 * Pure and deterministic so renderer + Canvas share the same result.
 * The parallel-offset boundary cases are isolated here for heavy unit tests.
 */
import { anchorOffset, anchorTextAnchor, normalOf } from "./geometry.js";
import { displayName } from "./types.js";
import { stationSymbolExtent } from "./station-symbols.js";
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
export function chainPoints(
  map: MetroMap,
  chain: string[],
  lineId?: string,
  offsets?: Map<string, Map<number, number>>,
): import("./types.js").Vec2[] {
  const pts: import("./types.js").Vec2[] = [];
  const line = lineId ? map.lines[lineId] : undefined;
  for (let i = 0; i < chain.length - 1; i++) {
    const fromId = chain[i]!;
    const toId = chain[i + 1]!;
    const a = map.stations[fromId]?.position;
    const b = map.stations[toId]?.position;
    if (!a || !b) continue;

    // Explicit waypoints win over auto-routing.
    let routed = routedPoints(a, b);
    let segIdx = -1;
    if (line) {
      segIdx = line.segments.findIndex((s) => (s.from === fromId && s.to === toId) || (s.from === toId && s.to === fromId));
      if (segIdx >= 0 && line.segments[segIdx]?.waypoints?.length) {
        const isRev = line.segments[segIdx]!.from === toId && line.segments[segIdx]!.to === fromId;
        const wps = line.segments[segIdx]!.waypoints!;
        routed = isRev ? [a, ...[...wps].reverse(), b] : [a, ...wps, b];
      }
    }

    if (lineId && offsets && segIdx >= 0) {
      const off = offsets.get(lineId)?.get(segIdx) ?? 0;
      if (off) {
        routed = offsetPolyline(routed, off);
      }
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
 * Offset a polyline laterally. Uses per-subsegment normals and intersects
 * adjacent offset segments so turns (elbows) stay cleanly parallel.
 */
export function offsetPolyline(points: Vec2[], offset: number): Vec2[] {
  if (offset === 0 || points.length < 2) return [...points];
  if (points.length === 2) {
    const n = normalOf(points[0]!, points[1]!);
    return [
      { x: points[0]!.x + n.x * offset, y: points[0]!.y + n.y * offset },
      { x: points[1]!.x + n.x * offset, y: points[1]!.y + n.y * offset },
    ];
  }
  const nSegs: Vec2[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    nSegs.push(normalOf(points[i]!, points[i + 1]!));
  }
  const out: Vec2[] = [];
  out.push({ x: points[0]!.x + nSegs[0]!.x * offset, y: points[0]!.y + nSegs[0]!.y * offset });
  for (let i = 1; i < points.length - 1; i++) {
    const n0 = nSegs[i - 1]!, n1 = nSegs[i]!;
    const pPrev = points[i - 1]!, pCurr = points[i]!, pNext = points[i + 1]!;
    const d0x = pCurr.x - pPrev.x, d0y = pCurr.y - pPrev.y;
    const d1x = pNext.x - pCurr.x, d1y = pNext.y - pCurr.y;
    const cross = d0x * d1y - d0y * d1x;
    if (Math.abs(cross) < 1e-4) {
      out.push({ x: pCurr.x + n0.x * offset, y: pCurr.y + n0.y * offset });
    } else {
      const aX = pPrev.x + n0.x * offset, aY = pPrev.y + n0.y * offset;
      const bX = pCurr.x + n1.x * offset, bY = pCurr.y + n1.y * offset;
      const t = ((bX - aX) * d1y - (bY - aY) * d1x) / cross;
      const interX = aX + t * d0x, interY = aY + t * d0y;
      if (Math.hypot(interX - pCurr.x, interY - pCurr.y) > Math.abs(offset) * 2.5) {
        out.push({ x: pCurr.x + n0.x * offset, y: pCurr.y + n0.y * offset });
      } else {
        out.push({ x: interX, y: interY });
      }
    }
  }
  const nLast = nSegs[nSegs.length - 1]!;
  out.push({ x: points[points.length - 1]!.x + nLast.x * offset, y: points[points.length - 1]!.y + nLast.y * offset });
  return out;
}

/* ---------------- Label auto-avoidance ---------------- */

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function boxesOverlap(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

function overlapArea(a: Box, b: Box): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Rough text width. CJK and full-width characters are close to one em,
 * Latin characters average a little over half an em.
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  let units = 0;
  for (const ch of text) {
    if (/\s/.test(ch)) units += 0.3;
    else if (/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(ch)) units += 1;
    else units += 0.6;
  }
  return units * fontSize;
}

export interface StationLabelLine {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  textAnchor: "start" | "middle" | "end";
}

/**
 * Baseline positions for a station name. Bilingual labels stack Chinese above
 * English and stay clear of the station: above for N anchors, below for S,
 * and centred beside the mark for E/W.
 */
export function stationLabelLines(
  station: MetroMap["stations"][string],
  map: MetroMap,
  anchor: Anchor = station.labelAnchor,
  bilingual = true,
): StationLabelLine[] {
  const off = anchorOffset(anchor, stationSymbolExtent(map, station) + 8);
  const x = station.position.x + off.x + (station.labelOffset?.x ?? 0);
  const y = station.position.y + off.y + (station.labelOffset?.y ?? 0);
  const fs = map.style.fontSize;
  const textAnchor = anchorTextAnchor(anchor);
  const zh = station.name["zh-TW"] || station.name["zh"];
  const en = station.name["en"];

  if (bilingual && zh && en) {
    const gap = fs * 1.05;
    const enSize = Math.max(8, Math.round(fs * 0.78));
    if (anchor.startsWith("N")) {
      return [
        { text: zh, x, y: y - gap, fontSize: fs, textAnchor },
        { text: en, x, y, fontSize: enSize, textAnchor },
      ];
    }
    if (anchor.startsWith("S")) {
      return [
        { text: zh, x, y, fontSize: fs, textAnchor },
        { text: en, x, y: y + gap, fontSize: enSize, textAnchor },
      ];
    }
    return [
      { text: zh, x, y: y - gap / 2, fontSize: fs, textAnchor },
      { text: en, x, y: y + gap / 2, fontSize: enSize, textAnchor },
    ];
  }

  const raw = displayName(station.name, "Station", map.style.labelLanguage);
  return [{ text: raw, x, y, fontSize: fs, textAnchor }];
}

function textLineBox(line: StationLabelLine): Box {
  const w = Math.max(24, estimateTextWidth(line.text, line.fontSize));
  const x0 =
    line.textAnchor === "start" ? line.x : line.textAnchor === "end" ? line.x - w : line.x - w / 2;
  return {
    x0,
    x1: x0 + w,
    y0: line.y - line.fontSize * 0.9,
    y1: line.y + line.fontSize * 0.3,
  };
}

/** Union of the boxes for every line of a station label. */
export function labelBox(
  station: MetroMap["stations"][string],
  map: MetroMap,
  anchor: Anchor = station.labelAnchor,
  bilingual = true,
): Box {
  const boxes = stationLabelLines(station, map, anchor, bilingual).map(textLineBox);
  return {
    x0: Math.min(...boxes.map((b) => b.x0)),
    y0: Math.min(...boxes.map((b) => b.y0)),
    x1: Math.max(...boxes.map((b) => b.x1)),
    y1: Math.max(...boxes.map((b) => b.y1)),
  };
}

const PREFERRED: Anchor[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/**
 * Greedy first-fit label placement: walk stations in id order, keep the
 * current anchor if free, otherwise try the next preferred anchor.
 * Manual placements are preserved when they already avoid overlap.
 * Returns a new map (immutable, undoable as one command).
 */
export function avoidLabelOverlaps(map: MetroMap, bilingual = true): MetroMap {
  const placed: Box[] = [];
  const stations: MetroMap["stations"] = {};
  // Deterministic order: by id so results don't depend on object insertion order.
  const ids = Object.keys(map.stations).sort();
  for (const id of ids) {
    const station = map.stations[id]!;
    const order: Anchor[] = [station.labelAnchor, ...PREFERRED.filter((a) => a !== station.labelAnchor)];
    let chosen: Anchor = station.labelAnchor;
    let chosenBox = labelBox(station, map, station.labelAnchor, bilingual);
    for (const anchor of order) {
      const box = labelBox(station, map, anchor, bilingual);
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

/* ---------------- Line-name placement ---------------- */

export interface LineLabelPlacement {
  x: number;
  y: number;
  textAnchor: "start" | "middle" | "end";
}

/**
 * Place each line name beside its route. Candidates sit along every segment,
 * offset to either side; the first one that clears station labels and other
 * line names wins. Deterministic so editor and export match.
 */
export function placeLineLabels(map: MetroMap, bilingual = true): Record<string, LineLabelPlacement> {
  const placed: Box[] = Object.values(map.stations).map((s) =>
    labelBox(s, map, s.labelAnchor, bilingual),
  );
  const fs = map.style.fontSize;
  const out: Record<string, LineLabelPlacement> = {};

  for (const line of Object.values(map.lines)) {
    const text = displayName(line.name, "Line", map.style.labelLanguage);
    if (!text.trim()) continue;
    const gap = (line.width ?? 8) / 2 + fs * 1.15 + 4;
    const candidates: LineLabelPlacement[] = [];

    for (const seg of line.segments) {
      const a = map.stations[seg.from];
      const b = map.stations[seg.to];
      if (!a || !b) continue;
      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) continue;
      const nx = -dy / len;
      const ny = dx / len;
      for (const t of [0.5, 0.35, 0.65, 0.25, 0.75]) {
        const cx = a.position.x + dx * t;
        const cy = a.position.y + dy * t;
        for (const side of [1, -1]) {
          for (const extra of [0, gap * 0.8]) {
            const d = side * (gap + extra);
            candidates.push({ x: cx + nx * d, y: cy + ny * d, textAnchor: "middle" });
          }
        }
      }
    }

    let best: LineLabelPlacement | null = null;
    let bestScore = Infinity;
    for (const cand of candidates) {
      const w = Math.max(24, estimateTextWidth(text, fs));
      const box: Box = {
        x0: cand.x - w / 2,
        y0: cand.y - fs * 0.9,
        x1: cand.x + w / 2,
        y1: cand.y + fs * 0.3,
      };
      const score = placed.reduce((sum, other) => sum + overlapArea(box, other), 0);
      if (score < bestScore) {
        best = cand;
        bestScore = score;
        if (score === 0) break;
      }
    }

    if (!best) {
      const seg = line.segments[0];
      const a = seg ? map.stations[seg.from] : undefined;
      const b = seg ? map.stations[seg.to] : undefined;
      if (!a || !b) continue;
      best = { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2, textAnchor: "middle" };
    }

    out[line.id] = best;
    const w = Math.max(24, estimateTextWidth(text, fs));
    placed.push({
      x0: best.x - w / 2,
      y0: best.y - fs * 0.9,
      x1: best.x + w / 2,
      y1: best.y + fs * 0.3,
    });
  }

  return out;
}
