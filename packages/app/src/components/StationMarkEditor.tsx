import { useEffect, useRef, useState } from "react";
import { createId, type StationSymbol, type StationSymbolLayer } from "@nodal/core";
import { importStationSymbolSVG } from "../stationSymbolImport.js";
import { useEditor } from "../store/useEditor.js";
import { StationSymbolArtwork } from "./StationSymbolArtwork.js";
import { CloseIcon, DuplicateIcon, PlusIcon, TrashIcon } from "./Icons.js";

function newLayer(type: "circle" | "rect" | "line"): StationSymbolLayer {
  return { id: createId(), type, x: 0, y: 0, width: 24, height: type === "line" ? 0 : 24, rotation: 0, fill: type === "line" ? "none" : "#ffffff", stroke: "currentColor", strokeWidth: 3 };
}

export function StationMarkEditor({ symbol, stationId, onClose }: { symbol?: StationSymbol | undefined; stationId?: string | undefined; onClose(): void }) {
  const [draft, setDraft] = useState<StationSymbol>(() => symbol ? structuredClone(symbol) : { id: createId(), name: "Custom mark", layers: [newLayer("circle")] });
  const [selectedId, setSelectedId] = useState(draft.layers[0]?.id);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const stage = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; layer: StationSymbolLayer } | null>(null);
  const save = useEditor((s) => s.saveStationSymbol);
  const [previewColor, setPreviewColor] = useState("#1473e6");
  const layer = draft.layers.find((l) => l.id === selectedId);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  const update = (patch: Partial<StationSymbolLayer>) => setDraft((d) => ({ ...d, layers: d.layers.map((l) => l.id === selectedId ? { ...l, ...patch } : l) }));
  const add = (type: "circle" | "rect" | "line") => {
    if (draft.layers.length >= 100) return;
    const next = newLayer(type);
    setDraft({ ...draft, layers: [...draft.layers, next] });
    setSelectedId(next.id);
  };
  const moveLayer = (direction: number) => {
    const layers = [...draft.layers];
    const index = layers.findIndex((l) => l.id === selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= layers.length) return;
    [layers[index], layers[target]] = [layers[target]!, layers[index]!];
    setDraft({ ...draft, layers });
  };
  return (
    <dialog ref={dialog} className="mark-editor" aria-labelledby="mark-editor-title" onCancel={onClose} onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}>
      <header className="mark-editor-header">
        <div><h2 id="mark-editor-title">Station Mark Editor</h2><p>Build a symbol. Reuse it anywhere on this map.</p></div>
        <button type="button" className="btn btn-tool icon-btn" aria-label="Close station mark editor" onClick={onClose}><CloseIcon /></button>
      </header>
      <div className="mark-editor-tools">
        <span className="mark-editor-tool-label">Add shape</span>
        {(["circle", "rect", "line"] as const).map((type) => <button type="button" className="btn btn-sm" key={type} disabled={draft.layers.length >= 100} onClick={() => add(type)}><PlusIcon />{type === "rect" ? "Rectangle" : type === "circle" ? "Circle" : "Line"}</button>)}
        <button type="button" className="btn btn-sm" onClick={() => fileInput.current?.click()}>Import SVG</button>
        <input ref={fileInput} type="file" accept=".svg,image/svg+xml" aria-label="Import SVG mark" hidden onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            if (file.size > 200_000) throw new Error("SVG must be smaller than 200 KB.");
            const imported = importStationSymbolSVG(await file.text(), file.name.replace(/\.svg$/i, ""));
            setDraft({ ...imported, id: draft.id });
            setSelectedId(imported.layers[0]?.id);
            setError("");
          } catch (err) { setError(err instanceof Error ? err.message : "Unable to import SVG."); }
        }} />
      </div>
      {error && <div className="mark-editor-error" role="alert">{error}</div>}
      <div className="mark-editor-body">
        <section className="mark-editor-layers" aria-label="Mark layers">
          <h3>Layers <span>{draft.layers.length}</span></h3>
          <div className="mark-layer-list">
            {[...draft.layers].reverse().map((item, index) => <button type="button" key={item.id} className="mark-layer" aria-pressed={item.id === selectedId} onClick={() => setSelectedId(item.id)}>
              <svg viewBox="-30 -30 60 60" aria-hidden="true"><StationSymbolArtwork symbol={{ ...draft, layers: [item] }} /></svg>
              <span>{item.type === "path" ? "SVG path" : item.type === "rect" ? "Rectangle" : item.type === "circle" ? "Ellipse" : "Line"} {draft.layers.length - index}</span>
            </button>)}
          </div>
          <div className="mark-layer-actions">
            <button type="button" className="btn btn-sm" disabled={!layer || draft.layers.length >= 100} aria-label="Duplicate layer" onClick={() => {
              if (!layer) return;
              const copy = { ...structuredClone(layer), id: createId() };
              setDraft({ ...draft, layers: [...draft.layers, copy] }); setSelectedId(copy.id);
            }}><DuplicateIcon /></button>
            <button type="button" className="btn btn-sm" disabled={!layer} onClick={() => moveLayer(1)} title="Bring forward">Up</button>
            <button type="button" className="btn btn-sm" disabled={!layer} onClick={() => moveLayer(-1)} title="Send backward">Down</button>
            <button type="button" className="btn btn-sm" disabled={!layer} aria-label="Delete layer" onClick={() => {
              const layers = draft.layers.filter((l) => l.id !== selectedId); setDraft({ ...draft, layers }); setSelectedId(layers.at(-1)?.id);
            }}><TrashIcon /></button>
          </div>
        </section>
        <section className="mark-editor-workspace" aria-label="Mark preview">
          <div className="mark-stage-wrap">
            <svg ref={stage} className="mark-stage" viewBox="-32 -32 64 64" aria-label="Station mark artboard" onPointerMove={(e) => {
              if (!drag.current || !stage.current) return;
              const bounds = stage.current.getBoundingClientRect();
              update({ x: Math.max(-24, Math.min(24, Math.round(drag.current.layer.x + (e.clientX - drag.current.x) * 64 / bounds.width))), y: Math.max(-24, Math.min(24, Math.round(drag.current.layer.y + (e.clientY - drag.current.y) * 64 / bounds.height))) });
            }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
              <defs><pattern id="mark-editor-grid" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M4 0H0V4" fill="none" stroke="#e5e7eb" strokeWidth="0.15" /></pattern></defs>
              <rect x="-24" y="-24" width="48" height="48" fill="#ffffff" stroke="#b8b8b8" strokeWidth="0.2" />
              <rect x="-24" y="-24" width="48" height="48" fill="url(#mark-editor-grid)" pointerEvents="none" />
              <path d="M-28 0H28M0-28V28" stroke="#b8b8b8" strokeDasharray="1 1" strokeWidth="0.2" pointerEvents="none" />
              <g color={previewColor}>{draft.layers.map((item) => <g key={item.id} className="mark-stage-layer" onPointerDown={(e) => {
                e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setSelectedId(item.id); drag.current = { x: e.clientX, y: e.clientY, layer: structuredClone(item) };
              }}><StationSymbolArtwork symbol={{ ...draft, layers: [item] }} /></g>)}</g>
              {layer && <g pointerEvents="none"><circle cx={layer.x} cy={layer.y} r="1" fill="#ffffff" stroke="#1473e6" strokeWidth="0.35" /><path d={`M${layer.x - 2} ${layer.y}h4M${layer.x} ${layer.y - 2}v4`} stroke="#1473e6" strokeWidth="0.25" /></g>}
            </svg>
          </div>
          <p className="mark-editor-hint">Drag a shape to position it. Layers at the top appear in front.</p>
          <div className="mark-map-preview"><span>On the map</span><svg viewBox="0 0 220 60" aria-label="Map size preview"><path d="M10 30H210" stroke={previewColor} strokeWidth="7" /><g transform="translate(110 30) scale(.65)" color={previewColor}><StationSymbolArtwork symbol={draft} /></g></svg><label>Line color <input type="color" value={previewColor} onChange={(e) => setPreviewColor(e.target.value)} /></label></div>
        </section>
        <section className="mark-editor-properties" aria-label="Layer properties">
          <h3>Properties</h3>
          <label className="mark-field">Mark name<input className="prop-input" value={draft.name} maxLength={100} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          {layer ? <>
            <h4>{layer.type === "path" ? "Imported path" : "Selected shape"}</h4>
            <div className="mark-property-grid">{(["x", "y", "width", "height", "rotation", "strokeWidth"] as const).filter((key) => layer.type !== "path" || (key !== "width" && key !== "height")).map((key) => <label className="mark-field" key={key}>{({ x: "X", y: "Y", width: "Width", height: "Height", rotation: "Rotation", strokeWidth: "Stroke" })[key]}<input type="number" className="prop-input" aria-label={`Layer ${key}`} value={layer[key]} min={key === "x" || key === "y" ? -24 : key === "rotation" ? -360 : 0} max={key === "x" || key === "y" ? 24 : key === "rotation" ? 360 : layer.matrix ? 100000 : key === "strokeWidth" ? 12 : 48} step={key === "strokeWidth" ? .5 : 1} onChange={(e) => {
              const min = key === "x" || key === "y" ? -24 : key === "rotation" ? -360 : 0;
              const max = key === "x" || key === "y" ? 24 : key === "rotation" ? 360 : layer.matrix ? 100000 : key === "strokeWidth" ? 12 : 48;
              update({ [key]: Math.max(min, Math.min(max, Number(e.target.value) || 0)) });
            }} /></label>)}</div>
            {(["fill", "stroke"] as const).map((key) => <div className="mark-paint" key={key}><label className="mark-field">{key === "fill" ? "Fill" : "Outline"}<select className="prop-input" value={layer[key] === "none" || layer[key] === "currentColor" ? layer[key] : "custom"} onChange={(e) => update({ [key]: e.target.value === "custom" ? "#ffffff" : e.target.value })}><option value="currentColor">Line color</option><option value="custom">Custom color</option><option value="none">None</option></select></label>{layer[key].startsWith("#") && <input aria-label={`Layer ${key} color`} type="color" value={layer[key].slice(0, 7)} onChange={(e) => update({ [key]: e.target.value })} />}</div>)}
            {layer.matrix && <p className="mark-editor-hint">Imported geometry retains its SVG transform. X and Y move it on the artboard.</p>}
          </> : <p className="mark-editor-hint">Add a shape or import an SVG to begin.</p>}
        </section>
      </div>
      <footer className="mark-editor-footer"><span>Saved with this map. Shared marks update all stations using them.</span><button type="button" className="btn" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" disabled={!draft.name.trim() || !draft.layers.length} onClick={() => { save({ ...draft, name: draft.name.trim() }, stationId); onClose(); }}>Save{stationId ? " & Apply" : " Mark"}</button></footer>
    </dialog>
  );
}
