import { t } from "../i18n.js";
import { useEditor } from "../store/useEditor.js";

export function StatusBar() {
  const map = useEditor((s) => s.map);
  const tool = useEditor((s) => s.tool);
  const viewport = useEditor((s) => s.viewport);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const selectedLineId = useEditor((s) => s.selectedLineId);
  const lastAction = useEditor((s) => s.lastActionLabel);
  const cursorPos = useEditor((s) => s.cursorPos);
  const snapToGrid = useEditor((s) => s.snapToGrid);
  const zoomIn = useEditor((s) => s.zoomIn);
  const zoomOut = useEditor((s) => s.zoomOut);
  const zoomFit = useEditor((s) => s.zoomFit);
  const uiLang = useEditor((s) => s.uiLang);
  const tr = (k: string) => t(uiLang, k);

  const station = selectedStationId ? map.stations[selectedStationId] : undefined;
  const line = selectedLineId ? map.lines[selectedLineId] : undefined;

  const toolHelp: Record<string, string> = {
    select: tr("ToolHelpSelect"),
    "add-station": tr("ToolHelpAddStation"),
    connect: tr("ToolHelpConnect"),
    pan: tr("ToolHelpPan"),
  };

  return (
    <footer className="statusbar" aria-label="Status bar">
      {/* Tool / Operation Hint */}
      <span aria-live="polite" style={{ color: "var(--color-text)" }}>
        {lastAction ? `${tr("LastAction")}: ${lastAction}` : toolHelp[tool] ?? tr("StatusReady")}
      </span>

      <div className="statusbar-sep" />

      {/* Network Stats */}
      <span>
        {Object.keys(map.stations).length} {tr("StatusStations")} · {Object.keys(map.lines).length} {tr("StatusLines")}
      </span>

      <div className="statusbar-sep" />

      {/* Selection detail */}
      {station && (
        <span className="mono" style={{ color: "var(--color-accent)" }}>
          {tr("Station")}: {station.name[uiLang] || station.name.en || station.id} (x: {Math.round(station.position.x)}, y: {Math.round(station.position.y)})
        </span>
      )}
      {line && !station && (
        <span className="mono" style={{ color: "var(--color-accent)" }}>
          {tr("Line")}: {line.name[uiLang] || line.name.en || line.id} ({line.segments.length} {tr("StatusSegments")})
        </span>
      )}

      {/* Cursor position */}
      {cursorPos && (
        <span className="mono" title="Cursor position">
          x: {cursorPos.x}px · y: {cursorPos.y}px
        </span>
      )}

      <div className="statusbar-sep" />

      {/* Snap State */}
      <span title="Grid snap">
        {snapToGrid ? tr("SnapOn") : tr("SnapOff")}
      </span>

      {/* Zoom scale controls */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
        <button
          type="button"
          className="btn btn-tool btn-sm"
          aria-label={tr("ZoomOut")}
          title={tr("ZoomOut")}
          onClick={zoomOut}
        >
          −
        </button>
        <span className="mono" style={{ paddingInline: 4 }}>
          {Math.round(viewport.k * 100)}%
        </span>
        <button
          type="button"
          className="btn btn-tool btn-sm"
          aria-label={tr("ZoomIn")}
          title={tr("ZoomIn")}
          onClick={zoomIn}
        >
          +
        </button>
        <button
          type="button"
          className="btn btn-tool btn-sm"
          aria-label={tr("FitView")}
          title={`${tr("FitView")} (F)`}
          onClick={zoomFit}
        >
          {tr("FitView")}
        </button>
      </div>

      <div className="statusbar-sep" />
      <span>v0.4</span>
    </footer>
  );
}
