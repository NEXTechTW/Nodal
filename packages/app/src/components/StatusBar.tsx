import { useEditor } from "../store/useEditor.js";

export function StatusBar() {
  const map = useEditor((s) => s.map);
  const viewport = useEditor((s) => s.viewport);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const lastAction = useEditor((s) => s.lastActionLabel);
  const snap45 = useEditor((s) => s.snap45);

  const station = selectedStationId ? map.stations[selectedStationId] : undefined;

  return (
    <footer className="statusbar" aria-label="Status">
      <span aria-live="polite">{lastAction ?? "Ready"}</span>
      <span className="mono" aria-label="Zoom">{Math.round(viewport.k * 100)}%</span>
      <span>{Object.keys(map.stations).length} stations</span>
      <span>{Object.keys(map.lines).length} lines</span>
      <span>45° snap {snap45 ? "on" : "off"}</span>
      {station && (
        <span className="mono">
          x {station.position.x.toFixed(0)} · y {station.position.y.toFixed(0)}
        </span>
      )}
      <span style={{ marginLeft: "auto" }}>Nodal v0.1 — JSON schema v1</span>
    </footer>
  );
}
