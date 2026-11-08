/**
 * Nodal / Linewright — core data model.
 * Spec: PROJECT.md §4 (draft). This is the single source of truth.
 * `core` has zero UI dependencies so it runs in Node for CLI / batch export.
 */

export type ID = string;

export interface Vec2 {
  x: number;
  y: number;
}

export type Anchor = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export type StationKind = "normal" | "interchange" | "terminus";

export type LineStyle = "solid" | "dashed" | "double";

export interface Station {
  id: ID;
  /** Multi-locale names, e.g. { en: "Central", "zh-TW": "中央" } */
  name: Record<string, string>;
  position: Vec2;
  kind: StationKind;
  labelAnchor: Anchor;
  /** Optional manual label offset in map units. */
  labelOffset?: Vec2;
  /** Rotation in degrees for the station mark + label. */
  rotation?: number;
}

export interface Segment {
  from: ID;
  to: ID;
  waypoints?: Vec2[];
}

export interface Line {
  id: ID;
  name: Record<string, string>;
  color: string; // hex, e.g. "#E00034"
  segments: Segment[];
  style: LineStyle;
  /** Width in map units (map units = pixels at zoom 1). Default 8. */
  width?: number;
}

export interface Label {
  id: ID;
  /** Station or line the label belongs to. */
  targetId: ID;
  targetKind: "station" | "line";
  text: Record<string, string>;
  position: Vec2;
  anchor: Anchor;
}

export interface MapStyle {
  background: string;
  gridStep: number;
  cornerRadius: number;
  /** Deprecated: 45° snap was removed. Accepted on load, ignored at runtime. */
  snap45?: boolean;
  labelLanguage: string;
  fontSize: number;
  stationRadius: number;
  fontFamily?: string;
  /** Label text colour (hex). Defaults to black. */
  labelColor?: string;
  /** Label weight (400/500/600/700). */
  fontWeight?: number;
  /** Label style: normal | italic. */
  fontStyle?: string;
  /** Label case: none | uppercase | lowercase. */
  textTransform?: string;
  /** Label letter spacing (px). */
  letterSpacing?: number;
}

export interface TransferLink {
  id: ID;
  from: ID;
  to: ID;
  /** e.g. "透過林口長庚醫院" — drawn at the midpoint. */
  label?: Record<string, string>;
}

export interface MetroMap {
  schemaVersion: number;
  meta: { title: string; author?: string; createdAt: string };
  stations: Record<ID, Station>;
  lines: Record<ID, Line>;
  labels: Record<ID, Label>;
  transfers?: Record<ID, TransferLink>;
  style: MapStyle;
}

export const CURRENT_SCHEMA_VERSION = 1;

export function emptyMap(title = "Untitled map"): MetroMap {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: { title, createdAt: new Date().toISOString() },
    stations: {},
    lines: {},
    labels: {},
    style: {
      background: "#FFFFFF",
      gridStep: 40,
      cornerRadius: 28,
      labelLanguage: "en",
      fontSize: 14,
      stationRadius: 6,
      fontFamily: "Noto Sans, sans-serif",
      labelColor: "#000000",
      fontWeight: 500,
      fontStyle: "normal",
      textTransform: "none",
      letterSpacing: 0,
    },
  };
}

export function displayName(
  name: Record<string, string>,
  fallback = "Untitled",
  lang?: string,
): string {
  const pick = (lang ? name[lang] : undefined) ?? name.en ?? name["zh-TW"] ?? Object.values(name)[0];
  return pick && pick.trim() ? pick : fallback;
}
