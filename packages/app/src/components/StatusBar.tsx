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

  const station = selectedStationId ? map.stations[selectedStationId] : undefined;
  const line = selectedLineId ? map.lines[selectedLineId] : undefined;

  const toolHelp: Record<string, string> = {
    select: "Select Tool: Click to select station/line. Drag to move.",
    "add-station": "Add Station: Click canvas to place new transit station.",
    connect: "Connect Tool: Drag from one station to another to connect track.",
    pan: "Hand Tool: Drag canvas to pan view.",
  };

  return (
    <footer className="statusbar" aria-label="Status bar">
      {/* Tool / Operation Hint */}
      <span aria-live="polite" style={{ color: "var(--color-text)" }}>
        {lastAction ? `Last Action: ${lastAction}` : toolHelp[tool] ?? "Ready"}
      </span>

      <div className="statusbar-sep" />

      {/* Network Stats */}
      <span>
        {Object.keys(map.stations).length} stations · {Object.keys(map.lines).length} lines
      </span>

      <div className="statusbar-sep" />

      {/* Selection detail */}
      {station && (
        <span className="mono" style={{ color: "var(--color-accent)" }}>
          Station: {station.name["en"] || station.id} (x: {Math.round(station.position.x)}, y: {Math.round(station.position.y)})
        </span>
      )}
      {line && !station && (
        <span className="mono" style={{ color: "var(--color-accent)" }}>
          Line: {line.name["en"] || line.id} ({line.segments.length} segments)
        </span>
      )}

      {/* Cursor position */}
      {cursorPos && (
        <span className="mono" title="Canvas map coordinate cursor position">
          x: {cursorPos.x}px · y: {cursorPos.y}px
        </span>
      )}

      <div className="statusbar-sep" />

      {/* Snap State */}
      <span title="Snap state">
        {snapToGrid ? "Snap: ON (45° / Grid)" : "Snap: OFF"}
      </span>

      {/* Zoom scale controls */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
        <button
          type="button"
          className="btn btn-tool btn-sm"
          aria-label="Zoom out"
          title="Zoom out"
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
          aria-label="Zoom in"
          title="Zoom in"
          onClick={zoomIn}
        >
          +
        </button>
        <button
          type="button"
          className="btn btn-tool btn-sm"
          aria-label="Fit View"
          title="Fit to view (F)"
          onClick={zoomFit}
        >
          Fit
        </button>
      </div>

      <div className="statusbar-sep" />
      <span>v0.3</span>
    </footer>
  );
}
