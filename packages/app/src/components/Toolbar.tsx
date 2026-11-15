import { useEffect, useRef, useState } from "react";
import { parseMapFile } from "@nodal/core";
import { downloadPNG, downloadSVG, printPDF, toSVGString } from "@nodal/renderer";
import { t } from "../i18n.js";
import { isDarkTheme, useEditor } from "../store/useEditor.js";
import { AddonManager } from "./AddonManager.js";
import { MarkEditor } from "./MarkEditor.js";
import { ThemePicker, isThemeAddonEnabled } from "./ThemePicker.js";
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
  const [themeAddonOn, setThemeAddonOn] = useState(() => isThemeAddonEnabled());

  useEffect(() => {
    setThemeAddonOn(isThemeAddonEnabled());
    const onStorage = () => setThemeAddonOn(isThemeAddonEnabled());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!addonManagerOpen) setThemeAddonOn(isThemeAddonEnabled());
  }, [addonManagerOpen]);

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
    setToast(tr("MapSavedAsJSON"));
  };

  const exportSVG = () => {
    try {
      downloadSVG(toSVGString(map, { showGrid: false }), `${map.meta.title || "map"}.svg`);
      setToast(tr("SVGExported"));
    } catch {
      setError("Unable to export SVG. Try exporting again.");
    }
  };

  const exportPNG = async () => {
    try {
      await downloadPNG(map, map.meta.title || "map");
      setToast(tr("PNGExported"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export PNG.");
    }
  };

  const exportPDF = () => {
    try {
      printPDF(map);
      setToast(tr("PDFExported"));
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
      setError(err instanceof Error ? err.message : "Couldn't load that file.");
    }
  };

  const toolIcons: Record<string, React.ReactNode> = {
    select: <SelectIcon />,
    "add-station": <AddStationIcon />,
    connect: <ConnectIcon />,
    pan: <PanIcon />,
  };

  const toolLabels: Record<string, string> = {
    select: tr("ToolSelect"),
    "add-station": tr("ToolAddStation"),
    connect: tr("ToolConnect"),
    pan: tr("ToolPan"),
  };

  const activeLine = activeLineId ? map.lines[activeLineId] : null;

  return (
    <header className="toolbar" aria-label="Control bar">
      {/* Tool Badge */}
      <div className="toolbar-tool-badge" title={`${tr("ActiveTool")}: ${toolLabels[tool]}`}>
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
          if (!e.target.value.trim()) renameMap(tr("UntitledMap"));
        }}
        placeholder={tr("UntitledMap")}
      />

      <div className="toolbar-sep" aria-hidden="true" />

      {/* History Controls */}
      <div className="toolbar-group">
        <button
          type="button"
          className="btn btn-tool icon-btn"
          aria-label={tr("Undo")}
          title={`${tr("Undo")} (Ctrl+Z)`}
          disabled={!canUndo}
          onClick={undo}
        >
          <UndoIcon />
        </button>
        <button
          type="button"
          className="btn btn-tool icon-btn"
          aria-label={tr("Redo")}
          title={`${tr("Redo")} (Ctrl+Shift+Z)`}
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
              <span>{tr("DrawingLine")}:</span>
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
            <span>{tr("ConnectHint")}</span>
          )
        ) : selectedStationId ? (
          <span>{tr("StationSelected")}</span>
        ) : selectedLineId ? (
          <span>{tr("LineSelected")}</span>
        ) : (
          <span style={{ color: "var(--color-text-tertiary)" }}>{tr("NoSelection")}</span>
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
          <ExportIcon /> {tr("Export")}
        </button>
        {fileOpen && (
          <div className="menu-pop" role="menu" aria-label="Export menu" style={{ right: 0, left: "auto", minWidth: 200 }}>
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); exportSVG(); }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><ExportIcon /> {tr("ExportSVG")}</span>
              <span className="menu-shortcut">{tr("Vector")}</span>
            </button>
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); exportPNG(); }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><ExportIcon /> {tr("PNG")}</span>
              <span className="menu-shortcut">{tr("Image")}</span>
            </button>
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); exportPDF(); }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><ExportIcon /> {tr("PDF")}</span>
              <span className="menu-shortcut">{tr("Doc")}</span>
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
            <button type="button" className="menu-item" onClick={() => { setFileOpen(false); loadMap(exampleMap()); setToast(tr("ExampleMapLoaded")); }}>
              <span>{tr("LoadLumenCity")}</span>
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-sep" aria-hidden="true" />

      {/* If nodal-addon-theme is installed/enabled, the sun toggle is hidden
          and replaced by the palette icon picker (text merged into icon). */}
      {themeAddonOn ? (
        <>
          <MarkEditor />
          <ThemePicker />
        </>
      ) : (
        <button
          type="button"
          className="btn btn-tool icon-btn"
          aria-label={isDarkTheme(theme) ? tr("LightMode") : tr("DarkMode")}
          title={isDarkTheme(theme) ? tr("LightMode") : tr("DarkMode")}
          onClick={toggleTheme}
        >
          {isDarkTheme(theme) ? <SunIcon /> : <MoonIcon />}
        </button>
      )}

      <button
        type="button"
        className="btn btn-tool icon-btn"
        aria-label={tr("AddonManager")}
        title={tr("AddonsModalTitle")}
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
        title="Nodal on GitHub"
        style={{ textDecoration: "none" }}
      >
        <GitHubIcon />
      </a>

      <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
      {addonManagerOpen && <AddonManager onClose={() => setAddonManagerOpen(false)} />}
    </header>
  );
}
