import { useState } from "react";
import { displayName, type Anchor, type StationKind } from "@linewright/core";
import { useEditor } from "../store/useEditor.js";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignBottomIcon,
  ChevronDownIcon,
  DuplicateIcon,
  EyeIcon,
  EyeOffIcon,
  HistoryIcon,
  LayersIcon,
  MapIcon,
  PlusIcon,
  SlidersIcon,
  SparklesIcon,
  TrashIcon,
} from "./Icons.js";

/* Preset iconic transit palettes */
const TRANSIT_PALETTE = [
  { name: "London Bakerloo", color: "#B36305" },
  { name: "London Central", color: "#E32017" },
  { name: "London District", color: "#00782A" },
  { name: "London Jubilee", color: "#A0A5A9" },
  { name: "London Northern", color: "#000000" },
  { name: "London Piccadilly", color: "#003688" },
  { name: "London Victoria", color: "#0098D4" },
  { name: "NYC Express", color: "#EE352E" },
  { name: "NYC 8th Ave", color: "#0039A6" },
  { name: "Tokyo Marunouchi", color: "#F62E36" },
  { name: "Tokyo Ginza", color: "#FF9500" },
  { name: "Tokyo Tozai", color: "#009BBF" },
  { name: "Paris M1", color: "#FFCE00" },
  { name: "Paris M4", color: "#BF0A30" },
  { name: "Taipei Bannan", color: "#0070BD" },
  { name: "Taipei Tamsui", color: "#CB2C30" },
];

/** Collapsible Accordion Section (Photoshop/Illustrator palette style) */
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`panel-section${open ? "" : " collapsed"}`}>
      <button
        type="button"
        className="panel-section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDownIcon className="chevron" />
      </button>
      {open && <div className="panel-section-body">{children}</div>}
    </div>
  );
}

/** Compact Property Row (Nodal CC standard: label left, control right) */
function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="prop-row">
      <span className="prop-label" title={label}>{label}</span>
      <div className="prop-value">{children}</div>
    </div>
  );
}

