import { useEditor } from "../store/useEditor.js";

export function StatusBar() {
  const map = useEditor((s) => s.map);
  const viewport = useEditor((s) => s.viewport);
  const setViewport = useEditor((s) => s.setViewport);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const lastAction = useEditor((s) => s.lastActionLabel);

  const station = selectedStationId ? map.stations[selectedStationId] : undefined;
  const zoom = (factor: number) => setViewport({ k: Math.min(4, Math.max(0.2, viewport.k * factor)) });
  const fit = () => setViewport({ x: 0, y: 0, k: 1 });

  return (
    <footer className="statusbar" aria-label="Status">
      <span aria-live="polite">{lastAction ?? "Ready"}</span>
      <span aria-label="Zoom controls" style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
        <button type="button" className="btn btn-tool btn-sm" aria-label="Zoom out" onClick={() => zoom(0.8)}>−</button>
        <span className="mono" aria-label="Zoom">{Math.round(viewport.k * 100)}%</span>
        <button type="button" className="btn btn-tool btn-sm" aria-label="Zoom in" onClick={() => zoom(1.25)}>+</button>
        <button type="button" className="btn btn-tool btn-sm" aria-label="Fit view (reset to 100%)" title="Fit view (100%)" onClick={fit}>Fit</button>
      </span>
      <span>{Object.keys(map.stations).length} stations</span>
      <span>{Object.keys(map.lines).length} lines</span>
      {station && (
        <span className="mono">
          x {station.position.x.toFixed(0)} · y {station.position.y.toFixed(0)}
        </span>
      )}
      <span style={{ marginLeft: "auto" }}>Nodal v0.3 — JSON schema v1</span>
    </footer>
  );
}
