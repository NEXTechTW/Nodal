import { useState } from "react";
import { displayName, type Anchor, type StationKind } from "@linewright/core";
import { useEditor } from "../store/useEditor.js";
import { PlusIcon, TrashIcon } from "./Icons.js";

export function LinesPanel() {
  const map = useEditor((s) => s.map);
  const activeLineId = useEditor((s) => s.activeLineId);
  const setActiveLine = useEditor((s) => s.setActiveLine);
  const selectLine = useEditor((s) => s.selectLine);
  const addLine = useEditor((s) => s.addLine);
  const [name, setName] = useState("");

  const lines = Object.values(map.lines);
  const stations = Object.keys(map.stations).length;

  return (
    <aside className="left-panel" aria-label="Lines">
      <div className="panel-section">
        <h2 className="panel-heading">Lines</h2>
        {lines.length === 0 ? (
          <p style={{ margin: 0, fontSize: "var(--text-13)", color: "var(--color-text-secondary)" }}>
            No lines yet. Add a line, then drag between stations to connect them.
          </p>
        ) : (
          <div role="list" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {lines.map((l) => (
              <button
                key={l.id}
                type="button"
                className="line-item"
                aria-current={l.id === activeLineId ? "true" : "false"}
                onClick={() => { setActiveLine(l.id); selectLine(l.id); }}
              >
                <span className="swatch" style={{ background: l.color }} aria-hidden="true" />
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName(l.name, "Line")}
                </span>
                <span style={{ marginLeft: "auto", fontSize: "var(--text-12)", color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                  {l.segments.length}
                </span>
              </button>
            ))}
          </div>
        )}

        <form
          style={{ display: "flex", gap: 6, marginTop: "var(--space-3)" }}
          onSubmit={(e) => {
            e.preventDefault();
            const id = addLine(name.trim());
            if (id) setName("");
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Line name, e.g. Harbor Line"
            aria-label="New line name"
            style={{ flex: 1, minWidth: 0, minHeight: "var(--input-h)", paddingInline: 8, border: "1px solid var(--color-border)", borderRadius: "var(--radius-3)", fontSize: "var(--text-14)" }}
          />
          <button type="submit" className="btn btn-primary" aria-label="Add line">
            <PlusIcon /> Add
          </button>
        </form>
        <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
          {stations === 0 ? "Add a station on the canvas first." : `${stations} station${stations === 1 ? "" : "s"} on the map.`}
        </p>
      </div>
    </aside>
  );
}

const ANCHORS: Anchor[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const KINDS: { value: StationKind; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "interchange", label: "Interchange (ring)" },
  { value: "terminus", label: "Terminus (square)" },
];

export function PropertiesPanel() {
  const map = useEditor((s) => s.map);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const selectedLineId = useEditor((s) => s.selectedLineId);
  const renameStation = useEditor((s) => s.renameStation);
  const setStationKind = useEditor((s) => s.setStationKind);
  const setStationAnchor = useEditor((s) => s.setStationAnchor);
  const deleteSelectedStation = useEditor((s) => s.deleteSelectedStation);
  const setLineColor = useEditor((s) => s.setLineColor);
  const renameLine = useEditor((s) => s.renameLine);
  const setLineStyle = useEditor((s) => s.setLineStyle);
  const setLineWidth = useEditor((s) => s.setLineWidth);
  const deleteLine = useEditor((s) => s.deleteLine);
  const setMapBackground = useEditor((s) => s.setMapBackground);
  const setStationPosition = useEditor((s) => s.setStationPosition);
  const setStationRotation = useEditor((s) => s.setStationRotation);
  const setStationLabelOffset = useEditor((s) => s.setStationLabelOffset);
  const setFontSize = useEditor((s) => s.setFontSize);
  const setStationRadius = useEditor((s) => s.setStationRadius);
  const setGridStep = useEditor((s) => s.setGridStep);
  const cornerRadius = useEditor((s) => s.cornerRadius);
  const setCornerRadius = useEditor((s) => s.setCornerRadius);
  const setLabelLanguage = useEditor((s) => s.setLabelLanguage);
  const avoidLabelOverlaps = useEditor((s) => s.avoidLabelOverlaps);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftZh, setDraftZh] = useState<string | null>(null);
  const [draftLineName, setDraftLineName] = useState<string | null>(null);

  const station = selectedStationId ? map.stations[selectedStationId] : undefined;
  const line = selectedLineId ? map.lines[selectedLineId] : undefined;

  return (
    <aside className="right-panel" aria-label="Properties">
      <div className="panel-section">
        <h2 className="panel-heading">Map</h2>
        <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-13)", color: "var(--color-text-secondary)" }}>
          {Object.keys(map.stations).length} stations · {Object.keys(map.lines).length} lines
        </p>
        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="corner">Corner radius</label>
          <input id="corner" type="number" min={0} max={60} step={1} value={cornerRadius}
            onChange={(e) => setCornerRadius(Math.max(0, Math.min(60, Number(e.target.value) || 0)))} />
        </div>
        <div className="field">
          <label htmlFor="label-lang">Label language</label>
          <select id="label-lang" value={map.style.labelLanguage} onChange={(e) => setLabelLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="zh-TW">繁體中文</option>
            <option value="ja">Japanese</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="map-bg">Background</label>
          <input id="map-bg" type="color" value={map.style.background} onChange={(e) => setMapBackground(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="map-font">Label size</label>
          <input id="map-font" type="number" min={8} max={32} step={1} value={map.style.fontSize}
            onChange={(e) => setFontSize(Number(e.target.value) || map.style.fontSize)} />
        </div>
        <div className="field">
          <label htmlFor="map-station">Station size</label>
          <input id="map-station" type="number" min={3} max={16} step={1} value={map.style.stationRadius}
            onChange={(e) => setStationRadius(Number(e.target.value) || map.style.stationRadius)} />
        </div>
        <div className="field">
          <label htmlFor="map-grid">Grid step</label>
          <input id="map-grid" type="number" min={10} max={120} step={5} value={map.style.gridStep}
            onChange={(e) => setGridStep(Number(e.target.value) || map.style.gridStep)} />
        </div>
        <button type="button" className="btn" onClick={avoidLabelOverlaps} style={{ width: "100%" }}>
          Arrange labels to avoid overlap
        </button>
        <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
          Shared tracks are offset automatically. This only moves labels; you can still override each one by hand.
        </p>
      </div>

      {station && (
        <div className="panel-section">
          <h2 className="panel-heading">Station</h2>
          <div className="field">
            <label htmlFor="st-name">Name (English)</label>
            <input
              id="st-name"
              type="text"
              value={draftName ?? displayName(station.name, "")}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => {
                if (draftName !== null && draftName !== displayName(station.name, "")) {
                  renameStation(station.id, draftName.trim() || "Untitled station");
                }
                setDraftName(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            />
          </div>
          <div className="field">
            <label htmlFor="st-name-zh">Name (繁體中文, optional)</label>
            <input
              id="st-name-zh"
              type="text"
              value={draftZh ?? station.name["zh-TW"] ?? ""}
              placeholder="中央"
              onChange={(e) => setDraftZh(e.target.value)}
              onBlur={() => {
                if (draftZh !== null && (draftZh.trim() || "") !== (station.name["zh-TW"] ?? "")) {
                  renameStation(station.id, draftZh.trim(), "zh-TW");
                }
                setDraftZh(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            />
          </div>
          <div className="field">
            <label htmlFor="st-kind">Type</label>
            <select id="st-kind" value={station.kind} onChange={(e) => setStationKind(station.id, e.target.value as StationKind)}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="st-anchor">Label position</label>
            <select id="st-anchor" value={station.labelAnchor} onChange={(e) => setStationAnchor(station.id, e.target.value as Anchor)}>
              {ANCHORS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="field">
              <label htmlFor="st-x">X</label>
              <input id="st-x" type="number" step={10} value={Math.round(station.position.x)} onChange={(e) => setStationPosition(station.id, { x: Number(e.target.value) || 0, y: station.position.y })} />
            </div>
            <div className="field">
              <label htmlFor="st-y">Y</label>
              <input id="st-y" type="number" step={10} value={Math.round(station.position.y)} onChange={(e) => setStationPosition(station.id, { x: station.position.x, y: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="field">
              <label htmlFor="st-lx">Label X</label>
              <input id="st-lx" type="number" step={2} value={station.labelOffset?.x ?? 0} onChange={(e) => setStationLabelOffset(station.id, { x: Number(e.target.value) || 0, y: station.labelOffset?.y ?? 0 })} />
            </div>
            <div className="field">
              <label htmlFor="st-ly">Label Y</label>
              <input id="st-ly" type="number" step={2} value={station.labelOffset?.y ?? 0} onChange={(e) => setStationLabelOffset(station.id, { x: station.labelOffset?.x ?? 0, y: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="st-rot">Rotation (°)</label>
            <input id="st-rot" type="number" min={0} max={359} step={15} value={station.rotation ?? 0} onChange={(e) => setStationRotation(station.id, Number(e.target.value) || 0)} />
          </div>
          <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-12)", color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
            Position {station.position.x.toFixed(0)}, {station.position.y.toFixed(0)} · {station.rotation ?? 0}°
          </p>
          <button type="button" className="btn btn-danger" onClick={deleteSelectedStation}>
            <TrashIcon /> Delete station
          </button>
        </div>
      )}

      {line && (
        <div className="panel-section">
          <h2 className="panel-heading">Line</h2>
          <div className="field">
            <label htmlFor="line-name">Name (English)</label>
            <input
              id="line-name"
              type="text"
              value={draftLineName ?? displayName(line.name, "")}
              onChange={(e) => setDraftLineName(e.target.value)}
              onBlur={() => {
                if (draftLineName !== null && draftLineName !== displayName(line.name, "")) {
                  renameLine(line.id, draftLineName.trim() || "Untitled line");
                }
                setDraftLineName(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            />
          </div>
          <div className="field">
            <label htmlFor="line-color">Color</label>
            <input id="line-color" type="color" value={line.color} onChange={(e) => setLineColor(line.id, e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="line-style">Style</label>
            <select id="line-style" value={line.style} onChange={(e) => setLineStyle(line.id, e.target.value as "solid" | "dashed" | "double")}>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="double">Double</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="line-width">Width</label>
            <input id="line-width" type="number" min={3} max={24} step={1} value={line.width ?? 8}
              onChange={(e) => setLineWidth(line.id, Math.min(24, Math.max(3, Number(e.target.value) || 8)))} />
          </div>
          <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-12)", color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
            {line.segments.length} segment{line.segments.length === 1 ? "" : "s"}
          </p>
          <button type="button" className="btn btn-danger" onClick={() => deleteLine(line.id)}>
            <TrashIcon /> Delete line
          </button>
        </div>
      )}

      {!station && !line && (
        <div className="panel-section">
          <h2 className="panel-heading">Selection</h2>
          <p style={{ margin: 0, fontSize: "var(--text-13)", color: "var(--color-text-secondary)" }}>
            Select a station or line on the canvas to edit its properties.
          </p>
          <ul style={{ margin: "var(--space-3) 0 0", paddingLeft: 18, fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
            <li>Shortcuts: V select · A add · C connect · H pan</li>
            <li>Delete removes the selected station</li>
            <li>Scroll zooms to the cursor</li>
          </ul>
        </div>
      )}
    </aside>
  );
}
