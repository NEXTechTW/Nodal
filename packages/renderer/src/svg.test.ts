import { describe, expect, it } from "vitest";
import { emptyMap, validateMap } from "@linewright/core";
import { computeBounds, linePathPoints, stationLabelPos, toSVGString } from "./svg.js";

describe("renderer/svg", () => {
  it("renders an empty map with background and title", () => {
    const svg = toSVGString(emptyMap("Plain"));
    expect(svg).toContain("<svg");
    expect(svg).toContain("<title>Plain</title>");
    expect(svg).toContain('role="img"');
  });

  it("escapes title and station names", () => {
    const m = emptyMap('A & <B> "C"');
    m.stations["s1"] = {
      id: "s1",
      name: { en: 'X & "Y" <Z>' },
      position: { x: 0, y: 0 },
      kind: "normal",
      labelAnchor: "N",
    };
    const svg = toSVGString(m);
    expect(svg).not.toContain('X & "Y" <Z>');
    expect(svg).toContain("&amp;");
  });

  it("computes bounds with padding, defaulting when empty", () => {
    expect(computeBounds(emptyMap())).toEqual({ x: 0, y: 0, w: 800, h: 600 });
    const m = emptyMap();
    m.stations["a"] = { id: "a", name: { en: "A" }, position: { x: 100, y: 100 }, kind: "normal", labelAnchor: "N" };
    const b = computeBounds(m);
    expect(b.x).toBeLessThanOrEqual(20);
    expect(b.w).toBeGreaterThanOrEqual(200);
  });

  it("builds line points honoring corner radius and drops dangling refs", () => {
    const m = emptyMap();
    m.stations["a"] = { id: "a", name: { en: "A" }, position: { x: 0, y: 0 }, kind: "normal", labelAnchor: "N" };
    m.stations["b"] = { id: "b", name: { en: "B" }, position: { x: 100, y: 0 }, kind: "normal", labelAnchor: "N" };
    m.stations["c"] = { id: "c", name: { en: "C" }, position: { x: 100, y: 100 }, kind: "normal", labelAnchor: "N" };
    m.lines["l"] = {
      id: "l",
      name: { en: "L" },
      color: "#E00034",
      style: "solid",
      segments: [{ from: "a", to: "b" }, { from: "missing", to: "c" }],
    };
    expect(linePathPoints(m, "l", 0).length).toBeGreaterThan(1);
    expect(linePathPoints(m, "l", 1)).toEqual([]);
    expect(linePathPoints(m, "nope", 0)).toEqual([]);
  });

  it("positions labels by anchor and parses back as valid", () => {
    const m = emptyMap("Roundtrip");
    m.stations["s"] = { id: "s", name: { en: "S" }, position: { x: 50, y: 50 }, kind: "interchange", labelAnchor: "E" };
    const pos = stationLabelPos(m, "s");
    expect(pos.x).toBeGreaterThan(50);
    expect(validateMap(m)).toEqual([]);
  });
});
