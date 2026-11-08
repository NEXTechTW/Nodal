/**
 * Zustand store — UI state (viewport, selection, tool) + domain state (MetroMap).
 * Undo/redo via CommandStack from @linewright/core (PROJECT.md §3).
 * Modeled after Nodal Creative Cloud workbench state management.
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

export type Tool = "select" | "add-station" | "connect" | "pan" | "measure" | "label";

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
  // Nodal-style workbench defaults to dark charcoal.
  return "dark";
}

function getStoredBool(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "true") return true;
    if (v === "false") return false;
  } catch {
    /* ignore */
  }
  return def;
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
  uiLang: import("../i18n.js").UiLang;
  toast: string | null;
  error: string | null;
  lastActionLabel: string | null;
  startupOpen: boolean;

  // Nodal & RMP transit cartography features
  showGrid: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  showMiniMap: boolean;
  shortcutsOpen: boolean;
  addonManagerOpen: boolean;
  cursorPos: Vec2 | null;
  hiddenLineIds: Record<string, boolean>;
  bilingualLabels: boolean;
  showTransferBadges: boolean;
  showDPad: boolean;
  copiedStationAttrs: {
    kind: StationKind;
    labelAnchor: Anchor;
    rotation?: number;
    labelOffset?: Vec2;
  } | null;
  measureFrom: Vec2 | null;
  measureTo: Vec2 | null;
  setMeasurePoints(a: Vec2 | null, b: Vec2 | null): void;
  addStandaloneLabel(pos: Vec2, text: string): void;

  // actions
  setStartupOpen(open: boolean): void;
  setTool(t: Tool): void;
  setViewport(v: Partial<Viewport>): void;
  setTheme(t: Theme): void;
  toggleTheme(): void;
  setUiLang(l: import("../i18n.js").UiLang): void;
  setCornerRadius(n: number): void;
  selectStation(id: string | null): void;
  selectLine(id: string | null): void;
  addStation(pos: Vec2): string;
  duplicateStation(id: string): string | null;
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
  toggleLineVisibility(id: string): void;
  setMapBackground(color: string): void;
  setStationPosition(id: string, pos: Vec2): void;
  setStationRotation(id: string, deg: number): void;
  setStationLabelOffset(id: string, offset: Vec2): void;
  setFontSize(n: number): void;
  setFontFamily(f: string): void;
  setLabelColor(c: string): void;
  setFontWeight(w: number): void;
  setFontStyle(s: string): void;
  setTextTransform(t: string): void;
  setLetterSpacing(n: number): void;
  setStationRadius(n: number): void;
  setGridStep(n: number): void;
  connectStations(lineId: string, from: string, to: string): void;
  renameMap(title: string): void;
  undo(): void;
  redo(): void;
  loadMap(map: MetroMap): void;
  newMap(): void;
  setError(msg: string | null): void;
  clearToast(): void;
  setToast(msg: string): void;
  setLabelLanguage(lang: string): void;
  avoidLabelOverlaps(): void;

  // Toggles & RMP features
  toggleGrid(): void;
  toggleSnap(): void;
  toggleRulers(): void;
  toggleMiniMap(): void;
  toggleBilingual(): void;
  toggleTransferBadges(): void;
  toggleDPad(): void;
  setShortcutsOpen(open: boolean): void;
  setAddonManagerOpen(open: boolean): void;
  setCursorPos(pos: Vec2 | null): void;
  zoomIn(): void;
  zoomOut(): void;
  zoomFit(): void;
  panBy(dx: number, dy: number): void;
  copyStationAttrs(id: string): void;
  pasteStationAttrs(id: string): void;
  autoEnglishName(id: string): void;
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
    uiLang: (() => {
      try {
        const v = localStorage.getItem("nodal:uillang");
        if (v) return v as import("../i18n.js").UiLang;
      } catch { /* ignore */ }
      const nav = typeof navigator !== "undefined" ? navigator.language : "en";
      if (nav.startsWith("zh-TW") || nav.startsWith("zh-HK")) return "zh-Hant";
      if (nav.startsWith("zh")) return "zh-Hans";
      if (nav.startsWith("ar")) return "ar";
      if (nav.startsWith("ja")) return "ja";
      if (nav.startsWith("ko")) return "ko";
      if (nav.startsWith("ru")) return "ru";
      return "en";
    })(),
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

    showGrid: getStoredBool("nodal:show_grid", true),
    snapToGrid: getStoredBool("nodal:snap_to_grid", true),
    showRulers: getStoredBool("nodal:show_rulers", false),
    showMiniMap: getStoredBool("nodal:show_minimap", false),
    shortcutsOpen: false,
    addonManagerOpen: false,
    cursorPos: null,
    hiddenLineIds: {},
    bilingualLabels: getStoredBool("nodal:bilingual", true),
    showTransferBadges: getStoredBool("nodal:transfer_badges", false),
    showDPad: getStoredBool("nodal:show_dpad", false),
    copiedStationAttrs: null,
    measureFrom: null,
    measureTo: null,
    setMeasurePoints: (a, b) => set({ measureFrom: a, measureTo: b }),
    addStandaloneLabel: (pos, text) => {
      const id = createId();
      const label = {
        id,
        targetId: id,
        targetKind: "line" as const,
        text: { en: text },
        position: { ...pos },
        anchor: "N" as Anchor,
      };
      set((s) => ({
        map: { ...s.map, labels: { ...s.map.labels, [id]: label } },
        lastActionLabel: "Add label",
      }));
    },

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
    setUiLang: (l) => {
      try { localStorage.setItem("nodal:uillang", l); } catch { /* ignore */ }
      set({ uiLang: l });
    },
    setCornerRadius: (n) => set({ cornerRadius: n }),
    selectStation: (id) => set({ selectedStationId: id, selectedLineId: null }),
    selectLine: (id) => set({ selectedLineId: id, selectedStationId: null }),
    setActiveLine: (id) => set({ activeLineId: id }),
    setError: (msg) => set({ error: msg }),
    setToast: (msg) => set({ toast: msg, lastActionLabel: msg }),
    clearToast: () => set({ toast: null }),

    toggleGrid: () => {
      const next = !get().showGrid;
      try { localStorage.setItem("nodal:show_grid", String(next)); } catch { /* ignore */ }
      set({ showGrid: next });
    },
    toggleSnap: () => {
      const next = !get().snapToGrid;
      try { localStorage.setItem("nodal:snap_to_grid", String(next)); } catch { /* ignore */ }
      set({ snapToGrid: next, toast: next ? "Snap to grid: Enabled" : "Snap to grid: Disabled" });
    },
    toggleRulers: () => {
      const next = !get().showRulers;
      try { localStorage.setItem("nodal:show_rulers", String(next)); } catch { /* ignore */ }
      set({ showRulers: next });
    },
    toggleMiniMap: () => {
      const next = !get().showMiniMap;
      try { localStorage.setItem("nodal:show_minimap", String(next)); } catch { /* ignore */ }
      set({ showMiniMap: next });
    },
    setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
    setAddonManagerOpen: (open) => set({ addonManagerOpen: open }),
    setCursorPos: (pos) => set({ cursorPos: pos }),
    toggleLineVisibility: (id) => {
      set((s) => ({
        hiddenLineIds: {
          ...s.hiddenLineIds,
          [id]: !s.hiddenLineIds[id],
        },
      }));
    },
    toggleBilingual: () => {
      const next = !get().bilingualLabels;
      try { localStorage.setItem("nodal:bilingual", String(next)); } catch { /* ignore */ }
      set({ bilingualLabels: next, toast: next ? "Bilingual labels: ON" : "Bilingual labels: OFF" });
    },
    toggleTransferBadges: () => {
      const next = !get().showTransferBadges;
      try { localStorage.setItem("nodal:transfer_badges", String(next)); } catch { /* ignore */ }
      set({ showTransferBadges: next, toast: next ? "Transfer line badges: ON" : "Transfer line badges: OFF" });
    },
    toggleDPad: () => {
      const next = !get().showDPad;
      try { localStorage.setItem("nodal:show_dpad", String(next)); } catch { /* ignore */ }
      set({ showDPad: next });
    },
    panBy: (dx, dy) => {
      const vp = get().viewport;
      set({ viewport: { ...vp, x: vp.x + dx, y: vp.y + dy } });
    },
    copyStationAttrs: (id) => {
      const s = get().map.stations[id];
      if (!s) return;
      const attrs = {
        kind: s.kind,
        labelAnchor: s.labelAnchor,
        ...(s.rotation !== undefined ? { rotation: s.rotation } : {}),
        ...(s.labelOffset ? { labelOffset: structuredClone(s.labelOffset) } : {}),
      };
      set({ copiedStationAttrs: attrs, toast: "Station style copied" });
    },
    pasteStationAttrs: (id) => {
      const { copiedStationAttrs, map } = get();
      if (!copiedStationAttrs) {
        set({ toast: "No copied station style to paste" });
        return;
      }
      const s = map.stations[id];
      if (!s) return;
      set((st) => ({
        map: {
          ...st.map,
          stations: {
            ...st.map.stations,
            [id]: {
              ...st.map.stations[id]!,
              kind: copiedStationAttrs.kind,
              labelAnchor: copiedStationAttrs.labelAnchor,
              ...(copiedStationAttrs.rotation !== undefined ? { rotation: copiedStationAttrs.rotation } : {}),
              ...(copiedStationAttrs.labelOffset ? { labelOffset: structuredClone(copiedStationAttrs.labelOffset) } : {}),
            },
          },
        },
        toast: "Station style applied",
      }));
    },
    autoEnglishName: (id) => {
      const s = get().map.stations[id];
      if (!s) return;
      const zh = s.name["zh-TW"] || s.name["zh"] || "";
      if (!zh) return;
      const translated = translateTransitName(zh);
      get().renameStation(id, translated, "en");
      set({ toast: `Generated English: "${translated}"` });
    },

    zoomIn: () => {
      const vp = get().viewport;
      set({ viewport: { ...vp, k: Math.min(5, Math.round(vp.k * 1.25 * 100) / 100) } });
    },
    zoomOut: () => {
      const vp = get().viewport;
      set({ viewport: { ...vp, k: Math.max(0.15, Math.round(vp.k * 0.8 * 100) / 100) } });
    },
    zoomFit: () => {
      const { map } = get();
      const stations = Object.values(map.stations);
      if (stations.length === 0) {
        set({ viewport: { x: 0, y: 0, k: 1 } });
        return;
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const s of stations) {
        if (s.position.x < minX) minX = s.position.x;
        if (s.position.y < minY) minY = s.position.y;
        if (s.position.x > maxX) maxX = s.position.x;
        if (s.position.y > maxY) maxY = s.position.y;
      }
      const pad = 120;
      const w = Math.max(300, maxX - minX + pad * 2);
      const h = Math.max(300, maxY - minY + pad * 2);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const vw = window.innerWidth - 560; // account for dock & panels
      const vh = window.innerHeight - 100;
      const k = Math.min(2, Math.max(0.25, Math.min(vw / w, vh / h)));
      set({
        viewport: {
          k,
          x: (vw / 2) - cx * k + 40,
          y: (vh / 2) - cy * k,
        },
      });
    },

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

    duplicateStation: (id) => {
      const s = get().map.stations[id];
      if (!s) return null;
      const newId = createId();
      const clone: import("@linewright/core").Station = {
        id: newId,
        name: structuredClone(s.name),
        position: { x: s.position.x + 40, y: s.position.y + 40 },
        kind: s.kind,
        labelAnchor: s.labelAnchor,
        ...(s.labelOffset ? { labelOffset: structuredClone(s.labelOffset) } : {}),
        ...(s.rotation !== undefined ? { rotation: s.rotation } : {}),
      };
      const cmd = addStationCommand(newId, clone);
      const map = get().stack.dispatch(cmd);
      set({ map, selectedStationId: newId, lastActionLabel: "Duplicate station", toast: "Station duplicated" });
      return newId;
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
      set((st) => ({
        map: { ...st.map, stations: { ...st.map.stations, [id]: { ...st.map.stations[id]!, labelAnchor: anchor } } },
        lastActionLabel: "Change label position",
      }));
    },
    addLine: (name) => {
      const id = createId();
      const PALETTE = ["#0067C0", "#E00034", "#009444", "#FF8A00", "#6A1B9A", "#00A9A5", "#E55934", "#FFC800"];
      const color = PALETTE[Object.keys(get().map.lines).length % PALETTE.length]!;
      const line = { id, name: { en: name || "New line" }, color, segments: [], style: "solid" as const, width: 10 };
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
    setFontFamily: (f) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, fontFamily: f } },
        lastActionLabel: "Change font",
      }));
    },
    setLabelColor: (c) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, labelColor: c } },
        lastActionLabel: "Change text color",
      }));
    },
    setFontWeight: (w) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, fontWeight: w } },
        lastActionLabel: "Change text weight",
      }));
    },
    setFontStyle: (v) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, fontStyle: v } },
        lastActionLabel: "Change text style",
      }));
    },
    setTextTransform: (t) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, textTransform: t } },
        lastActionLabel: "Change text case",
      }));
    },
    setLetterSpacing: (n) => {
      set((s) => ({
        map: { ...s.map, style: { ...s.map.style, letterSpacing: Math.min(8, Math.max(-2, n)) } },
        lastActionLabel: "Change letter spacing",
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
    newMap: () => {
      const brandNew = emptyMap("Untitled map");
      get().stack.reset(brandNew);
      set({
        map: brandNew,
        selectedStationId: null,
        selectedLineId: null,
        activeLineId: null,
        viewport: { x: 0, y: 0, k: 1 },
        error: null,
        toast: "New map created",
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

function translateTransitName(zh: string): string {
  const dictionary: [string, string][] = [
    ["台北車站", "Taipei Main Station"],
    ["人民廣場", "People's Square"],
    ["中山公園", "Zhongshan Park"],
    ["中央公園", "Central Park"],
    ["國際機場", "International Airport"],
    ["機場", "Airport"],
    ["火車站", "Railway Station"],
    ["高鐵站", "High-Speed Rail Station"],
    ["高鐵", "HSR"],
    ["市政府", "City Hall"],
    ["市中心", "City Center"],
    ["體育館", "Stadium"],
    ["體育中心", "Sports Center"],
    ["博物館", "Museum"],
    ["美術館", "Fine Arts Museum"],
    ["動物園", "Zoo"],
    ["醫院", "Hospital"],
    ["大學", "University"],
    ["科技園區", "Science Park"],
    ["軟體園區", "Software Park"],
    ["工業區", "Industrial Park"],
    ["轉運站", "Transfer Station"],
    ["車站", "Station"],
    ["廣場", "Square"],
    ["公園", "Park"],
    ["碼頭", "Pier"],
    ["港", "Port"],
    ["大橋", "Bridge"],
    ["橋", "Bridge"],
    ["東路", "East Road"],
    ["西路", "West Road"],
    ["南路", "South Road"],
    ["北路", "North Road"],
    ["中路", "Middle Road"],
    ["東街", "East Street"],
    ["西街", "West Street"],
    ["南街", "South Street"],
    ["北街", "North Street"],
    ["東站", "East Station"],
    ["西站", "West Station"],
    ["南站", "South Station"],
    ["北站", "North Station"],
    ["中央", "Central"],
    ["中心", "Center"],
  ];
  for (const [key, val] of dictionary) {
    if (zh === key) return val;
  }
  let res = zh;
  for (const [key, val] of dictionary) {
    if (res.includes(key)) {
      res = res.replace(key, " " + val + " ");
    }
  }
  return res.replace(/\s+/g, " ").trim() || zh;
}
