import { describe, expect, it } from "vitest";
import { emptyMap, stationSymbolExtent, validateMap, type StationSymbolLayer } from "@nodal/core";
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

  it("renders reusable symbols with line color, station rotation, and no built-in halo", () => {
    const m = emptyMap();
    m.style.stationRadius = 12;
    m.stations.a = { id: "a", name: { en: "A" }, position: { x: 50, y: 60 }, kind: "interchange", labelAnchor: "E", rotation: 45, symbolId: "mark" };
    m.lines.l = { id: "l", name: {}, color: "#123456", style: "solid", segments: [{ from: "a", to: "a" }] };
    const base: StationSymbolLayer = { id: "ellipse", type: "circle", x: 0, y: 0, width: 20, height: 10, fill: "none", stroke: "currentColor", strokeWidth: 2, rotation: 15 };
    m.stationSymbols = { mark: { id: "mark", name: "Mark", layers: [base,
      { ...base, id: "rect", type: "rect", x: 4, y: 2 },
      { ...base, id: "line", type: "line" },
      { ...base, id: "path", type: "path", d: "M0 0L100 100", matrix: [0.1, 0, 0, 0.1, -5, -5] },
    ] } };
    const svg = toSVGString(m, { selectedId: "a" });
    expect(svg).toContain('data-station="a" transform="rotate(45 50 60)"');
    expect(svg).toContain('transform="translate(50 60) scale(1)" color="#123456"');
    expect(svg).toContain('<ellipse cx="0" cy="0" rx="10" ry="5"');
    expect(svg).toContain('translate(4 2) rotate(15)');
    expect(svg).toContain('matrix(0.1 0 0 0.1 -5 -5)');
    expect(svg).not.toContain("<circle");
    expect(stationLabelPos(m, "a").x).toBe(50 + stationSymbolExtent(m, m.stations.a) + 8);
  });

  it("includes custom mark extents in export bounds at large station radii", () => {
    const m = emptyMap();
    m.style.stationRadius = 120;
    m.stations.a = { id: "a", name: {}, position: { x: 0, y: 0 }, kind: "normal", labelAnchor: "N", symbolId: "mark" };
    m.stationSymbols = { mark: { id: "mark", name: "Mark", layers: [] } };
    expect(computeBounds(m)).toEqual({ x: -480, y: -480, w: 960, h: 960 });
  });
});
