import { describe, expect, it } from "vitest";
import { emptyMap } from "./types.js";
import { avoidLabelOverlaps, computeParallelOffsets, labelBox, offsetPolyline, trackKey } from "./layout.js";

function twoStations() {
  const m = emptyMap("T");
  m.stations["a"] = { id: "a", name: { en: "Alpha" }, position: { x: 0, y: 0 }, kind: "normal", labelAnchor: "N" };
  m.stations["b"] = { id: "b", name: { en: "Beta" }, position: { x: 100, y: 0 }, kind: "normal", labelAnchor: "N" };
  return m;
}

describe("trackKey / parallel offsets", () => {
  it("treats A→B and B→A as the same track", () => {
    expect(trackKey("a", "b")).toBe(trackKey("b", "a"));
  });
  it("leaves single-line tracks unshifted", () => {
    const m = twoStations();
    m.lines["l1"] = { id: "l1", name: { en: "L1" }, color: "#000000", style: "solid", segments: [{ from: "a", to: "b" }] };
    expect(computeParallelOffsets(m).bySegment.size).toBe(0);
  });
  it("centres two shared lines at ±step/2", () => {
    const m = twoStations();
    m.lines["l1"] = { id: "l1", name: { en: "L1" }, color: "#000000", style: "solid", segments: [{ from: "a", to: "b" }] };
    m.lines["l2"] = { id: "l2", name: { en: "L2" }, color: "#111111", style: "solid", segments: [{ from: "b", to: "a" }] };
    const r = computeParallelOffsets(m, 10);
    expect(r.sharedTracks).toBe(1);
    expect(r.bySegment.get("l1")!.get(0)).toBe(-5);
    expect(r.bySegment.get("l2")!.get(0)).toBe(5);
  });
  it("offsets a polyline by the segment normal", () => {
    const out = offsetPolyline([{ x: 0, y: 0 }, { x: 100, y: 0 }], 5);
    expect(out[0]).toEqual({ x: 0, y: 5 });
    expect(out[1]).toEqual({ x: 100, y: 5 });
  });
});

describe("label avoidance", () => {
  it("keeps non-overlapping anchors and moves only the collider", () => {
    const m = emptyMap("T");
    m.style.fontSize = 14;
    // Two stations close together, both anchored N — labels collide.
    m.stations["a"] = { id: "a", name: { en: "LongNameAlpha" }, position: { x: 0, y: 0 }, kind: "normal", labelAnchor: "N" };
    m.stations["b"] = { id: "b", name: { en: "LongNameBeta" }, position: { x: 30, y: 0 }, kind: "normal", labelAnchor: "N" };
    const out = avoidLabelOverlaps(m);
    // First station keeps N; second must move.
    expect(out.stations["a"]!.labelAnchor).toBe("N");
    expect(out.stations["b"]!.labelAnchor).not.toBe("N");
    // No overlap between the chosen boxes.
    const ba = labelBox(out.stations["a"]!, out);
    const bb = labelBox(out.stations["b"]!, out);
    const overlap = ba.x0 < bb.x1 && ba.x1 > bb.x0 && ba.y0 < bb.y1 && ba.y1 > bb.y0;
    expect(overlap).toBe(false);
  });
  it("is deterministic by id order", () => {
    const m = twoStations();
    expect(avoidLabelOverlaps(m)).toEqual(avoidLabelOverlaps(m));
  });
});
