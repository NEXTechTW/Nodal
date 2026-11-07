import { useCallback, useEffect, useRef, useState } from "react";
import { anchorBaseline, anchorOffset, anchorTextAnchor, computeParallelOffsets, displayName, roundedPolyline, svgPath, type Vec2 } from "@linewright/core";
import { useEditor } from "../store/useEditor.js";
import { linePathPoints } from "@linewright/renderer";
import { PlusIcon } from "./Icons.js";
import { exampleMap } from "../example.js";

interface DragState {
  kind: "pan" | "move" | "connect" | "none";
  startClient: Vec2;
  startViewport: { x: number; y: number };
  stationId: string | null;
  startStationPos: Vec2 | null;
  currentMap: Vec2 | null;
  moved: boolean;
}

function toMapCoords(client: Vec2, rect: DOMRect, vp: { x: number; y: number; k: number }): Vec2 {
  return { x: (client.x - rect.left - vp.x) / vp.k, y: (client.y - rect.top - vp.y) / vp.k };
}

export function Canvas() {
  const map = useEditor((s) => s.map);
  const tool = useEditor((s) => s.tool);
  const viewport = useEditor((s) => s.viewport);
  const setViewport = useEditor((s) => s.setViewport);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const activeLineId = useEditor((s) => s.activeLineId);
  const cornerRadius = useEditor((s) => s.cornerRadius);
  const addStation = useEditor((s) => s.addStation);
  const moveStation = useEditor((s) => s.moveStation);
  const selectStation = useEditor((s) => s.selectStation);
  const connectStations = useEditor((s) => s.connectStations);
  const setTool = useEditor((s) => s.setTool);
  const setToast = useEditor((s) => s.setToast);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState>({ kind: "none", startClient: { x: 0, y: 0 }, startViewport: { x: 0, y: 0 }, stationId: null, startStationPos: null, currentMap: null, moved: false });
  const [connectPreview, setConnectPreview] = useState<Vec2 | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [dragStationPos, setDragStationPos] = useState<Record<string, Vec2>>({});
  const [spaceDown, setSpaceDown] = useState(false);
  const [hoverStation, setHoverStation] = useState<string | null>(null);

  const stationCount = Object.keys(map.stations).length;
  const parallel = computeParallelOffsets(map).bySegment;

  // Keyboard: V/A/C/H tools, Delete removes selected, arrows nudge, Esc clears.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === "v") setTool("select");
      else if (k === "a") setTool("add-station");
      else if (k === "c") setTool("connect");
      else if (k === "h") setTool("pan");
      else if (k === "delete" || k === "backspace") {
        const s = useEditor.getState();
        if (s.selectedStationId) s.deleteSelectedStation();
      } else if (k === "escape") {
        selectStation(null);
        setConnectFrom(null);
      } else if (e.key === " ") {
        setSpaceDown(true);
        e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => { if (e.key === " ") setSpaceDown(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onUp); };
  }, [setTool, selectStation]);

  const getRectMap = useCallback((client: Vec2): Vec2 => {
    const svg = svgRef.current;
    if (!svg) return client;
    return toMapCoords(client, svg.getBoundingClientRect(), viewport);
  }, [viewport]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const client = { x: e.clientX, y: e.clientY };
    const mapPt = getRectMap(client);

    // Station hit test
    const hit = hitStation(mapPt, map.stations, 16 / viewport.k);
    const effectivePan = tool === "pan" || spaceDown;

    if (!effectivePan && hit) {
      if (tool === "connect") {
        if (!activeLineId) { setToast("Create a line first, then drag between stations"); return; }
        if (!connectFrom) { setConnectFrom(hit.id); dragRef.current = { kind: "connect", startClient: client, startViewport: { x: viewport.x, y: viewport.y }, stationId: hit.id, startStationPos: null, currentMap: mapPt, moved: true }; return; }
      }
      selectStation(hit.id);
      dragRef.current = { kind: "move", startClient: client, startViewport: { x: viewport.x, y: viewport.y }, stationId: hit.id, startStationPos: { ...map.stations[hit.id]!.position }, currentMap: mapPt, moved: false };
      return;
    }

    if (tool === "add-station" && !effectivePan) {
      const pos = gridSnap(mapPt, map.style.gridStep);
      addStation(pos);
      selectStation(null);
      return;
    }

    if (tool === "connect" && connectFrom) {
      // Click-to-complete: if clicking another station, connect.
      if (hit && hit.id !== connectFrom && activeLineId) {
        connectStations(activeLineId, connectFrom, hit.id);
        setConnectFrom(null);
        return;
      }
    }

    // Pan (middle-drag, left-drag on empty with pan tool / space)
    dragRef.current = { kind: "pan", startClient: client, startViewport: { x: viewport.x, y: viewport.y }, stationId: null, startStationPos: null, currentMap: mapPt, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const client = { x: e.clientX, y: e.clientY };
    const mapPt = getRectMap(client);
    const hit = hitStation(mapPt, map.stations, 16 / viewport.k);
    setHoverStation(hit?.id ?? null);

    const d = dragRef.current;
    if (d.kind === "pan") {
      const dx = client.x - d.startClient.x;
      const dy = client.y - d.startClient.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        setViewport({ x: d.startViewport.x + dx, y: d.startViewport.y + dy });
        d.moved = true;
      }
    } else if (d.kind === "move" && d.stationId && d.startStationPos) {
      const dxMap = (client.x - d.startClient.x) / viewport.k;
      const dyMap = (client.y - d.startClient.y) / viewport.k;
      const pos = { x: d.startStationPos.x + dxMap, y: d.startStationPos.y + dyMap };
      setDragStationPos({ [d.stationId]: pos });
      d.currentMap = pos;
      d.moved = true;
    } else if (d.kind === "connect") {
      setConnectPreview(mapPt);
    } else if (connectFrom && tool === "connect") {
      setConnectPreview(mapPt);
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    const client = { x: e.clientX, y: e.clientY };
    const mapPt = getRectMap(client);
    if (d.kind === "move" && d.stationId && d.currentMap) {
      if (d.moved) {
        const final = gridSnap(d.currentMap, map.style.gridStep / 2);
        moveStation(d.stationId, final);
      }
      setDragStationPos({});
      selectStation(d.stationId);
    } else if (d.kind === "connect" && d.stationId && activeLineId) {
      const hit = hitStation(mapPt, map.stations, 16 / viewport.k);
      if (hit && hit.id !== d.stationId) connectStations(activeLineId, d.stationId, hit.id);
      setConnectPreview(null);
      setConnectFrom(null);
    } else if (d.kind === "pan" && !d.moved) {
      // Plain click on empty = deselect (select tool only).
      if (tool === "select") selectStation(null);
    }
    dragRef.current = { kind: "none", startClient: { x: 0, y: 0 }, startViewport: { x: 0, y: 0 }, stationId: null, startStationPos: null, currentMap: null, moved: false };
    setConnectPreview(null);
    // Keep connectFrom for click-to-connect only when preview drag ends without hit? Reset.
    if (tool === "connect" && !activeLineId) setConnectFrom(null);
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0012);
    const k = Math.min(4, Math.max(0.2, viewport.k * factor));
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    // Zoom to cursor.
    const mapX = (cx - viewport.x) / viewport.k;
    const mapY = (cy - viewport.y) / viewport.k;
    setViewport({ k, x: cx - mapX * k, y: cy - mapY * k });
  };

  const fromPos = connectFrom ? map.stations[connectFrom]?.position : null;

  const hint = tool === "add-station"
    ? "Click the canvas to add a station"
    : tool === "connect"
      ? activeLineId
        ? connectFrom
          ? "Click another station to connect"
          : "Drag from a station to another to connect"
        : "Create a line first, then drag between stations"
      : tool === "pan"
        ? "Drag to pan. Scroll to zoom. Hold Space + drag also pans."
        : stationCount === 0 ? "" : "Click a station to select it. Drag to move. Scroll to zoom.";

  return (
    <main className="canvas-wrap" aria-label="Map canvas">
      <svg
        ref={svgRef}
        className="canvas-svg"
        data-tool={spaceDown ? "pan" : tool}
        role="application"
        aria-label="Transit map canvas. Use the tools to add stations, connect them, and edit the map."
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        onPointerLeave={() => { setConnectPreview(null); }}
      >
        {/* Grid */}
        <defs>
          <pattern id="grid" width={map.style.gridStep} height={map.style.gridStep} patternUnits="userSpaceOnUse">
            <path d={`M ${map.style.gridStep} 0 L 0 0 0 ${map.style.gridStep}`} fill="none" stroke="var(--canvas-grid, #E2E8F0)" strokeWidth="1" />
          </pattern>
        </defs>
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.k})`}>
          <rect x={-2000} y={-2000} width={4000} height={4000} fill="url(#grid)" pointerEvents="none" />

          {/* Lines */}
          {Object.values(map.lines).map((line) => (
            <g key={line.id} data-line={line.id}>
              {line.segments.map((_s, i) => {
                const pts = linePathPoints({ ...map, style: { ...map.style, cornerRadius } }, line.id, i, parallel);
                if (pts.length < 2) return null;
                const d = svgPath(pts);
                const w = line.width ?? 8;
                if (line.style === "double") {
                  return (
                    <g key={i}>
                      <path d={d} fill="none" stroke={line.color} strokeWidth={w + 6} strokeLinecap="round" strokeLinejoin="round" />
                      <path d={d} fill="none" stroke="#fff" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
                      <path d={d} fill="none" stroke={line.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
                    </g>
                  );
                }
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={w}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={line.style === "dashed" ? "12 8" : undefined}
                  />
                );
              })}
            </g>
          ))}

          {/* Connect preview */}
          {fromPos && connectPreview && (
            <path
              d={`M ${fromPos.x} ${fromPos.y} L ${connectPreview.x} ${connectPreview.y}`}
              stroke="var(--color-accent, #0B5FFF)"
              strokeWidth={3}
              strokeDasharray="6 6"
              strokeLinecap="round"
              pointerEvents="none"
            />
          )}

          {/* Stations */}
          {Object.values(map.stations).map((s) => {
            const pos = dragStationPos[s.id] ?? s.position;
            const isSel = s.id === selectedStationId;
            const isHover = s.id === hoverStation;
            const r = map.style.stationRadius;
            const stroke = isSel ? "#0B5FFF" : "#111";
            const sw = isSel ? 4 : 2.5;
            const ring = isSel ? 3 : isHover ? 2 : 0;
            return (
              <g key={s.id} transform={`translate(${pos.x} ${pos.y})`} data-station={s.id} style={{ cursor: tool === "connect" ? "crosshair" : "pointer" }}>
                {ring > 0 && <circle r={r + 6} fill="none" stroke="#0B5FFF" strokeWidth={1.5} opacity={0.6} />}
                {s.kind === "interchange" ? (
                  <>
                    <circle r={r + 7} fill="none" stroke={stroke} strokeWidth={2} />
                    <circle r={r} fill="#fff" stroke={stroke} strokeWidth={sw} />
                  </>
                ) : s.kind === "terminus" ? (
                  <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={3} fill="#fff" stroke={stroke} strokeWidth={sw} />
                ) : (
                  <circle r={r} fill="#fff" stroke={stroke} strokeWidth={sw} />
                )}
                {/* Label */}
                {(() => {
                  const off = anchorOffset(s.labelAnchor, r + 8);
                  return (
                    <text
                      x={off.x + (s.labelOffset?.x ?? 0)}
                      y={off.y + (s.labelOffset?.y ?? 0)}
                      textAnchor={anchorTextAnchor(s.labelAnchor)}
                      dominantBaseline={anchorBaseline(s.labelAnchor)}
                      fontFamily="Noto Sans, sans-serif"
                      fontSize={map.style.fontSize}
                      style={{ pointerEvents: "none", fill: "var(--color-text)" }}
                    >
                      {displayName(s.name, "Untitled station", map.style.labelLanguage)}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Line labels */}
          {Object.values(map.lines).map((line) => {
            const seg = line.segments[0];
            if (!seg) return null;
            const a = map.stations[seg.from];
            const b = map.stations[seg.to];
            if (!a || !b) return null;
            const mid = { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 - 10 };
            return (
              <text
                key={`lbl-${line.id}`}
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                fontFamily="Noto Sans, sans-serif"
                fontSize={map.style.fontSize - 1}
                fontWeight={600}
                strokeWidth={4}
                paintOrder="stroke"
                style={{ pointerEvents: "none", fill: "var(--color-text)", stroke: "var(--color-bg-canvas)" }}
              >
                {displayName(line.name, "Line", map.style.labelLanguage)}
              </text>
            );
          })}
        </g>
      </svg>

      {stationCount === 0 && (
        <div className="empty-state">
          <h2>Start with the example, or add your first station</h2>
          <p>Click an empty area to place a station, then use the Connect tool to draw lines between stations.</p>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={() => setTool("add-station")}>
              <PlusIcon /> Add a station
            </button>
            <button type="button" className="btn" onClick={() => {
              const { loadMap } = useEditor.getState();
              loadMap(exampleMap());
            }}>
              Load the fictional city
            </button>
          </div>
        </div>
      )}

      {hint && stationCount > 0 && <div className="canvas-hint" role="status">{hint}</div>}

      <div className="sr-only" role="status" aria-live="polite">
        {useEditor((s) => s.lastActionLabel ?? "")}
      </div>
    </main>
  );
}

function gridSnap(p: Vec2, step: number): Vec2 {
  if (step <= 0) return p;
  return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step };
}

function hitStation(p: Vec2, stations: Record<string, { id: string; position: Vec2 }>, tol: number): { id: string; position: Vec2 } | null {
  let best: { id: string; position: Vec2; d: number } | null = null;
  for (const s of Object.values(stations)) {
    const d = Math.hypot(p.x - s.position.x, p.y - s.position.y);
    if (d <= Math.max(tol, 14) && (!best || d < best.d)) best = { id: s.id, position: s.position, d };
  }
  return best;
}

// Keep roundedPolyline referenced for future waypoint editing (tree-shaking safe).
export { roundedPolyline };