/** Left Docked Panel: Lines & History Tabs */
export function LinesPanel() {
  const [tab, setTab] = useState<"lines" | "history">("lines");
  const map = useEditor((s) => s.map);
  const stack = useEditor((s) => s.stack);
  const activeLineId = useEditor((s) => s.activeLineId);
  const setActiveLine = useEditor((s) => s.setActiveLine);
  const selectLine = useEditor((s) => s.selectLine);
  const addLine = useEditor((s) => s.addLine);
  const hiddenLineIds = useEditor((s) => s.hiddenLineIds);
  const toggleLineVisibility = useEditor((s) => s.toggleLineVisibility);

  const [name, setName] = useState("");
  const lines = Object.values(map.lines);
  const historyList = stack.history();

  return (
    <aside className="left-panel" aria-label="Lines and History">
      {/* Panel Tab Header */}
      <div className="panel-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className="panel-tab"
          aria-selected={tab === "lines"}
          onClick={() => setTab("lines")}
        >
          <LayersIcon /> Lines
        </button>
        <button
          type="button"
          role="tab"
          className="panel-tab"
          aria-selected={tab === "history"}
          onClick={() => setTab("history")}
        >
          <HistoryIcon /> History
        </button>
      </div>

      <div className="panel-content">
        {tab === "lines" ? (
          <>
            <CollapsibleSection title="Transit Lines" defaultOpen={true}>
              {lines.length === 0 ? (
                <p style={{ margin: "4px 0", fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
                  No transit lines yet. Create a line below to start connecting stations.
                </p>
              ) : (
                <div role="list" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {lines.map((l) => {
                    const isHidden = !!hiddenLineIds[l.id];
                    const isActive = l.id === activeLineId;
                    return (
                      <div
                        key={l.id}
                        className="line-item"
                        aria-current={isActive ? "true" : "false"}
                        style={{ opacity: isHidden ? 0.5 : 1 }}
                      >
                        <button
                          type="button"
                          className="btn btn-tool icon-btn"
                          style={{ width: 20, height: 20, padding: 0 }}
                          aria-label={isHidden ? "Show line" : "Hide line"}
                          title={isHidden ? "Show line" : "Hide line"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLineVisibility(l.id);
                          }}
                        >
                          {isHidden ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                        <span
                          className="line-swatch"
                          style={{ background: l.color }}
                          aria-hidden="true"
                        />
                        <span
                          className="line-name"
                          onClick={() => {
                            setActiveLine(l.id);
                            selectLine(l.id);
                          }}
                        >
                          {displayName(l.name, "Line")}
                        </span>
                        <span className="line-badge" title="Number of connected segments">
                          {l.segments.length}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Line Form */}
              <form
                style={{ display: "flex", gap: 4, marginTop: 8 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (name.trim()) {
                    addLine(name.trim());
                    setName("");
                  }
                }}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="New line name..."
                  className="prop-input"
                  aria-label="New line name"
                />
                <button type="submit" className="btn btn-primary btn-sm" aria-label="Add line">
                  <PlusIcon /> Add
                </button>
              </form>
            </CollapsibleSection>

            {/* Transit Swatch Presets */}
            <CollapsibleSection title="Quick Swatches" defaultOpen={true}>
              <div style={{ fontSize: "var(--text-11)", color: "var(--color-text-secondary)", marginBottom: 4 }}>
                Global transit palette standards:
              </div>
              <div className="swatch-palette">
                {TRANSIT_PALETTE.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="swatch-chip"
                    style={{ background: p.color }}
                    title={`${p.name} (${p.color})`}
                    onClick={() => {
                      if (activeLineId) {
                        useEditor.getState().setLineColor(activeLineId, p.color);
                      } else {
                        addLine(p.name);
                      }
                    }}
                  />
                ))}
              </div>
            </CollapsibleSection>
          </>
        ) : (
          <CollapsibleSection title="Action Stack" defaultOpen={true}>
            <div className="history-list">
              {historyList.length === 0 ? (
                <div style={{ padding: "8px", fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
                  Initial document state
                </div>
              ) : (
                historyList.map((action, idx) => (
                  <div
                    key={idx}
                    className={`history-item ${idx === 0 ? "active" : ""}`}
                  >
                    <span className="history-dot" />
                    <span>{action}</span>
                    {idx === 0 && (
                      <span style={{ marginLeft: "auto", fontSize: "var(--text-10)", color: "var(--color-accent)" }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{ flex: 1 }}
                disabled={!stack.canUndo}
                onClick={() => useEditor.getState().undo()}
              >
                Undo (Ctrl+Z)
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ flex: 1 }}
                disabled={!stack.canRedo}
                onClick={() => useEditor.getState().redo()}
              >
                Redo (Ctrl+Shift+Z)
              </button>
            </div>
          </CollapsibleSection>
        )}
      </div>
    </aside>
  );
}

const ANCHOR_MATRIX: (Anchor | null)[][] = [
  ["NW", "N", "NE"],
  ["W", null, "E"],
  ["SW", "S", "SE"],
];

const STATION_KINDS: { value: StationKind; label: string }[] = [
  { value: "normal", label: "Normal Stop" },
  { value: "interchange", label: "Interchange Ring" },
  { value: "terminus", label: "Terminus Square" },
];

/** Right Docked Panel: Properties, Map Appearance, Alignment */
export function PropertiesPanel() {
  const [tab, setTab] = useState<"props" | "map" | "align">("props");
  const map = useEditor((s) => s.map);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const selectedLineId = useEditor((s) => s.selectedLineId);
  const renameStation = useEditor((s) => s.renameStation);
  const setStationKind = useEditor((s) => s.setStationKind);
  const setStationAnchor = useEditor((s) => s.setStationAnchor);
  const setStationPosition = useEditor((s) => s.setStationPosition);
  const setStationRotation = useEditor((s) => s.setStationRotation);
  const setStationLabelOffset = useEditor((s) => s.setStationLabelOffset);
  const deleteSelectedStation = useEditor((s) => s.deleteSelectedStation);
  const duplicateStation = useEditor((s) => s.duplicateStation);

  const renameLine = useEditor((s) => s.renameLine);
  const setLineColor = useEditor((s) => s.setLineColor);
  const setLineStyle = useEditor((s) => s.setLineStyle);
  const setLineWidth = useEditor((s) => s.setLineWidth);
  const deleteLine = useEditor((s) => s.deleteLine);

  const setMapBackground = useEditor((s) => s.setMapBackground);
  const setFontSize = useEditor((s) => s.setFontSize);
  const setFontFamily = useEditor((s) => s.setFontFamily);
  const setLabelColor = useEditor((s) => s.setLabelColor);
  const setFontWeight = useEditor((s) => s.setFontWeight);
  const setFontStyle = useEditor((s) => s.setFontStyle);
  const setTextTransform = useEditor((s) => s.setTextTransform);
  const setLetterSpacing = useEditor((s) => s.setLetterSpacing);
  const setStationRadius = useEditor((s) => s.setStationRadius);
  const setGridStep = useEditor((s) => s.setGridStep);
  const cornerRadius = useEditor((s) => s.cornerRadius);
  const setCornerRadius = useEditor((s) => s.setCornerRadius);
  const setLabelLanguage = useEditor((s) => s.setLabelLanguage);
  const avoidLabelOverlaps = useEditor((s) => s.avoidLabelOverlaps);

  const bilingualLabels = useEditor((s) => s.bilingualLabels);
  const toggleBilingual = useEditor((s) => s.toggleBilingual);
  const showTransferBadges = useEditor((s) => s.showTransferBadges);
  const toggleTransferBadges = useEditor((s) => s.toggleTransferBadges);
  const showDPad = useEditor((s) => s.showDPad);
  const toggleDPad = useEditor((s) => s.toggleDPad);
  const copyStationAttrs = useEditor((s) => s.copyStationAttrs);
  const pasteStationAttrs = useEditor((s) => s.pasteStationAttrs);
  const autoEnglishName = useEditor((s) => s.autoEnglishName);
  const copiedStationAttrs = useEditor((s) => s.copiedStationAttrs);

  const station = selectedStationId ? map.stations[selectedStationId] : undefined;
  const line = selectedLineId ? map.lines[selectedLineId] : undefined;

  return (
    <aside className="right-panel" aria-label="Properties and Appearance">
      {/* Panel Tabs */}
      <div className="panel-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className="panel-tab"
          aria-selected={tab === "props"}
          onClick={() => setTab("props")}
        >
          <SlidersIcon /> Properties
        </button>
        <button
          type="button"
          role="tab"
          className="panel-tab"
          aria-selected={tab === "map"}
          onClick={() => setTab("map")}
        >
          <MapIcon /> Appearance
        </button>
        <button
          type="button"
          role="tab"
          className="panel-tab"
          aria-selected={tab === "align"}
          onClick={() => setTab("align")}
        >
          <AlignCenterIcon /> Align
        </button>
      </div>

      <div className="panel-content">
        {tab === "props" && (
          <>
            {station && (
              <>
                <CollapsibleSection title="Station Identity" defaultOpen={true}>
                  <PropRow label="站名（主）">
                    <input
                      type="text"
                      className="prop-input"
                      value={station.name["en"] ?? ""}
                      onChange={(e) => renameStation(station.id, e.target.value, "en")}
                    />
                  </PropRow>
                  <PropRow label="副站名">
                    <input
                      type="text"
                      className="prop-input"
                      placeholder="Optional station name"
                      value={station.name["zh-TW"] ?? ""}
                      onChange={(e) => renameStation(station.id, e.target.value, "zh-TW")}
                    />
                    {(station.name["zh-TW"] || station.name["zh"]) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-tool"
                        title="Auto-translate / romanize Chinese to English (RMP style)"
                        onClick={() => autoEnglishName(station.id)}
                      >
                        <SparklesIcon />
                      </button>
                    )}
                  </PropRow>
                  <PropRow label="Symbol">
                    <select
                      className="prop-input"
                      value={station.kind}
                      onChange={(e) => setStationKind(station.id, e.target.value as StationKind)}
                    >
                      {STATION_KINDS.map((k) => (
                        <option key={k.value} value={k.value}>{k.label}</option>
                      ))}
                    </select>
                  </PropRow>
                </CollapsibleSection>

                <CollapsibleSection title="Transform & Position" defaultOpen={true}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 4 }}>
                    <PropRow label="X">
                      <input
                        type="number"
                        className="prop-input"
                        step={10}
                        value={Math.round(station.position.x)}
                        onChange={(e) => setStationPosition(station.id, { x: Number(e.target.value) || 0, y: station.position.y })}
                      />
                    </PropRow>
                    <PropRow label="Y">
                      <input
                        type="number"
                        className="prop-input"
                        step={10}
                        value={Math.round(station.position.y)}
                        onChange={(e) => setStationPosition(station.id, { x: station.position.x, y: Number(e.target.value) || 0 })}
                      />
                    </PropRow>
                  </div>

                  <PropRow label="Rotate">
                    <input
                      type="range"
                      min={0}
                      max={345}
                      step={15}
                      className="prop-slider"
                      value={station.rotation ?? 0}
                      onChange={(e) => setStationRotation(station.id, Number(e.target.value))}
                    />
                    <span style={{ fontSize: "var(--text-11)", fontFamily: "var(--font-mono)", width: 34, textAlign: "right" }}>
                      {station.rotation ?? 0}°
                    </span>
                  </PropRow>

                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => duplicateStation(station.id)}
                    >
                      <DuplicateIcon /> Duplicate (Ctrl+D)
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={deleteSelectedStation}
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-tool btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => copyStationAttrs(station.id)}
                      title="Copy style attributes from this station"
                    >
                      Copy Style
                    </button>
                    <button
                      type="button"
                      className="btn btn-tool btn-sm"
                      style={{ flex: 1 }}
                      disabled={!copiedStationAttrs}
                      onClick={() => pasteStationAttrs(station.id)}
                      title="Paste copied station style"
                    >
                      Paste Style
                    </button>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Label Placement" defaultOpen={true}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span className="prop-label">Anchor</span>
                    <div className="anchor-grid">
                      {ANCHOR_MATRIX.map((row, rIdx) =>
                        row.map((cell, cIdx) => (
                          <button
                            key={`${rIdx}-${cIdx}`}
                            type="button"
                            className="anchor-btn"
                            disabled={!cell}
                            aria-pressed={cell === station.labelAnchor}
                            onClick={() => cell && setStationAnchor(station.id, cell)}
                            title={cell ? `Anchor ${cell}` : undefined}
                          >
                            {cell ?? "•"}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <PropRow label="Nudge X">
                      <input
                        type="number"
                        className="prop-input"
                        value={station.labelOffset?.x ?? 0}
                        onChange={(e) => setStationLabelOffset(station.id, { x: Number(e.target.value) || 0, y: station.labelOffset?.y ?? 0 })}
                      />
                    </PropRow>
                    <PropRow label="Nudge Y">
                      <input
                        type="number"
                        className="prop-input"
                        value={station.labelOffset?.y ?? 0}
                        onChange={(e) => setStationLabelOffset(station.id, { x: station.labelOffset?.x ?? 0, y: Number(e.target.value) || 0 })}
                      />
                    </PropRow>
                  </div>
                </CollapsibleSection>
              </>
            )}

            {line && (
              <>
                <CollapsibleSection title="Line Properties" defaultOpen={true}>
                  <PropRow label="Name">
                    <input
                      type="text"
                      className="prop-input"
                      value={line.name["en"] ?? ""}
                      onChange={(e) => renameLine(line.id, e.target.value, "en")}
                    />
                  </PropRow>
                  <PropRow label="Color">
                    <input
                      type="color"
                      value={line.color}
                      onChange={(e) => setLineColor(line.id, e.target.value)}
                      style={{ width: 28, height: 22, border: "none", cursor: "pointer", background: "none" }}
                    />
                    <input
                      type="text"
                      className="prop-input"
                      value={line.color.toUpperCase()}
                      onChange={(e) => setLineColor(line.id, e.target.value)}
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                  </PropRow>

                  <div className="swatch-palette">
                    {TRANSIT_PALETTE.slice(0, 8).map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        className="swatch-chip"
                        style={{ background: p.color }}
                        title={p.name}
                        onClick={() => setLineColor(line.id, p.color)}
                      />
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Stroke & Styling" defaultOpen={true}>
                  <PropRow label="Style">
                    <select
                      className="prop-input"
                      value={line.style}
                      onChange={(e) => setLineStyle(line.id, e.target.value as "solid" | "dashed" | "double")}
                    >
                      <option value="solid">Solid Track</option>
                      <option value="dashed">Under Construction / Dashed</option>
                      <option value="double">High Speed / Double</option>
                    </select>
                  </PropRow>

                  <PropRow label="Width">
                    <input
                      type="range"
                      min={3}
                      max={24}
                      step={1}
                      className="prop-slider"
                      value={line.width ?? 8}
                      onChange={(e) => setLineWidth(line.id, Number(e.target.value) || 8)}
                    />
                    <span style={{ fontSize: "var(--text-11)", fontFamily: "var(--font-mono)", width: 28, textAlign: "right" }}>
                      {line.width ?? 8}px
                    </span>
                  </PropRow>

                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ width: "100%" }}
                      onClick={() => deleteLine(line.id)}
                    >
                      <TrashIcon /> Delete Line
                    </button>
                  </div>
                </CollapsibleSection>
              </>
            )}

            {!station && !line && (
              <div style={{ padding: "16px 12px", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: "var(--text-13)", fontWeight: 600 }}>
                  No Selection
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
                  Click a station or select a transit line on the canvas to inspect and edit its properties.
                </p>
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, textAlign: "left", fontSize: "var(--text-11)", color: "var(--color-text-secondary)" }}>
                  <div><kbd>V</kbd> Select tool</div>
                  <div><kbd>A</kbd> Add new station</div>
                  <div><kbd>C</kbd> Connect stations into line</div>
                  <div><kbd>H</kbd> Hand tool for panning</div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "map" && (
          <>
            <CollapsibleSection title="Map Template" defaultOpen={true}>
              <p style={{ margin: "0 0 8px", fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
                Upload a template JSON (see docs/TEMPLATES.md). It restyles background and line colours without moving stations.
              </p>
              <label className="btn btn-sm" style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}>
                Upload template…
                <input
                  type="file"
                  accept="application/json,.json"
                  aria-label="Upload template JSON"
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    try {
                      const { validateTemplate, applyTemplate } = await import("@linewright/core");
                      const parsed = JSON.parse(await f.text());
                      const issues = validateTemplate(parsed);
                      if (issues.length) {
                        useEditor.getState().setError(`Template invalid: ${issues[0]}. See docs/TEMPLATES.md.`);
                        return;
                      }
                      const next = applyTemplate(useEditor.getState().map, parsed);
                      useEditor.getState().loadMap(next);
                      useEditor.getState().setToast(`Template applied: ${parsed.name}`);
                    } catch {
                      useEditor.getState().setError("Unable to read that template. Choose a .json file like docs/TEMPLATES.md and try again.");
                    }
                  }}
                />
              </label>
            </CollapsibleSection>
            <CollapsibleSection title="Map & Canvas" defaultOpen={true}>
              <PropRow label="Background">
                <input
                  type="color"
                  value={map.style.background}
                  onChange={(e) => setMapBackground(e.target.value)}
                  style={{ width: 28, height: 22, border: "none", cursor: "pointer", background: "none" }}
                />
                <input
                  type="text"
                  className="prop-input"
                  value={map.style.background.toUpperCase()}
                  onChange={(e) => setMapBackground(e.target.value)}
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </PropRow>

              <PropRow label="Grid Step">
                <input
                  type="range"
                  min={10}
                  max={80}
                  step={5}
                  className="prop-slider"
                  value={map.style.gridStep}
                  onChange={(e) => setGridStep(Number(e.target.value) || 20)}
                />
                <span style={{ fontSize: "var(--text-11)", fontFamily: "var(--font-mono)", width: 28, textAlign: "right" }}>
                  {map.style.gridStep}
                </span>
              </PropRow>

              <PropRow label="Corner Rad">
                <input
                  type="range"
                  min={0}
                  max={45}
                  step={1}
                  className="prop-slider"
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(Number(e.target.value) || 0)}
                />
                <span style={{ fontSize: "var(--text-11)", fontFamily: "var(--font-mono)", width: 28, textAlign: "right" }}>
                  {cornerRadius}px
                </span>
              </PropRow>
            </CollapsibleSection>

            <CollapsibleSection title="Typography & Dimensions" defaultOpen={true}>
              <PropRow label="Station Size">
                <input
                  type="range"
                  min={3}
                  max={16}
                  step={1}
                  className="prop-slider"
                  value={map.style.stationRadius}
                  onChange={(e) => setStationRadius(Number(e.target.value) || 6)}
                />
                <span style={{ fontSize: "var(--text-11)", fontFamily: "var(--font-mono)", width: 28, textAlign: "right" }}>
                  {map.style.stationRadius}px
                </span>
              </PropRow>

              <PropRow label="Font Size">
                <input
                  type="range"
                  min={8}
                  max={24}
                  step={1}
                  className="prop-slider"
                  value={map.style.fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value) || 12)}
                />
                <span style={{ fontSize: "var(--text-11)", fontFamily: "var(--font-mono)", width: 28, textAlign: "right" }}>
                  {map.style.fontSize}pt
                </span>
              </PropRow>

              <PropRow label="Language">
                <select
                  className="prop-input"
                  value={map.style.labelLanguage ?? "en"}
                  onChange={(e) => setLabelLanguage(e.target.value)}
                >
                  <option value="en">English Primary</option>
                  <option value="zh-TW">繁體中文 Primary</option>
                  <option value="ja">日本語 Primary</option>
                </select>
              </PropRow>

              <PropRow label="Font">
                <select
                  className="prop-input"
                  value={map.style.fontFamily ?? "Noto Sans, sans-serif"}
                  onChange={(e) => setFontFamily(e.target.value)}
                >
                  <option value="Anton, sans-serif">Anton</option>
                  <option value="Archivo, sans-serif">Archivo</option>
                  <option value="Barlow, sans-serif">Barlow</option>
                  <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                  <option value="'Fira Sans', sans-serif">Fira Sans</option>
                  <option value="'IBM Plex Sans', sans-serif">IBM Plex Sans</option>
                  <option value="'IBM Plex Mono', monospace">IBM Plex Mono</option>
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                  <option value="Karla, sans-serif">Karla</option>
                  <option value="Lato, sans-serif">Lato</option>
                  <option value="Manrope, sans-serif">Manrope</option>
                  <option value="Merriweather, serif">Merriweather</option>
                  <option value="Montserrat, sans-serif">Montserrat</option>
                  <option value="Mulish, sans-serif">Mulish</option>
                  <option value="Noto Sans, sans-serif">Noto Sans</option>
                  <option value="'Noto Sans JP', sans-serif">Noto Sans JP</option>
                  <option value="'Noto Sans SC', sans-serif">Noto Sans SC</option>
                  <option value="'Noto Sans TC', 'Noto Sans', sans-serif">Noto Sans TC</option>
                  <option value="'Noto Serif SC', serif">Noto Serif SC</option>
                  <option value="Nunito, sans-serif">Nunito</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="Oswald, sans-serif">Oswald</option>
                  <option value="'Playfair Display', serif">Playfair Display</option>
                  <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                  <option value="Poppins, sans-serif">Poppins</option>
                  <option value="'Public Sans', sans-serif">Public Sans</option>
                  <option value="Quicksand, sans-serif">Quicksand</option>
                  <option value="Raleway, sans-serif">Raleway</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="Rubik, sans-serif">Rubik</option>
                  <option value="'Source Sans 3', sans-serif">Source Sans 3</option>
                  <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                  <option value="Ubuntu, sans-serif">Ubuntu</option>
                  <option value="'Work Sans', sans-serif">Work Sans</option>
                  <option value="system-ui, sans-serif">System</option>
                  <option value="Georgia, serif">Georgia (serif)</option>
                </select>
              </PropRow>

              <PropRow label="Text color">
                <input
                  type="color"
                  value={map.style.labelColor ?? "#000000"}
                  onChange={(e) => setLabelColor(e.target.value)}
                  aria-label="Label text color"
                />
              </PropRow>

              <PropRow label="Weight">
                <select className="prop-input" value={String(map.style.fontWeight ?? 500)}
                  onChange={(e) => setFontWeight(Number(e.target.value))}>
                  <option value="400">Normal (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-bold (600)</option>
                  <option value="700">Bold (700)</option>
                </select>
              </PropRow>

              <PropRow label="Style">
                <select className="prop-input" value={map.style.fontStyle ?? "normal"}
                  onChange={(e) => setFontStyle(e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </PropRow>

              <PropRow label="Case">
                <select className="prop-input" value={map.style.textTransform ?? "none"}
                  onChange={(e) => setTextTransform(e.target.value)}>
                  <option value="none">None</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                </select>
              </PropRow>

              <PropRow label="Tracking">
                <input type="number" className="prop-input" min={-2} max={8} step={0.5}
                  value={map.style.letterSpacing ?? 0}
                  onChange={(e) => setLetterSpacing(Number(e.target.value) || 0)} />
              </PropRow>

              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ width: "100%" }}
                  onClick={avoidLabelOverlaps}
                >
                  <SparklesIcon /> Auto-Resolve Label Overlaps
                </button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Transit Diagram Features" defaultOpen={true}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-12)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={bilingualLabels}
                    onChange={toggleBilingual}
                  />
                  <span>Bilingual Dual Labels (中文 + EN)</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-12)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showTransferBadges}
                    onChange={toggleTransferBadges}
                  />
                  <span>Transfer Line Route Badges</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-12)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showDPad}
                    onChange={toggleDPad}
                  />
                  <span>Canvas D-Pad Controller</span>
                </label>
              </div>
            </CollapsibleSection>
          </>
        )}

        {tab === "align" && (
          <CollapsibleSection title="Alignment Tools" defaultOpen={true}>
            <div style={{ fontSize: "var(--text-11)", color: "var(--color-text-secondary)", marginBottom: 10 }}>
              Align and distribute stations to schematic transit grid lines:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
              <button
                type="button"
                className="btn btn-tool"
                title="Align to Left 45°"
                onClick={() => {
                  if (station) {
                    const snapX = Math.round(station.position.x / 40) * 40;
                    setStationPosition(station.id, { x: snapX, y: station.position.y });
                  }
                }}
              >
                <AlignLeftIcon /> Left
              </button>
              <button
                type="button"
                className="btn btn-tool"
                title="Align to Center Column"
                onClick={() => {
                  if (station) {
                    const snapX = Math.round(station.position.x / 20) * 20;
                    setStationPosition(station.id, { x: snapX, y: station.position.y });
                  }
                }}
              >
                <AlignCenterIcon /> Center
              </button>
              <button
                type="button"
                className="btn btn-tool"
                title="Align to Right"
                onClick={() => {
                  if (station) {
                    const snapX = Math.ceil(station.position.x / 40) * 40;
                    setStationPosition(station.id, { x: snapX, y: station.position.y });
                  }
                }}
              >
                <AlignRightIcon /> Right
              </button>

              <button
                type="button"
                className="btn btn-tool"
                title="Align to Top Row"
                onClick={() => {
                  if (station) {
                    const snapY = Math.round(station.position.y / 40) * 40;
                    setStationPosition(station.id, { x: station.position.x, y: snapY });
                  }
                }}
              >
                <AlignTopIcon /> Top
              </button>
              <button
                type="button"
                className="btn btn-tool"
                title="Align to Middle"
                onClick={() => {
                  if (station) {
                    const snapY = Math.round(station.position.y / 20) * 20;
                    setStationPosition(station.id, { x: station.position.x, y: snapY });
                  }
                }}
              >
                <AlignCenterIcon /> Middle
              </button>
              <button
                type="button"
                className="btn btn-tool"
                title="Align to Bottom"
                onClick={() => {
                  if (station) {
                    const snapY = Math.ceil(station.position.y / 40) * 40;
                    setStationPosition(station.id, { x: station.position.x, y: snapY });
                  }
                }}
              >
                <AlignBottomIcon /> Bottom
              </button>
            </div>

            <div style={{ padding: "8px", background: "var(--color-bg-inset)", borderRadius: "var(--radius-1)", fontSize: "var(--text-11)", color: "var(--color-text-secondary)" }}>
              Tip: Press <kbd>Shift</kbd> while dragging any station to restrict motion to 0°, 45°, or 90° angles.
            </div>
          </CollapsibleSection>
        )}
      </div>
    </aside>
  );
}
