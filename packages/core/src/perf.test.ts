/**
 * Performance baseline (PROJECT.md §9): SVG with too many elements janks.
 * This test records layout times so a future renderer swap has a ceiling.
 * Thresholds are generous for CI; the log is the real signal.
 */
import { describe, expect, it } from "vitest";
import { emptyMap } from "./types.js";
import { avoidLabelOverlaps, computeParallelOffsets } from "./layout.js";

function gridMap(n: number) {
  const m = emptyMap("Perf");
  const cols = Math.ceil(Math.sqrt(n));
  for (let i = 0; i < n; i++) {
    const x = (i % cols) * 60;
    const y = Math.floor(i / cols) * 60;
    m.stations[`s${i}`] = { id: `s${i}`, name: { en: `Station ${i}` }, position: { x, y }, kind: "normal", labelAnchor: "N" };
  }
  // Snake chain so 2 lines can share the first track (parallel-offset path).
  const chain = Object.keys(m.stations);
  m.lines["l1"] = { id: "l1", name: { en: "A" }, color: "#E00034", style: "solid", segments: chain.slice(0, -1).map((id, i) => ({ from: id, to: chain[i + 1]! })) };
  m.lines["l2"] = { id: "l2", name: { en: "B" }, color: "#0067C0", style: "solid", segments: [{ from: chain[0]!, to: chain[1]! }] };
  return m;
}

describe("perf baseline", () => {
  it("stays interactive at 400 stations", () => {
    const m = gridMap(400);
    const t0 = performance.now();
    const offs = computeParallelOffsets(m);
    const t1 = performance.now();
    expect(offs.bySegment.size).toBeGreaterThan(0);
    console.log(`[perf] 400 stations computeParallelOffsets: ${(t1 - t0).toFixed(1)}ms`);
    expect(t1 - t0).toBeLessThan(500);
  });

  it("arranges 400 labels in linear-ish time", () => {
    const m = gridMap(400);
    const t0 = performance.now();
    avoidLabelOverlaps(m);
    const t1 = performance.now();
    console.log(`[perf] 400 stations avoidLabelOverlaps: ${(t1 - t0).toFixed(1)}ms`);
    expect(t1 - t0).toBeLessThan(2000);
  });
});
