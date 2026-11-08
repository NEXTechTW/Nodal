import { describe, expect, it } from "vitest";
import { aarcToMetroMap, isAarc } from "./aarc.js";
import { validateMap } from "./validate.js";

describe("AARC import", () => {
  it("converts lines/points to MetroMap", () => {
    const aarc: import("./aarc.js").AarcFile = {
      lines: [{ id: 9, pts: [7, 11], name: "L1", nameSub: "Line One", color: "#123456" }],
      points: [
        { id: 7, pos: [100, 200], name: "桃園", nameS: "Taoyuan", dir: 1 },
        { id: 11, pos: [300, 200], name: "中央", nameS: "Central" },
      ],
    };
    expect(isAarc(aarc)).toBe(true);
    const m = aarcToMetroMap(aarc);
    expect(Object.keys(m.stations)).toHaveLength(2);
    expect(m.lines["aarc-9"]!.segments).toHaveLength(1);
    expect(m.lines["aarc-9"]!.color).toBe("#123456");
    expect(validateMap(m)).toEqual([]);
  });
  it("ignores dangling station refs", () => {
    const m = aarcToMetroMap({ lines: [{ id: 1, pts: [1, 99], name: "X", color: "#000000" }], points: [{ id: 1, pos: [0, 0] }] });
    expect(m.lines["aarc-1"]!.segments).toHaveLength(0);
  });
  it("keeps unnamed waypoint in the correct segment without bleeding into next segment", () => {
    const aarc: import("./aarc.js").AarcFile = {
      lines: [{ id: 1, pts: [7, 65, 68, 178], name: "Silver", color: "#C0C0C0" }],
      points: [
        { id: 7, pos: [100, 100], name: "S1" },
        { id: 65, pos: [150, 100] }, // unnamed junction waypoint
        { id: 68, pos: [200, 100], name: "S2" },
        { id: 178, pos: [300, 200], name: "S3" },
      ],
    };
    const m = aarcToMetroMap(aarc);
    const segs = m.lines["aarc-1"]!.segments;
    expect(segs).toHaveLength(2);
    // Waypoint 65 must be on seg 7->68, NOT on seg 68->178
    expect(segs[0]).toEqual({ from: "7", to: "68", waypoints: [{ x: 150, y: 100 }] });
    expect(segs[1]).toEqual({ from: "68", to: "178" });
  });
});
