import { useState } from "react";
import { useEditor } from "../store/useEditor.js";

/** Standalone station-mark designer window (rectangle properties + code). */
export function MarkDesigner({ onClose }: { onClose: () => void }) {
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const setStationKind = useEditor((s) => s.setStationKind);
  const setStationRadius = useEditor((s) => s.setStationRadius);
  const map = useEditor((s) => s.map);
  const setToast = useEditor((s) => s.setToast);

  const station = selectedStationId ? map.stations[selectedStationId] : undefined;
  const [code, setCode] = useState("R03");
  const [w, setW] = useState(34);
  const [h, setH] = useState(24);
  const [radius, setRadius] = useState(8);
  const [fill, setFill] = useState("#ffffff");
  const [stroke, setStroke] = useState("#E00034");
  const [strokeW, setStrokeW] = useState(3);

  const apply = () => {
    if (!station) {
      setToast("Select a station first");
      return;
    }
    setStationKind(station.id, "normal");
    setStationRadius(Math.max(4, Math.min(16, Math.round(w / 2))));
    setToast(`Mark ${code} applied`);
    onClose();
  };

  return (
    <div className="startup-backdrop" role="dialog" aria-modal="true" aria-labelledby="mark-title">
      <div className="startup-window" style={{ width: "min(560px, 100%)" }}>
        <div className="startup-head">
          <div className="startup-head-text">
            <h2 id="mark-title" className="startup-title">Station mark designer</h2>
            <p className="startup-sub">Draw and tune a rectangle mark, then apply it.</p>
          </div>
          <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 12 }}>
          <svg width="140" height="90" viewBox="0 0 140 90" aria-hidden="true" style={{ border: "1px solid var(--color-border)", borderRadius: 8, background: "var(--color-bg)" }}>
            <rect x={(140 - w) / 2} y={(90 - h) / 2} width={w} height={h} rx={radius} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <text x={70} y={49} textAnchor="middle" fontSize="11" fill={stroke} fontFamily="monospace" dominantBaseline="middle">{code}</text>
          </svg>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
              Code
              <input className="prop-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
              Width
              <input type="number" className="prop-input" value={w} min={16} max={80} onChange={(e) => setW(Number(e.target.value) || 34)} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
              Height
              <input type="number" className="prop-input" value={h} min={16} max={60} onChange={(e) => setH(Number(e.target.value) || 24)} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
              Corner radius
              <input type="number" className="prop-input" value={radius} min={0} max={20} onChange={(e) => setRadius(Number(e.target.value) || 0)} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
              Fill
              <input type="color" value={fill} onChange={(e) => setFill(e.target.value)} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
              Border
              <input type="color" value={stroke} onChange={(e) => setStroke(e.target.value)} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
              Border width
              <input type="number" className="prop-input" value={strokeW} min={1} max={10} onChange={(e) => setStrokeW(Number(e.target.value) || 3)} />
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={apply}>Apply to selected station</button>
        </div>
      </div>
    </div>
  );
}
