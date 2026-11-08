/**
 * Pure geometry for transit maps.
 * Covers: 45° snap (PROJECT.md §5), rounded corners, parallel offsets,
 * label anchor offsets. All functions are pure and unit-tested.
 */
import type { Vec2 } from "./types.js";

export const DEG = Math.PI / 180;

export function distance(a: Vec2, b: Vec2): number {
  if (!a || !b) return 0;
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function angleDeg(a: Vec2, b: Vec2): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) / DEG + 360) % 360;
}

/**
 * Snap a point to the nearest 45° direction from an origin,
 * preserving distance from origin (PROJECT.md: 0°/45°/90°).
 */
export function snap45(origin: Vec2, point: Vec2): Vec2 {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { ...origin };
  const ang = Math.atan2(dy, dx);
  const snapped = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
  return {
    x: origin.x + Math.cos(snapped) * dist,
    y: origin.y + Math.sin(snapped) * dist,
  };
}

/** Snap to nearest multiple of `step` degrees. */
export function snapAngle(origin: Vec2, point: Vec2, stepDeg = 45): Vec2 {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { ...origin };
  const step = (stepDeg * DEG) as number;
  const ang = Math.atan2(dy, dx);
  const snapped = Math.round(ang / step) * step;
  return {
    x: origin.x + Math.cos(snapped) * dist,
    y: origin.y + Math.sin(snapped) * dist,
  };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

/** Unit normal (perpendicular) of segment a→b, pointing to the left. */
export function normalOf(a: Vec2, b: Vec2): Vec2 {
  const d = normalize(sub(b, a));
  return { x: -d.y, y: d.x };
}

/**
 * Offset a single straight segment laterally by `offset` units.
 * Used for parallel-line layout (PROJECT.md §5) — caller assigns per-line offsets.
 */
export function offsetSegment(a: Vec2, b: Vec2, offset: number): [Vec2, Vec2] {
  const n = normalOf(a, b);
  return [add(a, scale(n, offset)), add(b, scale(n, offset))];
}

/**
 * Insert rounded corners at every vertex.
 * Returns a polyline of interpolated points approximating arcs.
 * `radius` is clamped to half the shorter adjacent edge.
 * Pure & testable; the renderer turns the result into path `d`.
 */
export function roundedPolyline(points: Vec2[], radius: number): Vec2[] {
  if (points.length < 3 || radius <= 0) return [...points];
  const out: Vec2[] = [points[0]!];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;
    const d1 = distance(curr, prev);
    const d2 = distance(next, curr);
    const r = Math.min(radius, d1 / 2, d2 / 2);
    if (r <= 0.5) {
      out.push(curr);
      continue;
    }
    const dirIn = scale(sub(prev, curr), 1 / d1);
    const dirOut = scale(sub(next, curr), 1 / d2);
    const pIn = add(curr, scale(dirIn, r));
    const pOut = add(curr, scale(dirOut, r));
    out.push(pIn);
    // Quadratic Bézier midpoint approximation (1 control point → 3 samples).
    const cx = curr;
    const mid1 = qbez(pIn, cx, pOut, 0.33);
    const mid2 = qbez(pIn, cx, pOut, 0.66);
    out.push(mid1, mid2);
    // pOut becomes the next segment start; push it as vertex.
    out.push(pOut);
  }
  out.push(points[points.length - 1]!);
  return out;
}

function qbez(p0: Vec2, p1: Vec2, p2: Vec2, t: number): Vec2 {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/** Anchor → offset direction in map units (y-down, screen coords). */
export function anchorOffset(anchor: string, gap = 14): Vec2 {
  const s = gap / Math.SQRT2;
  switch (anchor) {
    case "N": return { x: 0, y: -gap };
    case "NE": return { x: s, y: -s };
    case "E": return { x: gap, y: 0 };
    case "SE": return { x: s, y: s };
    case "S": return { x: 0, y: gap };
    case "SW": return { x: -s, y: s };
    case "W": return { x: -gap, y: 0 };
    case "NW": return { x: -s, y: -s };
    default: return { x: 0, y: -gap };
  }
}

export function anchorTextAnchor(anchor: string): "start" | "middle" | "end" {
  if (anchor.includes("E")) return "start";
  if (anchor.includes("W")) return "end";
  return "middle";
}

export function anchorBaseline(anchor: string): "hanging" | "middle" | "auto" {
  if (anchor.startsWith("N")) return "auto";
  if (anchor.startsWith("S")) return "hanging";
  return "middle";
}

export function svgPath(points: Vec2[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
}
