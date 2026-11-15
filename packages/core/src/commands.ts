/**
 * Command Pattern — every edit is a reversible command (PROJECT.md §3).
 * The store dispatches commands; undo/redo is the stack.
 *
 * Each command captures before/after immutable snapshots so undo is exact,
 * even for deletes and moves. Commands are plain data + apply functions,
 * which keeps them serializable and testable.
 */
import type { MetroMap } from "./types.js";

export type CommandName =
  | "AddStation"
  | "MoveStation"
  | "DeleteStation"
  | "RenameStation"
  | "SetStationKind"
  | "AddLine"
  | "RenameLine"
  | "SetLineColor"
  | "SetLineStyle"
  | "DeleteLine"
  | "AddSegment"
  | "DeleteSegment"
  | "SetTitle";

export interface Command {
  name: CommandName;
  /** Human label for menus/toasts, e.g. "Add station". */
  label: string;
  /** Pure function: map → next map. */
  apply(map: MetroMap): MetroMap;
  /** Pure function: map → reverted map. */
  revert(map: MetroMap): MetroMap;
}

export class CommandStack {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private map: MetroMap;

  constructor(initial: MetroMap) {
    this.map = initial;
  }

  get current(): MetroMap {
    return this.map;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Apply and record. Clears redo. */
  dispatch(cmd: Command): MetroMap {
    this.map = cmd.apply(this.map);
    this.undoStack.push(cmd);
    this.redoStack = [];
    return this.map;
  }

  undo(): MetroMap {
    const cmd = this.undoStack.pop();
    if (!cmd) return this.map;
    this.map = cmd.revert(this.map);
    this.redoStack.push(cmd);
    return this.map;
  }

  redo(): MetroMap {
    const cmd = this.redoStack.pop();
    if (!cmd) return this.map;
    this.map = cmd.apply(this.map);
    this.undoStack.push(cmd);
    return this.map;
  }

  reset(map: MetroMap): void {
    this.map = map;
    this.undoStack = [];
    this.redoStack = [];
  }

  /** Adopt external edits without changing undo/redo history. */
  sync(map: MetroMap): void {
    this.map = map;
  }

  /** Labels for history UI (most recent first). */
  history(): string[] {
    return [...this.undoStack].reverse().map((c) => c.label);
  }
}

/* ------- Command factories (immutable, structured-clone based) ------- */

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function addStationCommand(
  id: string,
  station: MetroMap["stations"][string],
): Command {
  const snapshot = clone(station);
  return {
    name: "AddStation",
    label: "Add station",
    apply: (map) => ({ ...map, stations: { ...map.stations, [id]: clone(snapshot) } }),
    revert: (map) => {
      const stations = { ...map.stations };
      delete stations[id];
      return { ...map, stations };
    },
  };
}

export function moveStationCommand(
  id: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Command {
  return {
    name: "MoveStation",
    label: "Move station",
    apply: (map) => {
      const s = map.stations[id];
      if (!s) return map;
      return { ...map, stations: { ...map.stations, [id]: { ...s, position: { ...to } } } };
    },
    revert: (map) => {
      const s = map.stations[id];
      if (!s) return map;
      return { ...map, stations: { ...map.stations, [id]: { ...s, position: { ...from } } } };
    },
  };
}

export function deleteStationCommand(
  id: string,
  station: MetroMap["stations"][string],
): Command {
  const snapshot = clone(station);
  return {
    name: "DeleteStation",
    label: "Delete station",
    apply: (map) => {
      const stations = { ...map.stations };
      delete stations[id];
      return { ...map, stations };
    },
    revert: (map) => ({ ...map, stations: { ...map.stations, [id]: clone(snapshot) } }),
  };
}

export function renameStationCommand(
  id: string,
  from: Record<string, string>,
  to: Record<string, string>,
): Command {
  return {
    name: "RenameStation",
    label: "Rename station",
    apply: (map) => {
      const s = map.stations[id];
      if (!s) return map;
      return { ...map, stations: { ...map.stations, [id]: { ...s, name: clone(to) } } };
    },
    revert: (map) => {
      const s = map.stations[id];
      if (!s) return map;
      return { ...map, stations: { ...map.stations, [id]: { ...s, name: clone(from) } } };
    },
  };
}

export function addLineCommand(id: string, line: MetroMap["lines"][string]): Command {
  const snapshot = clone(line);
  return {
    name: "AddLine",
    label: "Add line",
    apply: (map) => ({ ...map, lines: { ...map.lines, [id]: clone(snapshot) } }),
    revert: (map) => {
      const lines = { ...map.lines };
      delete lines[id];
      return { ...map, lines };
    },
  };
}

export function addSegmentCommand(lineId: string, from: string, to: string): Command {
  return {
    name: "AddSegment",
    label: "Connect stations",
    apply: (map) => {
      const line = map.lines[lineId];
      if (!line) return map;
      const dup = line.segments.some(
        (s) => (s.from === from && s.to === to) || (s.from === to && s.to === from),
      );
      if (dup) return map;
      return {
        ...map,
        lines: {
          ...map.lines,
          [lineId]: { ...line, segments: [...line.segments, { from, to }] },
        },
      };
    },
    revert: (map) => {
      const line = map.lines[lineId];
      if (!line) return map;
      return {
        ...map,
        lines: {
          ...map.lines,
          [lineId]: {
            ...line,
            segments: line.segments.filter(
              (s) => !((s.from === from && s.to === to) || (s.from === to && s.to === from)),
            ),
          },
        },
      };
    },
  };
}

export function setLineColorCommand(lineId: string, from: string, to: string): Command {
  return {
    name: "SetLineColor",
    label: "Change line color",
    apply: (map) => {
      const line = map.lines[lineId];
      if (!line) return map;
      return { ...map, lines: { ...map.lines, [lineId]: { ...line, color: to } } };
    },
    revert: (map) => {
      const line = map.lines[lineId];
      if (!line) return map;
      return { ...map, lines: { ...map.lines, [lineId]: { ...line, color: from } } };
    },
  };
}

export function renameLineCommand(lineId: string, from: Record<string, string>, to: Record<string, string>): Command {
  const f = clone(from);
  const t = clone(to);
  return {
    name: "RenameLine",
    label: "Rename line",
    apply: (map) => {
      const line = map.lines[lineId];
      if (!line) return map;
      return { ...map, lines: { ...map.lines, [lineId]: { ...line, name: clone(t) } } };
    },
    revert: (map) => {
      const line = map.lines[lineId];
      if (!line) return map;
      return { ...map, lines: { ...map.lines, [lineId]: { ...line, name: clone(f) } } };
    },
  };
}

export function setLineStyleCommand(lineId: string, from: import("./types.js").LineStyle, to: import("./types.js").LineStyle): Command {
  return {
    name: "SetLineStyle",
    label: "Change line style",
    apply: (map) => {
      const line = map.lines[lineId];
      if (!line) return map;
      return { ...map, lines: { ...map.lines, [lineId]: { ...line, style: to } } };
    },
    revert: (map) => {
      const line = map.lines[lineId];
      if (!line) return map;
      return { ...map, lines: { ...map.lines, [lineId]: { ...line, style: from } } };
    },
  };
}

export function deleteLineCommand(lineId: string, line: MetroMap["lines"][string]): Command {
  const snapshot = clone(line);
  return {
    name: "DeleteLine",
    label: "Delete line",
    apply: (map) => {
      const lines = { ...map.lines };
      delete lines[lineId];
      return { ...map, lines };
    },
    revert: (map) => ({ ...map, lines: { ...map.lines, [lineId]: clone(snapshot) } }),
  };
}

export function setTitleCommand(from: string, to: string): Command {
  return {
    name: "SetTitle",
    label: "Rename map",
    apply: (map) => ({ ...map, meta: { ...map.meta, title: to } }),
    revert: (map) => ({ ...map, meta: { ...map.meta, title: from } }),
  };
}
