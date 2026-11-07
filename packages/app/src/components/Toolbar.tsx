import { useEffect, useRef, useState } from "react";
import { parseMapFile } from "@linewright/core";
import { downloadPNG, downloadSVG, printPDF, toSVGString } from "@linewright/renderer";
import { useEditor } from "../store/useEditor.js";
import { ExportIcon, GitHubIcon, LoadIcon, MoonIcon, RedoIcon, SaveIcon, SunIcon, UndoIcon } from "./Icons.js";
import { LogoImage } from "./LogoImage.js";
import { exampleMap } from "../example.js";

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
  const theme = useEditor((s) => s.theme);
  const toggleTheme = useEditor((s) => s.toggleTheme);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileOpen, setFileOpen] = useState(false);
  const fileWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (fileWrapRef.current && !fileWrapRef.current.contains(e.target as Node)) setFileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFileOpen(false); };
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
      setError("Unable to export SVG. Try exporting again after reloading the map.");
    }
  };

  const exportPNG = async () => {
    try {
      await downloadPNG(map, map.meta.title || "map");
      setToast("PNG exported (2×)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export PNG. Try exporting SVG instead.");
    }
  };

  const exportPDF = () => {
    try {
      printPDF(map);
      setToast("PDF print view opened — choose Save as PDF");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open PDF view. Try SVG export instead.");
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

  const fileActions: { label: string; icon?: React.ReactNode; action: () => void; primary?: boolean }[] = [
    { label: "Save", icon: <SaveIcon />, action: saveJSON },
    { label: "Load", icon: <LoadIcon />, action: openFile },
    { label: "Export SVG", icon: <ExportIcon />, action: exportSVG, primary: true },
    { label: "PNG", action: exportPNG },
    { label: "PDF", action: exportPDF },
    { label: "Example", action: loadExample },
  ];

  return (
    <header className="toolbar" aria-label="Editor toolbar">
      <LogoImage height={20} />
      <input
        className="map-title-input"
        aria-label="Map title"
        value={map.meta.title}
        onChange={(e) => renameMap(e.target.value)}
        onBlur={(e) => { if (!e.target.value.trim()) renameMap("Untitled map"); }}
      />
      <div className="toolbar-sep" aria-hidden="true" />

      <button type="button" className="btn btn-tool icon-btn" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}><UndoIcon /></button>
      <button type="button" className="btn btn-tool icon-btn" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}><RedoIcon /></button>
      <button
        type="button"
        className="btn btn-tool icon-btn"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        aria-pressed={theme === "dark"}
        onClick={toggleTheme}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="toolbar-sep" aria-hidden="true" />

      <div ref={fileWrapRef} style={{ position: "relative" }}>
        <button
          type="button"
          className="btn btn-primary"
          aria-haspopup="menu"
          aria-expanded={fileOpen}
          onClick={() => setFileOpen((v) => !v)}
        >
          <ExportIcon /> File
        </button>
        {fileOpen && (
          <div className="menu-pop" role="menu" aria-label="File actions" style={{ top: "calc(100% + 6px)", minWidth: 220 }}>
            {fileActions.map((a) => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => { setFileOpen(false); a.action(); }}
              >
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  {a.icon}
                  {a.label}
                </span>
                {a.primary && <span className="menu-shortcut" aria-hidden="true">★</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <a
        className="btn btn-tool icon-btn"
        href="https://github.com/NEXTechTW/Nodal"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Open the Nodal repository on GitHub"
        title="GitHub — NEXTechTW/Nodal"
        style={{ textDecoration: "none" }}
      >
        <GitHubIcon />
      </a>

      <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
    </header>
  );
}
