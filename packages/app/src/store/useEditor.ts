/**
 * Zustand store — UI state (viewport, selection, tool) + domain state (MetroMap).
 * Undo/redo via CommandStack from @linewright/core (PROJECT.md §3).
 * `tool` is one of select | add-station | connect | pan.
 */
import { create } from "zustand";
import {
  CommandStack,
  addLineCommand,
  addSegmentCommand,
  addStationCommand,
  avoidLabelOverlaps as avoidLabels,
  createId,
  deleteLineCommand,
  displayName,
  emptyMap,
  moveStationCommand,
  renameLineCommand,
  renameStationCommand,
  setLineColorCommand,
  setLineStyleCommand,
  setTitleCommand,
  type Anchor,
  type LineStyle,
  type MetroMap,
  type StationKind,
  type Vec2,
} from "@linewright/core";

export type Tool = "select" | "add-station" | "connect" | "pan";

export interface Viewport {
  x: number;
  y: number;
  k: number; // scale
}

export type Theme = "light" | "dark";

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem("nodal:theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* ignore — storage may be unavailable */
  }
  try {
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    /* ignore */
  }
  // Adobe-style workbench defaults to dark charcoal.
  return "dark";
}

interface EditorState {
  map: MetroMap;
  stack: CommandStack;
  tool: Tool;
  selectedStationId: string | null;
  selectedLineId: string | null;
  viewport: Viewport;
  activeLineId: string | null;
  cornerRadius: number;
  theme: Theme;
  toast: string | null;
  error: string | null;
  lastActionLabel: string | null;
  startupOpen: boolean;

  // actions
  setStartupOpen(open: boolean): void;
  setTool(t: Tool): void;
  setViewport(v: Partial<Viewport>): void;
  setTheme(t: Theme): void;
  toggleTheme(): void;
  setCornerRadius(n: number): void;
  selectStation(id: string | null): void;
  selectLine(id: string | null): void;
  addStation(pos: Vec2): string;
  moveStation(id: string, pos: Vec2): void;
  deleteSelectedStation(): void;
  renameStation(id: string, name: string, lang?: string): void;
  setStationKind(id: string, kind: StationKind): void;
  setStationAnchor(id: string, anchor: Anchor): void;
  addLine(name: string): string;
  setActiveLine(id: string | null): void;
  setLineColor(lineId: string, color: string): void;
  renameLine(id: string, name: string, lang?: string): void;
  setLineStyle(id: string, style: LineStyle): void;
  setLineWidth(id: string, width: number): void;
  deleteLine(id: string): void;
  setMapBackground(color: string): void;
  setStationPosition(id: string, pos: Vec2): void;
  setStationRotation(id: string, deg: number): void;
  setStationLabelOffset(id: string, offset: Vec2): void;
  setFontSize(n: number): void;
  setStationRadius(n: number): void;
  setGridStep(n: number): void;
  connectStations(lineId: string, from: string, to: string): void;
  renameMap(title: string): void;
  undo(): void;
  redo(): void;
  loadMap(map: MetroMap): void;
  setError(msg: string | null): void;
  clearToast(): void;
  setToast(msg: string): void;
  setLabelLanguage(lang: string): void;
  avoidLabelOverlaps(): void;
}

const initialMap = emptyMap("Untitled map");

