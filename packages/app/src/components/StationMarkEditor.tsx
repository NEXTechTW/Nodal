import { useState } from "react";
import { createId, type StationSymbol, type StationSymbolLayer } from "@nodal/core";
import { t } from "../i18n.js";
import { useEditor } from "../store/useEditor.js";

export function StationMarkEditor({
  symbol,
  stationId,
  onClose,
}: {
  symbol?: StationSymbol | undefined;
  stationId?: string | undefined;
  onClose: () => void;
}) {
  const uiLang = useEditor((s) => s.uiLang);
  const saveStationSymbol = useEditor((s) => s.saveStationSymbol);
  const tr = (key: string) => t(uiLang, key);

  const [name, setName] = useState(symbol?.name ?? "New mark");

  const save = () => {
    const layers: StationSymbolLayer[] = symbol?.layers?.length
      ? symbol.layers
      : [
          {
            id: createId(),
            type: "circle",
            x: 0,
            y: 0,
            width: 24,
            height: 24,
            fill: "#ffffff",
            stroke: "#111827",
            strokeWidth: 3,
            rotation: 0,
          },
        ];
    const next: StationSymbol = {
      id: symbol?.id ?? createId(),
      name: name.trim() || "Mark",
      layers,
    };
    saveStationSymbol(next, stationId);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={tr("Edit")}>
      <div className="modal-card" style={{ minWidth: 320, padding: 16, display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>{tr("Edit")}</div>
        <label style={{ display: "grid", gap: 4 }}>
          <span>{tr("Label")}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="panel-btn panel-btn-secondary" onClick={onClose}>
            {tr("Cancel")}
          </button>
          <button type="button" className="panel-btn panel-btn-primary" onClick={save}>
            {tr("Save")}
          </button>
        </div>
      </div>
    </div>
  );
}
