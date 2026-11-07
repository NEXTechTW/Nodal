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
  const cornerRadius = useEditor((s) => s.cornerRadius);
  const setCornerRadius = useEditor((s) => s.setCornerRadius);
  const setLabelLanguage = useEditor((s) => s.setLabelLanguage);
  const avoidLabelOverlaps = useEditor((s) => s.avoidLabelOverlaps);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftZh, setDraftZh] = useState<string | null>(null);

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
          <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-12)", color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
            Position {station.position.x.toFixed(0)}, {station.position.y.toFixed(0)}
          </p>
          <button type="button" className="btn btn-danger" onClick={deleteSelectedStation}>
            <TrashIcon /> Delete station
          </button>
        </div>
      )}

      {line && (
        <div className="panel-section">
          <h2 className="panel-heading">Line</h2>
          <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-14)", fontWeight: 600 }}>
            {displayName(line.name, "Line")}
          </p>
          <div className="field">
            <label htmlFor="line-color">Color</label>
            <input id="line-color" type="color" value={line.color} onChange={(e) => setLineColor(line.id, e.target.value)} />
          </div>
          <p style={{ margin: 0, fontSize: "var(--text-12)", color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
            {line.segments.length} segment{line.segments.length === 1 ? "" : "s"}
          </p>
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
