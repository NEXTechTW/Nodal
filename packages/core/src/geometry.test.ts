import { describe, expect, it } from "vitest";
import { anchorOffset, offsetSegment, roundedPolyline, snap45, svgPath } from "./geometry.js";

describe("snap45", () => {
  it("snaps to nearest 45°", () => {
    const origin = { x: 0, y: 0 };
    const out = snap45(origin, { x: 10, y: 3 });
    const ang = (Math.atan2(out.y, out.x) * 180) / Math.PI;
    expect(ang).toBeCloseTo(0, 5);
  });
  it("snaps diagonal exactly", () => {
    const out = snap45({ x: 0, y: 0 }, { x: 10, y: 9 });
    expect(out.y).toBeCloseTo(out.x, 5);
  });
  it("preserves origin", () => {
    expect(snap45({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
  });
});

describe("roundedPolyline", () => {
  it("returns endpoints unchanged for 2 points", () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
    expect(roundedPolyline(pts, 5)).toEqual(pts);
  });
  it("inserts curve points and keeps endpoints", () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
    const out = roundedPolyline(pts, 20);
    expect(out[0]).toEqual(pts[0]);
    expect(out[out.length - 1]).toEqual(pts[2]);
    expect(out.length).toBeGreaterThan(3);
  });
  it("clamps radius to half edge", () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
    const out = roundedPolyline(pts, 100);
    expect(out.length).toBeGreaterThan(3);
    for (const p of out) {
      expect(Math.abs(p.x)).toBeLessThan(20);
      expect(Math.abs(p.y)).toBeLessThan(20);
    }
  });
});

describe("offsetSegment + anchor", () => {
  it("offsets horizontally for vertical segment", () => {
    const [a, b] = offsetSegment({ x: 0, y: 0 }, { x: 0, y: 10 }, 5);
    expect(Math.abs(a.x - b.x)).toBeLessThan(0.001);
    expect(Math.abs(a.x)).toBeCloseTo(5, 5);
  });
  it("anchorOffset N points up", () => {
    expect(anchorOffset("N", 10)).toEqual({ x: 0, y: -10 });
  });
});

describe("svgPath", () => {
  it("builds M/L path", () => {
    expect(svgPath([{ x: 0, y: 0 }, { x: 10, y: 0 }])).toBe("M0.00 0.00 L10.00 0.00");
  });
});
