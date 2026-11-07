import { useRef } from "react";
import { parseMapFile } from "@linewright/core";
import { downloadSVG, toSVGString } from "@linewright/renderer";
import { useEditor, type Tool } from "../store/useEditor.js";
import { AddStationIcon, ConnectIcon, ExportIcon, LoadIcon, PanIcon, RedoIcon, SaveIcon, SelectIcon, UndoIcon } from "./Icons.js";
import { exampleMap } from "../example.js";

function ToolBtn({
  tool,
  label,
  children,
  onClick,
}: {
  tool?: Tool;
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const current = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const pressed = tool ? current === tool : undefined;
  return (
    <button
      type="button"
      className="btn btn-tool icon-btn"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick ?? (tool ? () => setTool(tool) : undefined)}
    >
      {children}
    </button>
  );
}

export function Toolbar() {
  const map = useEditor((s) => s.map);
  const canUndo = useEditor((s) => s.stack.canUndo);
  const canRedo = useEditor((s) => s.stack.canRedo);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const setError = useEditor((s) => s.setError);
  const loadMap = useEditor((s) => s.loadMap);
  const renameMap = useEditor((s) => s.renameMap);
  const setToast = useEditor((s) => s.setToast);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveJSON = () => {
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${map.meta.title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "map"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast("Map saved as JSON");
  };

  const exportSVG = () => {
    try {
      downloadSVG(toSVGString(map, { showGrid: false }), `${map.meta.title || "map"}.svg`);
      setToast("SVG exported");
    } catch {
      setError("Unable to export SVG. Try exporting again after reloading the map.");
    }
  };

  const openFile = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      loadMap(parseMapFile(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load map file. Choose a .json file exported from Nodal and try again.");
    }
  };

  const loadExample = () => {
    loadMap(exampleMap());
    setToast("Example map loaded");
  };

  return (
    <header className="toolbar" aria-label="Editor toolbar">
      <span className="toolbar-title">Nodal</span>
      <input
        className="map-title-input"
        aria-label="Map title"
        value={map.meta.title}
        onChange={(e) => renameMap(e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) renameMap("Untitled map"); }}
      />
      <div className="toolbar-sep" aria-hidden="true" />

      <div role="group" aria-label="Tools" style={{ display: "flex", gap: 4 }}>
        <ToolBtn tool="select" label="Select (V)"><SelectIcon /></ToolBtn>
        <ToolBtn tool="add-station" label="Add station — click canvas (A)"><AddStationIcon /></ToolBtn>
        <ToolBtn tool="connect" label="Connect stations — drag from one station to another (C)"><ConnectIcon /></ToolBtn>
        <ToolBtn tool="pan" label="Pan — drag canvas or hold Space (H)"><PanIcon /></ToolBtn>
      </div>

      <div className="toolbar-sep" aria-hidden="true" />

      <button type="button" className="btn btn-tool icon-btn" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}><UndoIcon /></button>
      <button type="button" className="btn btn-tool icon-btn" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}><RedoIcon /></button>

      <div className="toolbar-sep" aria-hidden="true" />

      <button type="button" className="btn" onClick={saveJSON}><SaveIcon /> Save</button>
      <button type="button" className="btn" onClick={openFile}><LoadIcon /> Load</button>
      <button type="button" className="btn btn-primary" onClick={exportSVG}><ExportIcon /> Export SVG</button>
      <button type="button" className="btn" onClick={loadExample}>Example</button>

      <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
    </header>
  );
}
