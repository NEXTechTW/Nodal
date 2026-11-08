import { useState } from "react";
import { useEditor } from "../store/useEditor.js";

/** Standalone station-mark designer — a big professional editor window. */
export function MarkDesigner({ onClose }: { onClose: () => void }) {
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const setStationKind = useEditor((s) => s.setStationKind);
  const setStationRadius = useEditor((s) => s.setStationRadius);
  const map = useEditor((s) => s.map);
  const setToast = useEditor((s) => s.setToast);

  const station = selectedStationId ? map.stations[selectedStationId] : undefined;
  const [code, setCode] = useState("R03");
  const [w, setW] = useState(64);
  const [h, setH] = useState(44);
  const [radius, setRadius] = useState(10);
  const [fill, setFill] = useState("#ffffff");
  const [stroke, setStroke] = useState("#E00034");
  const [strokeW, setStrokeW] = useState(4);
  const [rot, setRot] = useState(0);

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
      <div className="mark-editor">
        <div className="mark-editor-head">
          <div>
            <h2 id="mark-title" className="mark-editor-title">Station Mark Editor</h2>
            <p className="mark-editor-sub">Nodal Mark Designer — rectangle properties and code. Applies to the selected station.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" className="btn btn-sm" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={apply}>Apply mark</button>
          </div>
        </div>

        <div className="mark-editor-body">
          <div className="mark-editor-canvas">
            <svg width="100%" height="300" viewBox="0 0 400 300" aria-label="Mark preview">
              <rect x={0} y={0} width={400} height={300} fill="var(--color-bg)" />
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2={300} stroke="var(--color-border)" strokeWidth={0.5} />
              ))}
              {Array.from({ length: 16 }).map((_, i) => (
                <line key={`h${i}`} x1={0} y1={i * 20} x2={400} y2={i * 20} stroke="var(--color-border)" strokeWidth={0.5} />
              ))}
              <g transform={`rotate(${rot} 200 150)`}>
                <rect x={200 - w / 2} y={150 - h / 2} width={w} height={h} rx={radius} fill={fill} stroke={stroke} strokeWidth={strokeW} />
                <text x={200} y={155} textAnchor="middle" fontSize="16" fill={stroke} fontFamily="monospace" fontWeight={700} dominantBaseline="middle">{code}</text>
              </g>
            </svg>
            <p className="mark-editor-canvas-note">Live preview — edit properties on the right.</p>
          </div>

          <aside className="mark-editor-props" aria-label="Mark properties">
            <section>
              <h3 className="mark-section-title">Geometry</h3>
              <label className="mark-field">Width
                <input type="number" className="prop-input" value={w} min={16} max={160} onChange={(e) => setW(Number(e.target.value) || 64)} />
              </label>
              <label className="mark-field">Height
                <input type="number" className="prop-input" value={h} min={16} max={120} onChange={(e) => setH(Number(e.target.value) || 44)} />
              </label>
              <label className="mark-field">Corner radius
                <input type="number" className="prop-input" value={radius} min={0} max={40} onChange={(e) => setRadius(Number(e.target.value) || 0)} />
              </label>
              <label className="mark-field">Rotation (°)
                <input type="range" className="prop-slider" value={rot} min={-180} max={180} step={15} onChange={(e) => setRot(Number(e.target.value))} />
              </label>
            </section>
            <section>
              <h3 className="mark-section-title">Style</h3>
              <label className="mark-field">Fill
                <input type="color" value={fill} onChange={(e) => setFill(e.target.value)} />
              </label>
              <label className="mark-field">Border
                <input type="color" value={stroke} onChange={(e) => setStroke(e.target.value)} />
              </label>
              <label className="mark-field">Border width
                <input type="number" className="prop-input" value={strokeW} min={1} max={12} onChange={(e) => setStrokeW(Number(e.target.value) || 4)} />
              </label>
              <label className="mark-field">Code
                <input className="prop-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))} />
              </label>
            </section>
            <p className="mark-editor-foot">
              {station ? `Applying to: ${station.name.en ?? station.id}` : "No station selected — select one on the canvas first."}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
