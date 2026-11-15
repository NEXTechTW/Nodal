import { afterEach, describe, expect, it, vi } from "vitest";
import { importStationSymbolSVG } from "./stationSymbolImport.js";

// Node has no XML DOM. These fixtures exercise the importer after XML parsing;
// browser smoke checks cover the real DOMParser and malformed XML separately.
function element(tag: string, attributes: Record<string, string> = {}, children: unknown[] = []): Element {
  return {
    localName: tag, namespaceURI: "http://www.w3.org/2000/svg", nodeType: 1,
    attributes: Object.entries(attributes).map(([name, value]) => ({ name, value })),
    getAttribute: (name: string) => attributes[name] ?? null,
    hasAttribute: (name: string) => Object.hasOwn(attributes, name),
    childNodes: children,
  } as unknown as Element;
}

function fixture(children: Element[], attributes: Record<string, string> = {}, parserError = false): void {
  const root = element("svg", { viewBox: "0 0 100 100", ...attributes }, children);
  vi.stubGlobal("DOMParser", class {
    parseFromString() {
      return { documentElement: root, getElementsByTagName: () => parserError ? [element("parsererror")] : [] };
    }
  });
}

const svg = "<svg/>";
const importFixture = () => importStationSymbolSVG(svg, "  Test mark  ");
afterEach(() => vi.unstubAllGlobals());