export const useEditor = create<EditorState>((set, get) => {
  const stack = new CommandStack(initialMap);
  return {
    map: initialMap,
    stack,
    tool: "select",
    selectedStationId: null,
    selectedLineId: null,
    viewport: { x: 0, y: 0, k: 1 },
    activeLineId: null,
    cornerRadius: 18,
    theme: initialTheme(),
    toast: null,
    error: null,
    lastActionLabel: null,
    startupOpen: (() => {
      try {
        return localStorage.getItem("nodal:hide_startup") !== "true";
      } catch {
        return true;
      }
    })(),

    setStartupOpen: (open) => set({ startupOpen: open }),
    setTool: (t) => set({ tool: t }),
    setViewport: (v) => set((s) => ({ viewport: { ...s.viewport, ...v } })),
    setTheme: (t) => {
      try { localStorage.setItem("nodal:theme", t); } catch { /* ignore */ }
      set({ theme: t });
    },
    toggleTheme: () => {
      const next: Theme = get().theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("nodal:theme", next); } catch { /* ignore */ }
      set({ theme: next });
    },
    setCornerRadius: (n) => set({ cornerRadius: n }),
    selectStation: (id) => set({ selectedStationId: id, selectedLineId: null }),
    selectLine: (id) => set({ selectedLineId: id, selectedStationId: null }),
    setActiveLine: (id) => set({ activeLineId: id }),
    setError: (msg) => set({ error: msg }),
    setToast: (msg) => set({ toast: msg, lastActionLabel: msg }),
    clearToast: () => set({ toast: null }),

    addStation: (pos) => {
      const id = createId();
      const station = {
        id,
        name: { en: "New station" },
        position: { ...pos },
        kind: "normal" as StationKind,
        labelAnchor: "N" as Anchor,
      };
      const cmd = addStationCommand(id, station);
      const map = get().stack.dispatch(cmd);
      set({ map, selectedStationId: id, lastActionLabel: cmd.label });
      return id;
    },
    moveStation: (id, pos) => {
      const s = get().map.stations[id];
      if (!s) return;
      const cmd = moveStationCommand(id, s.position, pos);
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label });
    },
    deleteSelectedStation: () => {
      const { map, selectedStationId } = get();
      if (!selectedStationId) return;
      const station = map.stations[selectedStationId];
      if (!station) return;
      // Capture touched segments so undo restores the station AND its connections.
      const removedByLine: { lineId: string; segments: MetroMap["lines"][string]["segments"] }[] = [];
      for (const [lineId, line] of Object.entries(map.lines)) {
        const mine = line.segments.filter((s) => s.from === selectedStationId || s.to === selectedStationId);
        if (mine.length > 0) removedByLine.push({ lineId, segments: structuredClone(mine) });
      }
      const id = selectedStationId;
      const stationSnapshot = structuredClone(station);
      const cmd: import("@linewright/core").Command = {
        name: "DeleteStation",
        label: "Delete station",
        apply: (m: MetroMap) => {
          const stations = { ...m.stations };
          delete stations[id];
          const lines = Object.fromEntries(
            Object.entries(m.lines).map(([lid, l]) => [
              lid,
              { ...l, segments: l.segments.filter((s) => s.from !== id && s.to !== id) },
            ]),
          ) as MetroMap["lines"];
          return { ...m, stations, lines };
        },
        revert: (m: MetroMap) => {
          const stations = { ...m.stations, [id]: structuredClone(stationSnapshot) };
          const lines: MetroMap["lines"] = { ...m.lines };
          for (const { lineId, segments } of removedByLine) {
            const line = lines[lineId];
            if (line) lines[lineId] = { ...line, segments: [...line.segments, ...structuredClone(segments)] };
          }
          return { ...m, stations, lines };
        },
      };
      const next = get().stack.dispatch(cmd);
      set({ map: next, selectedStationId: null, lastActionLabel: cmd.label, toast: "Station deleted" });
    },
    renameStation: (id, name, lang = "en") => {
      const s = get().map.stations[id];
      if (!s) return;
      const from = { ...s.name };
      const to = { ...s.name, [lang]: name };
      const cmd = renameStationCommand(id, from, to);
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label });
    },
    setStationKind: (id, kind) => {
      const s = get().map.stations[id];
      if (!s) return;
      const from = s.kind;
      const cmd = {
        name: "SetStationKind" as const,
        label: "Change station type",
        apply: (m: MetroMap) => ({ ...m, stations: { ...m.stations, [id]: { ...m.stations[id]!, kind } } }),
        revert: (m: MetroMap) => ({ ...m, stations: { ...m.stations, [id]: { ...m.stations[id]!, kind: from } } }),
      };
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label });
    },
    setStationAnchor: (id, anchor) => {
      const s = get().map.stations[id];
      if (!s) return;
      // Anchor change is local (not undoable in v0.1) — direct update.
      set((st) => ({
        map: { ...st.map, stations: { ...st.map.stations, [id]: { ...st.map.stations[id]!, labelAnchor: anchor } } },
        lastActionLabel: "Change label position",
      }));
    },
    addLine: (name) => {
      const id = createId();
      const PALETTE = ["#E00034", "#0067C0", "#009444", "#FF8A00", "#6A1B9A", "#00A9A5", "#E55934", "#0B5FFF"];
      const color = PALETTE[Object.keys(get().map.lines).length % PALETTE.length]!;
      const line = { id, name: { en: name || "New line" }, color, segments: [], style: "solid" as const, width: 8 };
      const cmd = addLineCommand(id, line);
      const map = get().stack.dispatch(cmd);
      set({ map, activeLineId: id, selectedLineId: id, selectedStationId: null, lastActionLabel: cmd.label });
      return id;
    },
    setLineColor: (lineId, color) => {
      const l = get().map.lines[lineId];
      if (!l) return;
      const cmd = setLineColorCommand(lineId, l.color, color);
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label });
    },
    renameLine: (id, name, lang = "en") => {
      const l = get().map.lines[id];
      if (!l) return;
      const cmd = renameLineCommand(id, { ...l.name }, { ...l.name, [lang]: name });
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label });
    },
    setLineStyle: (id, style) => {
      const l = get().map.lines[id];
      if (!l) return;
      const cmd = setLineStyleCommand(id, l.style, style);
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label });
    },
    setLineWidth: (id, width) => {
      const l = get().map.lines[id];
      if (!l) return;
      const prev = structuredClone(l);
      const cmd: import("@linewright/core").Command = {
        name: "SetLineColor",
        label: "Change line width",
        apply: (m) => ({ ...m, lines: { ...m.lines, [id]: { ...m.lines[id]!, width } } }),
        revert: (m) => ({ ...m, lines: { ...m.lines, [id]: structuredClone(prev) } }),
      };
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label });
    },
    deleteLine: (id) => {
      const l = get().map.lines[id];
      if (!l) return;
      const cmd = deleteLineCommand(id, l);
      const map = get().stack.dispatch(cmd);
      const nextActive = get().activeLineId === id ? null : get().activeLineId;
      const nextSel = get().selectedLineId === id ? null : get().selectedLineId;
      set({ map, activeLineId: nextActive, selectedLineId: nextSel, lastActionLabel: cmd.label, toast: "Line deleted" });
    },
    setMapBackground: (color) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, background: color } },
        lastActionLabel: "Change background",
      }));
    },
    setStationPosition: (id, pos) => {
      const s = get().map.stations[id];
      if (!s) return;
      const cmd = moveStationCommand(id, s.position, pos);
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label });
    },
    setStationRotation: (id, deg) => {
      set((st) => ({
        map: {
          ...st.map,
          stations: { ...st.map.stations, [id]: { ...st.map.stations[id]!, rotation: ((deg % 360) + 360) % 360 } },
        },
        lastActionLabel: "Rotate station",
      }));
    },
    setStationLabelOffset: (id, offset) => {
      set((st) => ({
        map: {
          ...st.map,
          stations: { ...st.map.stations, [id]: { ...st.map.stations[id]!, labelOffset: { ...offset } } },
        },
        lastActionLabel: "Nudge label",
      }));
    },
    setFontSize: (n) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, fontSize: Math.min(32, Math.max(8, n)) } },
        lastActionLabel: "Change label size",
      }));
    },
    setStationRadius: (n) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, stationRadius: Math.min(16, Math.max(3, n)) } },
        lastActionLabel: "Change station size",
      }));
    },
    setGridStep: (n) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, gridStep: Math.min(120, Math.max(10, n)) } },
        lastActionLabel: "Change grid",
      }));
    },
    connectStations: (lineId, from, to) => {
      if (from === to) return;
      const cmd = addSegmentCommand(lineId, from, to);
      const before = JSON.stringify(get().map.lines[lineId]);
      const map = get().stack.dispatch(cmd);
      // addSegmentCommand no-ops on duplicate; detect and toast.
      if (JSON.stringify(map.lines[lineId]) === before) {
        set({ toast: "These stations are already connected on this line" });
        return;
      }
      set({ map, lastActionLabel: cmd.label });
    },
    renameMap: (title) => {
      const cmd = setTitleCommand(get().map.meta.title, title);
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label });
    },
    undo: () => {
      if (!get().stack.canUndo) return;
      const map = get().stack.undo();
      set({ map, lastActionLabel: "Undo" });
    },
    redo: () => {
      if (!get().stack.canRedo) return;
      const map = get().stack.redo();
      set({ map, lastActionLabel: "Redo" });
    },
    loadMap: (map) => {
      get().stack.reset(map);
      set({
        map,
        selectedStationId: null,
        selectedLineId: null,
        activeLineId: null,
        viewport: { x: 0, y: 0, k: 1 },
        error: null,
        toast: "Map loaded",
      });
    },
    setLabelLanguage: (lang) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, labelLanguage: lang } },
      }));
    },
    avoidLabelOverlaps: () => {
      const before = get().map;
      const after = avoidLabels(before);
      const cmd: import("@linewright/core").Command = {
        name: "SetTitle",
        label: "Arrange labels",
        apply: () => after,
        revert: () => before,
      };
      const map = get().stack.dispatch(cmd);
      set({ map, lastActionLabel: cmd.label, toast: "Labels arranged" });
    },
  };
});

export function stationDisplayName(map: MetroMap, id: string): string {
  const s = map.stations[id];
  return s ? displayName(s.name, "Untitled station") : id;
}
