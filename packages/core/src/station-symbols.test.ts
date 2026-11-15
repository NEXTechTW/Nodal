import { describe, expect, it } from "vitest";
import { CommandStack, emptyMap, parseMapFile, setTitleCommand, stationLabelLines, stationSymbolExtent, stationSymbolSVG, validateMap, validateStationSymbol, type StationSymbol, type StationSymbolLayer } from "./index.js";

const layer: StationSymbolLayer = {
  id: "layer", type: "rect", x: 2, y: -3, width: 24, height: 12,
  fill: "currentColor", stroke: "#12345678", strokeWidth: 2, rotation: 30,
};
const symbol: StationSymbol = { id: "mark", name: "Custom mark", layers: [layer] };

describe("station symbols", () => {
  it("round-trips reusable marks and assignments without changing legacy maps", () => {
    const map = emptyMap();
    expect(parseMapFile(JSON.stringify(map))).not.toHaveProperty("stationSymbols");
    map.stationSymbols = { mark: symbol };
    map.stations.a = { id: "a", name: { en: "A" }, position: { x: 0, y: 0 }, kind: "normal", labelAnchor: "E", symbolId: "mark" };
    expect(validateMap(map)).toEqual([]);
    expect(parseMapFile(JSON.stringify(map))).toEqual(map);
    expect(stationSymbolExtent(map, map.stations.a)).toBe(40 * map.style.stationRadius / 12);
    expect(stationLabelLines(map.stations.a, map)[0]!.x).toBe(stationSymbolExtent(map, map.stations.a) + 8);
  });

  it("rejects dangling references, invalid collections, and mismatched symbol IDs", () => {
    const map = emptyMap();
    map.stations.a = { id: "a", name: {}, position: { x: 0, y: 0 }, kind: "normal", labelAnchor: "N", symbolId: "toString" };
    expect(validateMap(map).some((issue) => issue.path.endsWith("symbolId"))).toBe(true);
    expect(() => parseMapFile(JSON.stringify(map))).toThrow(/symbolId/);
    expect(validateMap({ ...map, stationSymbols: [] }).some((issue) => issue.path === "$.stationSymbols")).toBe(true);
    expect(validateMap({ ...map, stationSymbols: { wrong: symbol } }).some((issue) => issue.path.endsWith(".id"))).toBe(true);
  });

  it.each([
    { x: NaN }, { y: Infinity }, { x: 25 }, { width: -1 }, { height: 100001 },
    { strokeWidth: 100001 }, { rotation: 361 }, { fill: "url(https://example.com)" },
    { stroke: '" onload="alert(1)' }, { type: "script" }, { id: "" },
    { matrix: [1, 0, 0, 1, 0] }, { matrix: [1, 0, 0, 1, 0, Infinity] },
    { matrix: [10001, 0, 0, 1, 0, 0] },
  ])("rejects unsafe or out-of-range layer fields %j", (patch) => {
    expect(validateStationSymbol({ ...symbol, layers: [{ ...layer, ...patch }] }).length).toBeGreaterThan(0);
  });

  it("limits layers and rejects duplicate IDs", () => {
    expect(validateStationSymbol({ ...symbol, layers: Array.from({ length: 101 }, (_, i) => ({ ...layer, id: String(i) })) })).not.toEqual([]);
    expect(validateStationSymbol({ ...symbol, layers: [layer, layer] })).not.toEqual([]);
    expect(validateStationSymbol({ ...symbol, layers: null })).not.toEqual([]);
  });

  it.each(['M0 0"><script/>', "M0 0 L1e999 0", "M0 0 X1 2", "M0 0 L NaN 0", "M0 0 L1e 0", "M" + "0".repeat(10000)])("rejects unsafe path data %s", (d) => {
    const unsafe = { ...symbol, layers: [{ ...layer, type: "path" as const, d }] };
    expect(validateStationSymbol(unsafe)).not.toEqual([]);
    expect(() => stationSymbolSVG(unsafe)).toThrow(/Invalid station symbol/);
  });

  it("serializes all centered primitives with imported geometry transforms", () => {
    const imported: StationSymbol = { ...symbol, layers: [
      { ...layer, id: "ellipse", type: "circle" },
      layer,
      { ...layer, id: "line", type: "line" },
      { ...layer, id: "path", type: "path", d: "M1e2 0 C1 2 3 4 5 6z", width: 1000, strokeWidth: 100, matrix: [0.1, 0, 0, 0.1, -5, 0] },
    ] };
    expect(validateStationSymbol(imported)).toEqual([]);
    const svg = stationSymbolSVG(imported);
    expect(svg).toContain('<ellipse cx="0" cy="0" rx="12" ry="6"');
    expect(svg).toContain('<rect x="-12" y="-6" width="24" height="12"');
    expect(svg).toContain('<line x1="-12" y1="-6" x2="12" y2="6"');
    expect(svg).toContain('translate(2 -3) rotate(30) matrix(0.1 0 0 0.1 -5 0)');
    expect(svg).toContain('d="M1e2 0 C1 2 3 4 5 6z"');
    expect(svg).not.toContain("scale(1000");
  });
});

describe("CommandStack.sync", () => {
  it("adopts external edits and preserves undo and redo history", () => {
    const stack = new CommandStack(emptyMap("Before"));
    stack.dispatch(setTitleCommand("Before", "After"));
    const synced = { ...stack.current, stationSymbols: { mark: symbol } };
    stack.sync(synced);
    expect(stack.current).toBe(synced);
    expect(stack.history()).toEqual(["Rename map"]);
    expect(stack.undo().stationSymbols).toEqual({ mark: symbol });
    const second = { ...stack.current, meta: { ...stack.current.meta, author: "Editor" } };
    stack.sync(second);
    expect(stack.canRedo).toBe(true);
    expect(stack.redo().meta).toMatchObject({ title: "After", author: "Editor" });
  });
});
