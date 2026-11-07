import { describe, expect, it } from "vitest";
import { emptyMap, parseMapFile, validateMap } from "./index.js";

describe("validateMap", () => {
  it("accepts empty map", () => {
    expect(validateMap(emptyMap())).toEqual([]);
  });
  it("rejects bad line color", () => {
    const m = emptyMap("T");
    m.lines["l1"] = { id: "l1", name: { en: "L1" }, color: "red", segments: [], style: "solid" };
    expect(validateMap(m).length).toBeGreaterThan(0);
  });
  it("rejects segment to missing station", () => {
    const m = emptyMap("T");
    m.lines["l1"] = {
      id: "l1", name: { en: "L1" }, color: "#E00034",
      segments: [{ from: "a", to: "b" }], style: "solid",
    };
    expect(validateMap(m).some((i) => i.message.includes("unknown station"))).toBe(true);
  });
});

describe("parseMapFile", () => {
  it("round-trips JSON", () => {
    const m = emptyMap("Hello");
    const text = JSON.stringify(m);
    expect(parseMapFile(text).meta.title).toBe("Hello");
  });
  it("errors name the fix for bad JSON", () => {
    expect(() => parseMapFile("{oops")).toThrow(/not valid JSON/);
  });
});
