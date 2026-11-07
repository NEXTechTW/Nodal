import { emptyMap, type MetroMap } from "@linewright/core";

/** Fictional city example (PROJECT.md §9: trademark-safe). */
export function exampleMap(): MetroMap {
  const m = emptyMap("Lumen City (example)");
  m.meta.author = "Nodal examples";
  m.style.background = "#FFFFFF";

  const S = m.stations;
  const add = (id: string, en: string, zh: string, x: number, y: number, kind: "normal" | "interchange" | "terminus" = "normal", anchor: "N" | "E" | "S" | "W" | "NE" | "NW" | "SE" | "SW" = "N") => {
    S[id] = { id, name: { en, "zh-TW": zh }, position: { x, y }, kind, labelAnchor: anchor };
  };
  add("s1", "Harbor Terminus", "港灣總站", 120, 300, "terminus", "E");
  add("s2", "Market", "市場", 280, 300, "normal", "N");
  add("s3", "Central", "中央", 440, 300, "interchange", "N");
  add("s4", "Garden", "花園", 440, 140, "normal", "W");
  add("s5", "University", "大學", 440, 460, "normal", "W");
  add("s6", "North Gate", "北門", 600, 140, "terminus", "N");
  add("s7", "East Loop", "東環", 600, 300, "normal", "S");
  add("s8", "Museum", "博物館", 600, 460, "normal", "E");

  m.lines = {
    l1: {
      id: "l1",
      name: { en: "Harbor Line" },
      color: "#E00034",
      style: "solid",
      width: 8,
      segments: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3" },
        { from: "s3", to: "s7" },
      ],
    },
    l2: {
      id: "l2",
      name: { en: "Garden Line" },
      color: "#0067C0",
      style: "solid",
      width: 8,
      segments: [
        { from: "s4", to: "s3" },
        { from: "s3", to: "s5" },
        { from: "s5", to: "s8" },
      ],
    },
    l3: {
      id: "l3",
      name: { en: "North Loop" },
      color: "#009444",
      style: "dashed",
      width: 7,
      segments: [
        { from: "s4", to: "s6" },
        { from: "s6", to: "s7" },
        { from: "s7", to: "s8" },
      ],
    },
  };
  return m;
}

/** 2-line crossroad starter template with central interchange. */
export function crossroadTemplate(): MetroMap {
  const m = emptyMap("Metropolis Hub (template)");
  m.meta.author = "Nodal starters";
  m.style.background = "#FFFFFF";

  const S = m.stations;
  const add = (id: string, en: string, zh: string, x: number, y: number, kind: "normal" | "interchange" | "terminus" = "normal", anchor: "N" | "E" | "S" | "W" | "NE" | "NW" | "SE" | "SW" = "N") => {
    S[id] = { id, name: { en, "zh-TW": zh }, position: { x, y }, kind, labelAnchor: anchor };
  };
  add("c1", "West Pier", "西碼頭", 160, 320, "terminus", "N");
  add("c2", "Civic Center", "市政中心", 320, 320, "normal", "N");
  add("c3", "Grand Interchange", "中央交會", 480, 320, "interchange", "NE");
  add("c4", "East Boulevard", "東林蔭道", 640, 320, "terminus", "N");

  add("c5", "North Terminal", "北端點", 480, 160, "terminus", "E");
  add("c6", "South Harbor", "南港口", 480, 480, "terminus", "E");

  m.lines = {
    red: {
      id: "red",
      name: { en: "Line 1 (East-West)" },
      color: "#E00034",
      style: "solid",
      width: 8,
      segments: [
        { from: "c1", to: "c2" },
        { from: "c2", to: "c3" },
        { from: "c3", to: "c4" },
      ],
    },
    blue: {
      id: "blue",
      name: { en: "Line 2 (North-South)" },
      color: "#0067C0",
      style: "solid",
      width: 8,
      segments: [
        { from: "c5", to: "c3" },
        { from: "c3", to: "c6" },
      ],
    },
  };
  return m;
}