describe("importStationSymbolSVG", () => {
  it("normalizes native geometry into a centered 40-unit viewport with editable offsets", () => {
    fixture([element("circle", { cx: "50", cy: "50", r: "25" })]);
    const result = importFixture();
    expect(result.name).toBe("Test mark");
    expect(result.id).toBeTruthy();
    expect(result.layers[0]).toMatchObject({
      type: "circle", x: 0, y: 0, rotation: 0, width: 50, height: 50,
      matrix: [0.4, 0, 0, 0.4, 0, 0], fill: "#000000", stroke: "none", strokeWidth: 1,
    });
  });

  it("centers a non-square, non-origin viewBox without stretching", () => {
    fixture([element("path", { d: "M 0 0 L 10 10" })], { viewBox: "10 20 200 100" });
    expect(importFixture().layers[0]!.matrix).toEqual([0.2, 0, 0, 0.2, -22, -14]);
  });

  it("combines parent transforms in SVG order and inherits presentation/style", () => {
    fixture([element("g", { transform: "translate(10 20) scale(2)", fill: "red", stroke: "blue", "stroke-width": "20" }, [
      element("rect", { x: "5", y: "10", width: "20", height: "10", style: "fill: rgb(0, 100%, 0); stroke: inherit; stroke-linecap: butt" }),
    ])]);
    expect(importFixture().layers[0]).toMatchObject({
      type: "rect", width: 20, height: 10, fill: "#00ff00", stroke: "#0000ff", strokeWidth: 20,
      matrix: [0.8, 0, 0, 0.8, -4, 0],
    });
  });

  it("supports ellipse, descending line, polygon and polyline geometry", () => {
    fixture([
      element("ellipse", { cx: "50", cy: "50", rx: "20", ry: "10" }),
      element("line", { x1: "80", y1: "10", x2: "20", y2: "40" }),
      element("polygon", { points: "0,0 10,0 10,10" }),
      element("polyline", { points: "0,0 10,10" }),
    ]);
    const layers = importFixture().layers;
    expect(layers[0]).toMatchObject({ type: "circle", width: 40, height: 20 });
    expect(layers[1]).toMatchObject({ type: "line", width: 60, height: 30, matrix: [-0.4, 0, 0, 0.4, 0, -10] });
    expect(layers[2]!.d).toBe("M 0 0 L 10 0 10 10 Z");
    expect(layers[3]!.d).toBe("M 0 0 L 10 10");
    expect(new Set(layers.map((layer) => layer.id)).size).toBe(4);
  });

  it.each(["translate(1)", "scale(2,3)", "rotate(90,50,50)", "skewX(30)", "skewY(-30)", "matrix(1 0 0 1 10 20)"])("supports %s safely", (transform) => {
    fixture([element("path", { d: "M0 0h1v1z", transform })]);
    expect(importFixture().layers[0]!.matrix!.every(Number.isFinite)).toBe(true);
  });

  it("retains native path commands and currentColor without retaining markup", () => {
    const d = "M0 0 C1 2 3 4 5 6 S7 8 9 10 Q11 12 13 14 T15 16 A10 20 30 0 1 40 50z";
    fixture([element("path", { d, fill: "currentColor", stroke: "#abc" })]);
    expect(importFixture().layers[0]).toMatchObject({ d, fill: "currentColor", stroke: "#aabbcc" });
    expect(JSON.stringify(importFixture())).not.toContain("<");
  });

  it.each(["script", "style", "text", "image", "use", "foreignObject", "linearGradient", "filter", "defs", "constructor"])("rejects unsupported <%s>", (tag) => {
    fixture([element(tag)]);
    expect(importFixture).toThrow(/Unsupported/);
  });

  it.each([
    { onclick: "alert(1)" }, { href: "https://example.com/x" }, { fill: "url(#gradient)" },
    { style: "opacity: .5" }, { "stroke-linecap": "round" }, { "stroke-linejoin": "bevel" },
    { "fill-rule": "evenodd" }, { "clip-path": "url(#clip)" }, { transform: "translate(NaN)" },
    { transform: "skewX(90)" }, { transform: "rotate(1,2)" }, { transform: "translate(1)," },
    { transform: "scale(1e99)" }, { "stroke-width": "-1" }, { fill: "rgba(0,0,0,.5)" },
  ])("rejects unsafe or unrepresentable attributes %o", (attributes) => {
    fixture([element("path", { d: "M0 0L1 1", ...attributes })]);
    expect(importFixture).toThrow(/Cannot import SVG/);
  });

  it.each(["M0", "L0 0", "M0 0 R1 2", "M0 0A1 1 0 2 0 2 2", "M0 0A-1 1 0 0 0 2 2", "M0 0LNaN 1", "M0 0Z1", "M,0 0", "M0 0,L1 1", "M0 0L1e999 0"])("rejects malformed path %s", (d) => {
    fixture([element("path", { d })]);
    expect(importFixture).toThrow(/Cannot import SVG/);
  });

  it("enforces import size, layer count, path length, and native dimension limits", () => {
    expect(() => importStationSymbolSVG(" ".repeat(200001), "Test")).toThrow(/200 KB/);
    expect(() => importStationSymbolSVG("\u00e9".repeat(100001), "Test")).toThrow(/200 KB/);
    fixture(Array.from({ length: 101 }, () => element("circle", { r: "1" })));
    expect(importFixture).toThrow(/100 layer/);
    fixture([element("path", { d: "M0 0 " + "L1 1 ".repeat(4000) })]);
    expect(importFixture).toThrow(/20000/);
    fixture([element("rect", { width: "100001", height: "1" })]);
    expect(importFixture).toThrow(/100000/);
    fixture([element("circle", { r: "-1" })]);
    expect(importFixture).toThrow(/dimensions/);
  });

  it("accepts native dimensions and strokes through 100000", () => {
    fixture([element("rect", { width: "100000", height: "100000", "stroke-width": "100000" })], { viewBox: "0 0 100000 100000" });
    expect(importFixture().layers[0]).toMatchObject({ width: 100000, height: 100000, strokeWidth: 100000 });
  });

  it.each(["<!DOCTYPE svg><svg/>", "<!ENTITY x 'x'><svg/>", "<?xml-stylesheet href='x'?><svg/>"])("rejects declarations before XML parsing", (source) => {
    expect(() => importStationSymbolSVG(source, "Test")).toThrow(/Document types/);
  });

  it("rejects XML parser errors and empty artwork", () => {
    fixture([], {}, true);
    expect(importFixture).toThrow(/Malformed/);
    fixture([element("title"), element("desc"), element("metadata")]);
    expect(importFixture).toThrow(/no supported artwork/);
  });

  it("rejects rounded rectangles and malformed viewports rather than changing their appearance", () => {
    fixture([element("rect", { width: "20", height: "10", rx: "2" })]);
    expect(importFixture).toThrow(/Rounded rectangles/);
    for (const viewBox of ["0 0 0 10", "0 0 -10 10", "0 0 10", "0 0 Infinity 10"]) {
      fixture([element("circle", { r: "1" })], { viewBox });
      expect(importFixture).toThrow(/Cannot import SVG/);
    }
  });
});
