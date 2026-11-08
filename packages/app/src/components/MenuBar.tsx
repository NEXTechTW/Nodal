import { useEffect, useRef, useState } from "react";
import { parseMapFile } from "@linewright/core";
import { downloadPNG, downloadSVG, printPDF, toSVGString } from "@linewright/renderer";
import { t } from "../i18n.js";
import { useEditor } from "../store/useEditor.js";
import { exampleMap } from "../example.js";
import { LogoImage } from "./LogoImage.js";

type Item =
  | { label: string; action: () => void; disabled?: boolean; shortcut?: string }
  | { divider: true };

/** Nodal Native Main Menu Bar */
export function MenuBar() {
  const map = useEditor((s) => s.map);
  const canUndo = useEditor((s) => s.stack.canUndo);
  const canRedo = useEditor((s) => s.stack.canRedo);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const setError = useEditor((s) => s.setError);
  const loadMap = useEditor((s) => s.loadMap);
  const newMap = useEditor((s) => s.newMap);
  const setToast = useEditor((s) => s.setToast);
  const theme = useEditor((s) => s.theme);
  const toggleTheme = useEditor((s) => s.toggleTheme);
  const avoidLabels = useEditor((s) => s.avoidLabelOverlaps);
  const toggleGrid = useEditor((s) => s.toggleGrid);
  const toggleSnap = useEditor((s) => s.toggleSnap);
  const toggleRulers = useEditor((s) => s.toggleRulers);
  const toggleMiniMap = useEditor((s) => s.toggleMiniMap);
  const toggleBilingual = useEditor((s) => s.toggleBilingual);
  const toggleTransferBadges = useEditor((s) => s.toggleTransferBadges);
  const toggleDPad = useEditor((s) => s.toggleDPad);
  const zoomIn = useEditor((s) => s.zoomIn);
  const zoomOut = useEditor((s) => s.zoomOut);
  const zoomFit = useEditor((s) => s.zoomFit);
  const setShortcutsOpen = useEditor((s) => s.setShortcutsOpen);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const duplicateStation = useEditor((s) => s.duplicateStation);
  const deleteSelectedStation = useEditor((s) => s.deleteSelectedStation);
  const uiLang = useEditor((s) => s.uiLang);
  const setUiLang = useEditor((s) => s.setUiLang);

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

  const exportSVG = () => {
    downloadSVG(toSVGString(map), `${map.meta.title || "map"}.svg`);
    setToast("SVG exported");
  };

  const exportPNG = () => {
    downloadPNG(map, map.meta.title || "map")
      .then(() => setToast("PNG exported"))
      .catch((e) => setError(e instanceof Error ? e.message : "PNG export failed"));
  };

  const exportPDF = () => {
    try {
      printPDF(map);
      setToast("PDF print view opened");
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    }
  };

  const L = (k: string) => t(uiLang, k);
  const menus: { label: string; items: Item[] }[] = [
    {
      label: L("File"),
      items: [
        { label: L("NewMap"), action: newMap, shortcut: "Ctrl+N" },
        { divider: true },
        { label: L("Save"), action: saveJSON, shortcut: "Ctrl+S" },
        { label: L("LoadJSON"), action: () => fileRef.current?.click(), shortcut: "Ctrl+O" },
        { divider: true },
        { label: L("ExportSVG"), action: exportSVG },
        { label: L("PNG"), action: exportPNG },
        { label: L("PDF"), action: exportPDF },
      ],
    },
    {
      label: L("Edit"),
      items: [
        { label: L("Undo"), action: undo, disabled: !canUndo, shortcut: "Ctrl+Z" },
        { label: L("Redo"), action: redo, disabled: !canRedo, shortcut: "Ctrl+Shift+Z" },
        { divider: true },
        {
          label: "Duplicate Station",
          action: () => selectedStationId && duplicateStation(selectedStationId),
          disabled: !selectedStationId,
          shortcut: "Ctrl+D",
        },
        {
          label: "Delete Selected",
          action: deleteSelectedStation,
          disabled: !selectedStationId,
          shortcut: "Del",
        },
      ],
    },
    {
      label: L("Map"),
      items: [
        { label: "Auto-Resolve Label Overlaps", action: avoidLabels },
        { divider: true },
        {
          label: "Load Lumen City Demo",
          action: () => {
            loadMap(exampleMap());
            setToast("Example map loaded");
          },
        },
      ],
    },
    {
      label: L("View"),
      items: [
        { label: "Toggle Grid", action: toggleGrid, shortcut: "Ctrl+'" },
        { label: "Toggle Snap to Grid", action: toggleSnap, shortcut: "Ctrl+;" },
        { label: "Toggle Canvas Rulers", action: toggleRulers, shortcut: "Ctrl+R" },
        { label: "Toggle Navigator Mini-Map", action: toggleMiniMap },
        { label: "Toggle Bilingual Labels", action: toggleBilingual },
        { label: "Toggle Transfer Badges", action: toggleTransferBadges },
        { label: "Toggle Canvas D-Pad", action: toggleDPad },
        { divider: true },
        { label: "Zoom In", action: zoomIn, shortcut: "Ctrl++" },
        { label: "Zoom Out", action: zoomOut, shortcut: "Ctrl+-" },
        { label: "Fit All in View", action: zoomFit, shortcut: "F" },
      ],
    },
    {
      label: "Language",
      items: [
        { label: "English", action: () => setUiLang("en") },
        { label: "繁體中文", action: () => setUiLang("zh-Hant") },
        { label: "简体中文", action: () => setUiLang("zh-Hans") },
        { label: "العربية", action: () => setUiLang("ar") },
        { label: "日本語", action: () => setUiLang("ja") },
        { label: "한국어", action: () => setUiLang("ko") },
        { label: "Русский", action: () => setUiLang("ru") },
        { divider: true },
        {
          label: `Current: ${uiLang}`,
          action: () => {},
          disabled: true,
        },
      ],
    },
    {
      label: L("Window"),
      items: [
        {
          label: theme === "dark" ? "Theme: Switch to Light" : "Theme: Switch to Nodal Dark",
          action: toggleTheme,
        },
        {
          label: "Addon & Extension Manager…",
          action: () => useEditor.getState().setAddonManagerOpen(true),
        },
        {
          label: "Reset Startup Welcome Screen",
          action: () => useEditor.getState().setStartupOpen(true),
        },
      ],
    },
    {
      label: "Translate",
      items: [
        {
          label: "Open Crowdin project",
          action: () => window.open("https://crowdin.com/project/nodal", "_blank", "noopener"),
        },
        {
          label: "Translation sources (en.json)",
          action: () => window.open("https://github.com/NEXTechTW/Nodal/blob/main/packages/app/src/locales/en.json", "_blank", "noopener"),
        },
      ],
    },
    {
      label: L("Help"),
      items: [
        { label: "Keyboard Shortcuts…", action: () => setShortcutsOpen(true), shortcut: "F1 / ?" },
        { divider: true },
        {
          label: "Online Documentation & Tutorial",
          action: () => window.open("https://github.com/NEXTechTW/Nodal/blob/main/docs/TUTORIAL.md", "_blank", "noopener"),
        },
        {
          label: "Nodal JSON Format Specification",
          action: () => window.open("https://github.com/NEXTechTW/Nodal/blob/main/docs/FORMAT.md", "_blank", "noopener"),
        },
        {
          label: "GitHub Project Repository",
          action: () => window.open("https://github.com/NEXTechTW/Nodal", "_blank", "noopener"),
        },
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
      setError(err instanceof Error ? err.message : "Unable to load map file.");
    }
  };

  return (
    <nav ref={barRef} className="menubar" aria-label="Menu bar">
      {/* Brand logo */}
      <div className="menu-logo">
        <LogoImage height={14} />
      </div>

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
              {m.items.map((it, idx) => {
                if ("divider" in it) {
                  return <div key={`div-${idx}`} className="menu-divider" />;
                }
                return (
                  <button
                    key={it.label}
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    disabled={it.disabled}
                    onClick={() => {
                      setOpen(null);
                      it.action();
                    }}
                  >
                    <span>{it.label}</span>
                    {it.shortcut && <span className="menu-shortcut">{it.shortcut}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <span style={{ flex: 1 }} aria-hidden="true" />
      <input ref={fileRef} type="file" accept="application/json,.json" aria-label="Load map JSON file" hidden onChange={onFile} />
    </nav>
  );
}
