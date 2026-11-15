import { useState } from "react";
import { displayName, type Anchor, type StationKind } from "@nodal/core";
import { t } from "../i18n.js";
import { TRANSIT_PALETTE } from "../palette.js";
import { useEditor } from "../store/useEditor.js";
import { StationMarkEditor } from "./StationMarkEditor.js";
import { StationSymbolArtwork } from "./StationSymbolArtwork.js";
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

/** Collapsible section. */
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
  const uiLang = useEditor((s) => s.uiLang);
  const tr = (k: string) => t(uiLang, k);

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
          <LayersIcon /> <span className="panel-tab-label">{tr("TabLines")}</span>
        </button>
        <button
          type="button"
          role="tab"
          className="panel-tab"
          aria-selected={tab === "history"}
          onClick={() => setTab("history")}
        >
          <HistoryIcon /> <span className="panel-tab-label">{tr("TabHistory")}</span>
        </button>
      </div>

      <div className="panel-content">
        {tab === "lines" ? (
          <>
            <CollapsibleSection title={tr("TransitLines")} defaultOpen={true}>
              {lines.length === 0 ? (
                <p style={{ margin: "4px 0", fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
                  {tr("NoLinesYet")}
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
                          {displayName(l.name, tr("Line"))}
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
                  placeholder={tr("NewLineName")}
                  className="prop-input"
                  aria-label={tr("NewLineName")}
                />
                <button type="submit" className="btn btn-primary btn-sm" aria-label={tr("AddLine")}>
                  <PlusIcon /> {tr("AddLine")}
                </button>
              </form>
            </CollapsibleSection>

            {/* Transit Swatch Presets */}
            <CollapsibleSection title={tr("QuickSwatches")} defaultOpen={true}>
              <div style={{ fontSize: "var(--text-11)", color: "var(--color-text-secondary)", marginBottom: 4 }}>
                {tr("GlobalPaletteStandards")}
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
          <CollapsibleSection title={tr("ActionStack")} defaultOpen={true}>
            <div className="history-list">
              {historyList.length === 0 ? (
                <div style={{ padding: "8px", fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
                  {tr("InitialDocState")}
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
                        {tr("CurrentState")}
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
                {tr("Undo")} (Ctrl+Z)
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ flex: 1 }}
                disabled={!stack.canRedo}
                onClick={() => useEditor.getState().redo()}
              >
                {tr("Redo")} (Ctrl+Shift+Z)
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

/** Right Docked Panel: Properties, Map Appearance, Alignment */
export function PropertiesPanel() {
  const [markEditor, setMarkEditor] = useState<{ symbolId?: string | undefined } | null>(null);
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
  const uiLang = useEditor((s) => s.uiLang);
  const tr = (k: string) => t(uiLang, k);

  const stationKinds: { value: StationKind; label: string }[] = [
    { value: "normal", label: tr("NormalStop") },
    { value: "interchange", label: tr("InterchangeRing") },
    { value: "terminus", label: tr("TerminusSquare") },
  ];

  const station = selectedStationId ? map.stations[selectedStationId] : undefined;
  const line = selectedLineId ? map.lines[selectedLineId] : undefined;

  return (
    <aside className="right-panel" aria-label="Properties and Appearance">
      {markEditor && <StationMarkEditor symbol={markEditor.symbolId ? map.stationSymbols?.[markEditor.symbolId] : undefined} stationId={station?.id} onClose={() => setMarkEditor(null)} />}
      {/* Panel Tabs */}
      <div className="panel-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className="panel-tab"
          aria-selected={tab === "props"}
          onClick={() => setTab("props")}
        >
          <SlidersIcon /> <span className="panel-tab-label">{tr("TabProperties")}</span>
        </button>
        <button
          type="button"
          role="tab"
          className="panel-tab"
          aria-selected={tab === "map"}
          onClick={() => setTab("map")}
        >
          <MapIcon /> <span className="panel-tab-label">{tr("TabAppearance")}</span>
        </button>
        <button
          type="button"
          role="tab"
          className="panel-tab"
          aria-selected={tab === "align"}
          onClick={() => setTab("align")}
        >
          <AlignCenterIcon /> <span className="panel-tab-label">{tr("TabAlign")}</span>
        </button>
      </div>

      <div className="panel-content">
        {tab === "props" && (
          <>
            {station && (
              <>
                <CollapsibleSection title={tr("StationIdentity")} defaultOpen={true}>
                  <PropRow label={tr("StationNameMain")}>
                    <input
                      type="text"
                      className="prop-input"
                      value={station.name["en"] ?? ""}
                      onChange={(e) => renameStation(station.id, e.target.value, "en")}
                    />
                  </PropRow>
                  <PropRow label={tr("StationNameSub")}>
                    <input
                      type="text"
                      className="prop-input"
                      placeholder={tr("OptionalStationName")}
                      value={station.name["zh-TW"] ?? ""}
                      onChange={(e) => renameStation(station.id, e.target.value, "zh-TW")}
                    />
                    {(station.name["zh-TW"] || station.name["zh"]) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-tool"
                        title={tr("AutoTranslateTooltip")}
                        onClick={() => autoEnglishName(station.id)}
                      >
                        <SparklesIcon />
                      </button>
                    )}
                  </PropRow>
                  <PropRow label={tr("StationSymbol")}>
                    <div className="station-symbols" role="group" aria-label={tr("StationSymbol")}>
                      {stationKinds.map((k) => (
                        <button
                          key={k.value}
                          type="button"
                          className="station-symbol-btn"
                          aria-label={k.label}
                          aria-pressed={!station.symbolId && station.kind === k.value}
                          title={k.label}
                          onClick={() => setStationKind(station.id, k.value)}
                        >
                          <svg viewBox="0 0 40 32" aria-hidden="true">
                            <path className="station-symbol-track" d="M2 16H38" />
                            {k.value === "terminus" ? (
                              <rect x="14" y="10" width="12" height="12" rx="1" />
                            ) : (
                              <>
                                {k.value === "interchange" && <circle cx="20" cy="16" r="10" />}
                                <circle cx="20" cy="16" r="6" />
                              </>
                            )}
                          </svg>
                          <span>{k.label}</span>
                        </button>
                      ))}
                    </div>
                  </PropRow>
                </CollapsibleSection>

                <CollapsibleSection title="Custom Station Marks">
                  <div className="station-custom-marks">
                    <button type="button" className="btn btn-sm" onClick={() => setMarkEditor({})}><PlusIcon />Create station mark</button>
                    {Object.values(map.stationSymbols ?? {}).length ? <div className="station-mark-library" role="group" aria-label="Saved station marks">
                      {Object.values(map.stationSymbols ?? {}).map((symbol) => <button type="button" key={symbol.id} className="station-symbol-btn" title={symbol.name} aria-label={symbol.name} aria-pressed={station.symbolId === symbol.id} onClick={() => useEditor.getState().setStationSymbol(station.id, symbol.id)}><svg viewBox="-32 -32 64 64" aria-hidden="true"><StationSymbolArtwork symbol={symbol} /></svg><span>{symbol.name}</span></button>)}
                    </div> : <p className="mark-editor-hint">Combine shapes or import an SVG, then reuse your mark on any station.</p>}
                    {station.symbolId && <button type="button" className="btn btn-sm" onClick={() => setMarkEditor({ symbolId: station.symbolId })}>Edit selected mark</button>}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title={tr("TransformPosition")} defaultOpen={true}>
                  <div className="station-coordinate-fields">
                    <PropRow label="X">
                      <input
                        type="number"
                        className="prop-input"
                        aria-label="X"
                        step={10}
                        value={Math.round(station.position.x)}
                        onChange={(e) => setStationPosition(station.id, { x: Number(e.target.value) || 0, y: station.position.y })}
                      />
                    </PropRow>
                    <PropRow label="Y">
                      <input
                        type="number"
                        className="prop-input"
                        aria-label="Y"
                        step={10}
                        value={Math.round(station.position.y)}
                        onChange={(e) => setStationPosition(station.id, { x: station.position.x, y: Number(e.target.value) || 0 })}
                      />
                    </PropRow>
                  </div>

                  <PropRow label={tr("Rotate")}>
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
                      <DuplicateIcon /> {tr("Duplicate")} (Ctrl+D)
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={deleteSelectedStation}
                      aria-label={tr("Delete")}
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
                      title={tr("CopyStyle")}
                    >
                      {tr("CopyStyle")}
                    </button>
                    <button
                      type="button"
                      className="btn btn-tool btn-sm"
                      style={{ flex: 1 }}
                      disabled={!copiedStationAttrs}
                      onClick={() => pasteStationAttrs(station.id)}
                      title={tr("PasteStyle")}
                    >
                      {tr("PasteStyle")}
                    </button>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title={tr("LabelPlacement")} defaultOpen={true}>
                  <div className="station-anchor-row">
                    <span className="prop-label">{tr("Anchor")}</span>
                    <div className="anchor-grid" role="group" aria-label={tr("Anchor")}>
                      {ANCHOR_MATRIX.map((row, rIdx) =>
                        row.map((cell, cIdx) => cell ? (
                          <button
                            key={`${rIdx}-${cIdx}`}
                            type="button"
                            className="anchor-btn"
                            aria-pressed={cell === station.labelAnchor}
                            aria-label={`${tr("Anchor")} ${cell}`}
                            onClick={() => setStationAnchor(station.id, cell)}
                            title={`${tr("Anchor")} ${cell}`}
                          >
                            <svg viewBox="0 0 16 16" aria-hidden="true" style={{ transform: `rotate(${Math.atan2(rIdx - 1, cIdx - 1) * 180 / Math.PI + 90}deg)` }}>
                              <path d="M8 12V4M4.5 7.5 8 4l3.5 3.5" />
                            </svg>
                          </button>
                        ) : (
                          <span key={`${rIdx}-${cIdx}`} className="anchor-center" aria-hidden="true"><span /></span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="station-coordinate-fields">
                    <PropRow label={tr("NudgeX")}>
                      <input
                        type="number"
                        className="prop-input"
                        aria-label={tr("NudgeX")}
                        value={station.labelOffset?.x ?? 0}
                        onChange={(e) => setStationLabelOffset(station.id, { x: Number(e.target.value) || 0, y: station.labelOffset?.y ?? 0 })}
                      />
                    </PropRow>
                    <PropRow label={tr("NudgeY")}>
                      <input
                        type="number"
                        className="prop-input"
                        aria-label={tr("NudgeY")}
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
                <CollapsibleSection title={tr("LineProperties")} defaultOpen={true}>
                  <PropRow label={tr("LineName")}>
                    <input
                      type="text"
                      className="prop-input"
                      value={line.name["en"] ?? ""}
                      onChange={(e) => renameLine(line.id, e.target.value, "en")}
                    />
                  </PropRow>
                  <PropRow label={tr("Color")}>
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

                <CollapsibleSection title={tr("StrokeStyling")} defaultOpen={true}>
                  <PropRow label={tr("Style")}>
                    <select
                      className="prop-input"
                      value={line.style}
                      onChange={(e) => setLineStyle(line.id, e.target.value as "solid" | "dashed" | "double")}
                    >
                      <option value="solid">{tr("SolidTrack")}</option>
                      <option value="dashed">{tr("DashedTrack")}</option>
                      <option value="double">{tr("DoubleTrack")}</option>
                    </select>
                  </PropRow>

                  <PropRow label={tr("Width")}>
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
                      <TrashIcon /> {tr("DeleteLine")}
                    </button>
                  </div>
                </CollapsibleSection>
              </>
            )}

            {!station && !line && (
              <div style={{ padding: "16px 12px", textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: "var(--text-13)", fontWeight: 600 }}>
                  {tr("NoSelectionTitle")}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
                  {tr("NoSelectionDesc")}
                </p>
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, textAlign: "left", fontSize: "var(--text-11)", color: "var(--color-text-secondary)" }}>
                  <div><kbd>V</kbd> {tr("ToolSelect")}</div>
                  <div><kbd>A</kbd> {tr("ToolAddStation")}</div>
                  <div><kbd>C</kbd> {tr("ToolConnect")}</div>
                  <div><kbd>H</kbd> {tr("ToolPan")}</div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "map" && (
          <>
            <CollapsibleSection title={tr("MapTemplate")} defaultOpen={true}>
              <p style={{ margin: "0 0 8px", fontSize: "var(--text-12)", color: "var(--color-text-secondary)" }}>
                {tr("MapTemplateDesc")}
              </p>
              <button
                type="button"
                className="btn btn-sm"
                style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
                onClick={() => {
                  const tpl = {
                    name: "My template",
                    style: { ...map.style },
                    linePalette: Object.values(map.lines).map((l) => l.color),
                    stationRadius: map.style.stationRadius,
                  };
                  const blob = new Blob([JSON.stringify(tpl, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "nodal-template.json";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
              >
                {tr("ExportTemplate")}
              </button>
              <label className="btn btn-sm" style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}>
                {tr("UploadTemplate")}
                <input
                  type="file"
                  accept="application/json,.json"
                  aria-label={tr("UploadTemplate")}
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    try {
                      const { validateTemplate, applyTemplate } = await import("@nodal/core");
                      const parsed = JSON.parse(await f.text());
                      const issues = validateTemplate(parsed);
                      if (issues.length) {
                        useEditor.getState().setError("Template invalid: " + issues[0] + ". See docs/TEMPLATES.md.");
                        return;
                      }
                      const next = applyTemplate(useEditor.getState().map, parsed);
                      useEditor.getState().loadMap(next);
                      useEditor.getState().setToast(`Template applied: ${parsed.name}`);
                    } catch {
                      useEditor.getState().setError("Couldn't read that template. Use a .json file.");
                    }
                  }}
                />
              </label>
            </CollapsibleSection>
            <CollapsibleSection title={tr("MapCanvas")} defaultOpen={true}>
              <PropRow label={tr("Background")}>
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

              <PropRow label={tr("GridStep")}>
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

              <PropRow label={tr("CornerRadius")}>
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

            <CollapsibleSection title={tr("TypographyDimensions")} defaultOpen={true}>
              <PropRow label={tr("StationSize")}>
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

              <PropRow label={tr("FontSize")}>
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

              <PropRow label={tr("PrimaryLanguage")}>
                <select
                  className="prop-input"
                  value={map.style.labelLanguage ?? "en"}
                  onChange={(e) => setLabelLanguage(e.target.value)}
                >
                  <option value="en">English Primary</option>
                  <option value="zh-TW">繁�?中�? Primary</option>
                  <option value="ja">?�本�?Primary</option>
                </select>
              </PropRow>

              <PropRow label={tr("Font")}>
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

              <PropRow label={tr("TextColor")}>
                <input
                  type="color"
                  value={map.style.labelColor ?? "#000000"}
                  onChange={(e) => setLabelColor(e.target.value)}
                  aria-label={tr("TextColor")}
                />
              </PropRow>

              <PropRow label={tr("Weight")}>
                <select className="prop-input" value={String(map.style.fontWeight ?? 500)}
                  onChange={(e) => setFontWeight(Number(e.target.value))}>
                  <option value="400">{tr("FontNormal")}</option>
                  <option value="500">{tr("FontMedium")}</option>
                  <option value="600">{tr("FontSemiBold")}</option>
                  <option value="700">{tr("FontBold")}</option>
                </select>
              </PropRow>

              <PropRow label={tr("FontStyle")}>
                <select className="prop-input" value={map.style.fontStyle ?? "normal"}
                  onChange={(e) => setFontStyle(e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </PropRow>

              <PropRow label={tr("Case")}>
                <select className="prop-input" value={map.style.textTransform ?? "none"}
                  onChange={(e) => setTextTransform(e.target.value)}>
                  <option value="none">None</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                </select>
              </PropRow>

              <PropRow label={tr("Tracking")}>
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
                  <SparklesIcon /> {tr("AutoResolveOverlaps")}
                </button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={tr("TransitDiagramFeatures")} defaultOpen={true}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-12)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={bilingualLabels}
                    onChange={toggleBilingual}
                  />
                  <span>{tr("BilingualLabels")}</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-12)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showTransferBadges}
                    onChange={toggleTransferBadges}
                  />
                  <span>{tr("TransferRouteBadges")}</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-12)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showDPad}
                    onChange={toggleDPad}
                  />
                  <span>{tr("CanvasDPadController")}</span>
                </label>
              </div>
            </CollapsibleSection>
          </>
        )}

        {tab === "align" && (
          <CollapsibleSection title={tr("AlignmentTools")} defaultOpen={true}>
            <div style={{ fontSize: "var(--text-11)", color: "var(--color-text-secondary)", marginBottom: 10 }}>
              {tr("AlignmentDesc")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
              <button
                type="button"
                className="btn btn-tool"
                title={tr("AlignLeft")}
                onClick={() => {
                  if (station) {
                    const snapX = Math.round(station.position.x / 40) * 40;
                    setStationPosition(station.id, { x: snapX, y: station.position.y });
                  }
                }}
              >
                <AlignLeftIcon /> {tr("AlignLeft")}
              </button>
              <button
                type="button"
                className="btn btn-tool"
                title={tr("AlignCenter")}
                onClick={() => {
                  if (station) {
                    const snapX = Math.round(station.position.x / 20) * 20;
                    setStationPosition(station.id, { x: snapX, y: station.position.y });
                  }
                }}
              >
                <AlignCenterIcon /> {tr("AlignCenter")}
              </button>
              <button
                type="button"
                className="btn btn-tool"
                title={tr("AlignRight")}
                onClick={() => {
                  if (station) {
                    const snapX = Math.ceil(station.position.x / 40) * 40;
                    setStationPosition(station.id, { x: snapX, y: station.position.y });
                  }
                }}
              >
                <AlignRightIcon /> {tr("AlignRight")}
              </button>

              <button
                type="button"
                className="btn btn-tool"
                title={tr("AlignTop")}
                onClick={() => {
                  if (station) {
                    const snapY = Math.round(station.position.y / 40) * 40;
                    setStationPosition(station.id, { x: station.position.x, y: snapY });
                  }
                }}
              >
                <AlignTopIcon /> {tr("AlignTop")}
              </button>
              <button
                type="button"
                className="btn btn-tool"
                title={tr("AlignMiddle")}
                onClick={() => {
                  if (station) {
                    const snapY = Math.round(station.position.y / 20) * 20;
                    setStationPosition(station.id, { x: station.position.x, y: snapY });
                  }
                }}
              >
                <AlignCenterIcon /> {tr("AlignMiddle")}
              </button>
              <button
                type="button"
                className="btn btn-tool"
                title={tr("AlignBottom")}
                onClick={() => {
                  if (station) {
                    const snapY = Math.ceil(station.position.y / 40) * 40;
                    setStationPosition(station.id, { x: station.position.x, y: snapY });
                  }
                }}
              >
                <AlignBottomIcon /> {tr("AlignBottom")}
              </button>
            </div>

            <div style={{ padding: "8px", background: "var(--color-bg-inset)", borderRadius: "var(--radius-1)", fontSize: "var(--text-11)", color: "var(--color-text-secondary)" }}>
              {tr("ShiftKeyTip")}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </aside>
  );
}
