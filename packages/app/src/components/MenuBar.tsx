import { useEffect, useRef, useState } from "react";
import { parseMapFile } from "@linewright/core";
import { downloadPNG, downloadSVG, printPDF, toSVGString } from "@linewright/renderer";
import { useEditor } from "../store/useEditor.js";
import { exampleMap } from "../example.js";

type Item = { label: string; action: () => void; disabled?: boolean; shortcut?: string };

/** Nodal menu bar (File … Help). Dropdowns close on Escape / outside click. */
export function MenuBar() {
  const map = useEditor((s) => s.map);
  const canUndo = useEditor((s) => s.stack.canUndo);
  const canRedo = useEditor((s) => s.stack.canRedo);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const deleteSelected = useEditor((s) => s.deleteSelectedStation);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const setError = useEditor((s) => s.setError);
  const loadMap = useEditor((s) => s.loadMap);
  const setToast = useEditor((s) => s.setToast);
  const theme = useEditor((s) => s.theme);
  const toggleTheme = useEditor((s) => s.toggleTheme);
  const setViewport = useEditor((s) => s.setViewport);
  const setTool = useEditor((s) => s.setTool);
  const avoidLabels = useEditor((s) => s.avoidLabelOverlaps);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
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
    a.download = `${map.meta.title || "map"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast("Map saved as JSON");
  };

  const menus: { label: string; items: Item[] }[] = [
    {
      label: "File",
      items: [
        { label: "Save JSON", action: saveJSON },
        { label: "Load JSON…", action: () => fileRef.current?.click() },
        { label: "Export SVG", action: () => { downloadSVG(toSVGString(map), `${map.meta.title || "map"}.svg`); setToast("SVG exported"); } },
        { label: "Export PNG", action: () => { downloadPNG(map, map.meta.title || "map").then(() => setToast("PNG exported")).catch((e) => setError(e instanceof Error ? e.message : "PNG export failed")); } },
        { label: "Export PDF…", action: () => { try { printPDF(map); setToast("PDF print view opened"); } catch (e) { setError(e instanceof Error ? e.message : "PDF export failed"); } } },
        { label: "Load example (Lumen City)", action: () => { loadMap(exampleMap()); setToast("Example map loaded"); } },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", action: undo, disabled: !canUndo, shortcut: "Ctrl+Z" },
        { label: "Redo", action: redo, disabled: !canRedo, shortcut: "Ctrl+Shift+Z" },
      ],
    },
    {
      label: "Map",
      items: [
        { label: "Arrange labels (avoid overlap)", action: avoidLabels },
        { label: "Load example (Lumen City)", action: () => { loadMap(exampleMap()); setToast("Example map loaded"); } },
      ],
    },
    {
      label: "Station",
      items: [
        { label: "Add station tool", action: () => setTool("add-station"), shortcut: "A" },
        { label: "Select tool", action: () => setTool("select"), shortcut: "V" },
        { label: "Delete selected station", action: deleteSelected, disabled: !selectedStationId, shortcut: "Del" },
      ],
    },
    {
      label: "Line",
      items: [
        { label: "Connect tool (drag between stations)", action: () => setTool("connect"), shortcut: "C" },
        { label: "Lines are created in the Lines panel", action: () => {}, disabled: true },
      ],
    },
    {
      label: "Label",
      items: [
        { label: "Arrange labels (avoid overlap)", action: avoidLabels },
        { label: "Label language is set in Properties", action: () => {}, disabled: true },
      ],
    },
    {
      label: "View",
      items: [
        { label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode", action: toggleTheme },
        { label: "Zoom 100% (reset viewport)", action: () => setViewport({ x: 0, y: 0, k: 1 }) },
      ],
    },
    {
      label: "Window",
      items: [
        { label: "Open GitHub repository", action: () => window.open("https://github.com/NEXTechTW/Nodal", "_blank", "noopener") },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Read the tutorial", action: () => window.open("https://github.com/NEXTechTW/Nodal/blob/main/docs/TUTORIAL.md", "_blank", "noopener") },
        { label: "Read the format spec", action: () => window.open("https://github.com/NEXTechTW/Nodal/blob/main/docs/FORMAT.md", "_blank", "noopener") },
      ],
    },
  ];

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const text = await f.text();
      loadMap(parseMapFile(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load map file. Choose a .json file exported from Nodal and try again.");
    }
  };

  return (
    <nav ref={barRef} className="menubar" aria-label="Menu bar">
      {menus.map((m) => (
        <div key={m.label} className="menu-wrap">
          <button
            type="button"
            className="menu-btn"
            aria-haspopup="menu"
            aria-expanded={open === m.label}
            onClick={() => setOpen(open === m.label ? null : m.label)}
          >
            {m.label}
          </button>
          {open === m.label && (
            <div className="menu-pop" role="menu" aria-label={`${m.label} menu`}>
              {m.items.map((it) => (
                <button
                  key={it.label}
                  type="button"
                  role="menuitem"
                  className="menu-item"
                  disabled={it.disabled}
                  onClick={() => { setOpen(null); it.action(); }}
                >
                  <span>{it.label}</span>
                  {it.shortcut && <span className="menu-shortcut">{it.shortcut}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <span style={{ flex: 1 }} aria-hidden="true" />
      <span className="menu-note" aria-hidden="true">Nodal</span>
      <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
    </nav>
  );
}
