import { useEffect, useRef, useState } from "react";
import { parseMapFile } from "@linewright/core";
import { downloadPNG, downloadSVG, printPDF, toSVGString } from "@linewright/renderer";
import { t } from "../i18n.js";
import { useEditor } from "../store/useEditor.js";
import { AddonManager } from "./AddonManager.js";
import {
  AddStationIcon,
  ConnectIcon,
  ExportIcon,
  GitHubIcon,
  LoadIcon,
  MoonIcon,
  PanIcon,
  RedoIcon,
  SaveIcon,
  SelectIcon,
  SunIcon,
  UndoIcon,
} from "./Icons.js";
import { exampleMap } from "../example.js";

/** Clean Nodal-style options / control bar. */
export function Toolbar() {
  const map = useEditor((s) => s.map);
  const tool = useEditor((s) => s.tool);
  const canUndo = useEditor((s) => s.stack.canUndo);
  const canRedo = useEditor((s) => s.stack.canRedo);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const setError = useEditor((s) => s.setError);
  const loadMap = useEditor((s) => s.loadMap);
  const renameMap = useEditor((s) => s.renameMap);
  const setToast = useEditor((s) => s.setToast);
  const theme = useEditor((s) => s.theme);
  const toggleTheme = useEditor((s) => s.toggleTheme);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const selectedLineId = useEditor((s) => s.selectedLineId);
  const activeLineId = useEditor((s) => s.activeLineId);
  const uiLang = useEditor((s) => s.uiLang);
  const tr = (k: string) => t(uiLang, k);

  const fileRef = useRef<HTMLInputElement>(null);
  const [fileOpen, setFileOpen] = useState(false);
  const fileWrapRef = useRef<HTMLDivElement>(null);
  const addonManagerOpen = useEditor((s) => s.addonManagerOpen);
  const setAddonManagerOpen = useEditor((s) => s.setAddonManagerOpen);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (fileWrapRef.current && !fileWrapRef.current.contains(e.target as Node)) {
        setFileOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFileOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

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
      setError("Unable to export SVG. Try exporting again.");
    }
  };

  const exportPNG = async () => {
    try {
      await downloadPNG(map, map.meta.title || "map");
      setToast("PNG exported (2×)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export PNG.");
    }
  };

  const exportPDF = () => {
    try {
      printPDF(map);
      setToast("PDF print view opened");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open PDF view.");
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      loadMap(parseMapFile(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load map file.");
    }
  };

  const toolIcons: Record<string, React.ReactNode> = {
    select: <SelectIcon />,
    "add-station": <AddStationIcon />,
    connect: <ConnectIcon />,
    pan: <PanIcon />,
  };

  const toolLabels: Record<string, string> = {
    select: "Select",
    "add-station": "Add Station",
    connect: "Connect",
    pan: "Hand",
  };

  const activeLine = activeLineId ? map.lines[activeLineId] : null;

  return (
    <header className="toolbar" aria-label="Control bar">
      {/* Tool Badge */}
      <div className="toolbar-tool-badge" title={`Active Tool: ${toolLabels[tool]}`}>
        <span style={{ color: "var(--color-accent)", display: "flex" }}>{toolIcons[tool]}</span>
        <span>{toolLabels[tool]}</span>
      </div>

      <div className="toolbar-sep" aria-hidden="true" />

      {/* Document Map Name Input */}
      <input
        className="map-title-input"
        aria-label="Map document title"
        value={map.meta.title}
        onChange={(e) => renameMap(e.target.value)}
        onBlur={(e) => {
          if (!e.target.value.trim()) renameMap("Untitled map");
        }}
        placeholder="Untitled map"
      />

      <div className="toolbar-sep" aria-hidden="true" />

      {/* History Controls */}
      <div className="toolbar-group">
        <button
          type="button"
          className="btn btn-tool icon-btn"
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={undo}
        >
          <UndoIcon />
        </button>
        <button
          type="button"
          className="btn btn-tool icon-btn"
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={redo}
        >
          <RedoIcon />
        </button>
      </div>

      <div className="toolbar-sep" aria-hidden="true" />

      {/* Tool Contextual Hint */}
      <div className="toolbar-context-info">
        {tool === "connect" ? (
          activeLine ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>Drawing line:</span>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: activeLine.color,
                }}
              />
              <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                {activeLine.name.en || activeLineId}
              </span>
            </span>
          ) : (
            <span>Select or add a line to connect stations</span>
          )
        ) : selectedStationId ? (
          <span>Station selected</span>
        ) : selectedLineId ? (
          <span>Line selected</span>
        ) : (
          <span style={{ color: "var(--color-text-tertiary)" }}>No selection</span>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* File & Export Dropdown */}
      <div ref={fileWrapRef} style={{ position: "relative" }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          aria-haspopup="menu"
          aria-expanded={fileOpen}
          onClick={() => setFileOpen((v) => !v)}
        >
          <ExportIcon /> Export
        </button>
        {fileOpen && (
          <div className="menu-pop" role="menu" aria-label="Export menu" style={{ right: 0, left: "auto", minWidth: 200 }}>
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); exportSVG(); }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><ExportIcon /> {tr("ExportSVG")}</span>
              <span className="menu-shortcut">Vector</span>
            </button>
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); exportPNG(); }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><ExportIcon /> {tr("PNG")}</span>
              <span className="menu-shortcut">Image</span>
            </button>
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); exportPDF(); }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><ExportIcon /> {tr("PDF")}</span>
              <span className="menu-shortcut">Doc</span>
            </button>
            <div className="menu-divider" />
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); saveJSON(); }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><SaveIcon /> {tr("Save")}</span>
              <span className="menu-shortcut">Ctrl+S</span>
            </button>
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); fileRef.current?.click(); }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><LoadIcon /> {tr("LoadJSON")}</span>
              <span className="menu-shortcut">Ctrl+O</span>
            </button>
            <div className="menu-divider" />
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); loadMap(exampleMap()); setToast("Lumen City example loaded"); }}>
              <span>Load Lumen City Demo</span>
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-sep" aria-hidden="true" />

      {/* Theme Toggle */}
      <button
        type="button"
        className="btn btn-tool icon-btn"
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Light Theme" : "Dark Theme"}
        onClick={toggleTheme}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      <button
        type="button"
        className="btn btn-tool icon-btn"
        aria-label="Manage addons"
        title="Addons & Extensions"
        onClick={() => setAddonManagerOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M14 3h7v7" /><path d="M9 21H3v-6" /><path d="M21 3l-9 9" /><path d="M3 21l9-9" /></svg>
      </button>

      {/* GitHub Repository */}
      <a
        className="btn btn-tool icon-btn"
        href="https://github.com/NEXTechTW/Nodal"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="GitHub Repository"
        title="GitHub — NEXTechTW/Nodal"
        style={{ textDecoration: "none" }}
      >
        <GitHubIcon />
      </a>

      <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
      {addonManagerOpen && <AddonManager onClose={() => setAddonManagerOpen(false)} />}
    </header>
  );
}
