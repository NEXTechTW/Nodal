import { useCallback, useEffect, useRef, useState } from "react";
import {
  anchorBaseline,
  anchorOffset,
  anchorTextAnchor,
  chainPoints,
  computeParallelOffsets,
  lineChains,
  displayName,
  roundedPolyline,
  svgPath,
  type Vec2,
} from "@linewright/core";
import { useEditor } from "../store/useEditor.js";
import {
  CloseIcon,
  CompassIcon,
  ConnectIcon,
  DuplicateIcon,
  SparklesIcon,
  TrashIcon,
} from "./Icons.js";

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

/** Mini-Map / Navigator (Photoshop Navigator panel style) */
function MiniMap({
  stations,
  lines,
  viewport,
  setViewport,
  containerRect,
}: {
  stations: ReturnType<typeof useEditor.getState>["map"]["stations"];
  lines: ReturnType<typeof useEditor.getState>["map"]["lines"];
  viewport: { x: number; y: number; k: number };
  setViewport: (v: Partial<{ x: number; y: number; k: number }>) => void;
  containerRect: DOMRect | null;
}) {
  const toggleMiniMap = useEditor((s) => s.toggleMiniMap);
  const stationList = Object.values(stations);

  // Derive bounding box
  let minX = -400, minY = -300, maxX = 400, maxY = 300;
  if (stationList.length > 0) {
    minX = Math.min(...stationList.map((s) => s.position.x)) - 100;
    minY = Math.min(...stationList.map((s) => s.position.y)) - 100;
    maxX = Math.max(...stationList.map((s) => s.position.x)) + 100;
    maxY = Math.max(...stationList.map((s) => s.position.y)) + 100;
  }
  const mapW = Math.max(200, maxX - minX);
  const mapH = Math.max(140, maxY - minY);

  // Viewport rect in map coordinates
  const vw = containerRect ? containerRect.width : 800;
  const vh = containerRect ? containerRect.height : 600;
  const vpMapX = -viewport.x / viewport.k;
  const vpMapY = -viewport.y / viewport.k;
  const vpMapW = vw / viewport.k;
  const vpMapH = vh / viewport.k;

  const onMiniMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const targetMapX = minX + nx * mapW;
    const targetMapY = minY + ny * mapH;
    setViewport({
      x: vw / 2 - targetMapX * viewport.k,
      y: vh / 2 - targetMapY * viewport.k,
    });
  };

  return (
    <div className="mini-map" role="region" aria-label="Navigator Overview">
      <div className="mini-map-header">
        <span>Navigator</span>
        <button
          type="button"
          className="btn btn-tool"
          style={{ width: 16, height: 16, padding: 0 }}
          onClick={toggleMiniMap}
          aria-label="Close Navigator"
        >
          <CloseIcon />
        </button>
      </div>
      <svg
        className="mini-map-svg"
        viewBox={`${minX} ${minY} ${mapW} ${mapH}`}
        onClick={onMiniMapClick}
      >
        {/* Simplified lines */}
        {Object.values(lines).map((l) =>
          l.segments.map((s, idx) => {
            const a = stations[s.from];
            const b = stations[s.to];
            if (!a || !b) return null;
            return (
              <line
                key={`${l.id}-${idx}`}
                x1={a.position.x}
                y1={a.position.y}
                x2={b.position.x}
                y2={b.position.y}
                stroke={l.color}
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })
        )}
        {/* Simplified station dots */}
        {stationList.map((s) => (
          <circle
            key={s.id}
            cx={s.position.x}
            cy={s.position.y}
            r={5}
            fill="#ffffff"
            stroke="#1e1e1e"
            strokeWidth={1.5}
          />
        ))}
        {/* Viewport frame box */}
        <rect
          x={vpMapX}
          y={vpMapY}
          width={vpMapW}
          height={vpMapH}
          fill="rgba(55, 138, 221, 0.15)"
          stroke="var(--color-accent)"
          strokeWidth={Math.max(2, mapW / 80)}
        />
      </svg>
    </div>
  );
}

/** RMP-style floating canvas navigation & action D-Pad controller */
function DPadController({
  panBy,
  zoomFit,
  selectedStationId,
  deleteSelectedStation,
  duplicateStation,
}: {
  panBy: (dx: number, dy: number) => void;
  zoomFit: () => void;
  selectedStationId: string | null;
  deleteSelectedStation: () => void;
  duplicateStation: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const step = 80;

  if (collapsed) {
    return (
      <button
        type="button"
        className="dpad-toggle-btn"
        onClick={() => setCollapsed(false)}
        title="Show Canvas Controller"
        aria-label="Show Canvas Controller"
      >
        <CompassIcon />
      </button>
    );
  }

  return (
    <div className="dpad-wrap" role="region" aria-label="Canvas Controller">
      <div className="dpad-cross">
        <button
          type="button"
          className="dpad-btn dpad-up"
          onClick={() => panBy(0, step)}
          title="Pan Up"
          aria-label="Pan Up"
        >
          ▲
        </button>
        <button
          type="button"
          className="dpad-btn dpad-left"
          onClick={() => panBy(step, 0)}
          title="Pan Left"
          aria-label="Pan Left"
        >
          ◀
        </button>
        <button
          type="button"
          className="dpad-btn dpad-center"
          onClick={zoomFit}
          title="Fit Canvas View (F)"
          aria-label="Fit Canvas View"
        >
          •
        </button>
        <button
          type="button"
          className="dpad-btn dpad-right"
          onClick={() => panBy(-step, 0)}
          title="Pan Right"
          aria-label="Pan Right"
        >
          ▶
        </button>
        <button
          type="button"
          className="dpad-btn dpad-down"
          onClick={() => panBy(0, -step)}
          title="Pan Down"
          aria-label="Pan Down"
        >
          ▼
        </button>
      </div>

      <div className="dpad-actions">
        <button
          type="button"
          className="dpad-action-btn"
          disabled={!selectedStationId}
          onClick={() => selectedStationId && duplicateStation(selectedStationId)}
          title="Duplicate Station (Ctrl+D)"
        >
          <DuplicateIcon />
        </button>
        <button
          type="button"
          className="dpad-action-btn dpad-delete"
          disabled={!selectedStationId}
          onClick={deleteSelectedStation}
          title="Delete Station"
        >
          <TrashIcon />
        </button>
        <button
          type="button"
          className="dpad-action-btn"
          onClick={() => setCollapsed(true)}
          title="Minimize Controller"
        >
          −
        </button>
      </div>
    </div>
  );
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
  const duplicateStation = useEditor((s) => s.duplicateStation);
  const moveStation = useEditor((s) => s.moveStation);
  const selectStation = useEditor((s) => s.selectStation);
  const connectStations = useEditor((s) => s.connectStations);
  const setTool = useEditor((s) => s.setTool);
  const setToast = useEditor((s) => s.setToast);
  const showGrid = useEditor((s) => s.showGrid);
  const snapToGrid = useEditor((s) => s.snapToGrid);
  const showRulers = useEditor((s) => s.showRulers);
  const showMiniMap = useEditor((s) => s.showMiniMap);
  const toggleGrid = useEditor((s) => s.toggleGrid);
  const toggleSnap = useEditor((s) => s.toggleSnap);
  const toggleRulers = useEditor((s) => s.toggleRulers);
  const setShortcutsOpen = useEditor((s) => s.setShortcutsOpen);
  const zoomFit = useEditor((s) => s.zoomFit);
  const zoomIn = useEditor((s) => s.zoomIn);
  const zoomOut = useEditor((s) => s.zoomOut);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const setCursorPos = useEditor((s) => s.setCursorPos);
  const hiddenLineIds = useEditor((s) => s.hiddenLineIds);
  const measureFrom = useEditor((s) => s.measureFrom);
  const measureTo = useEditor((s) => s.measureTo);
  const bilingualLabels = useEditor((s) => s.bilingualLabels);
  const showTransferBadges = useEditor((s) => s.showTransferBadges);
  const showDPad = useEditor((s) => s.showDPad);
  const panBy = useEditor((s) => s.panBy);
  const copyStationAttrs = useEditor((s) => s.copyStationAttrs);
  const pasteStationAttrs = useEditor((s) => s.pasteStationAttrs);
  const autoEnglishName = useEditor((s) => s.autoEnglishName);
  const copiedStationAttrs = useEditor((s) => s.copiedStationAttrs);
  const deleteSelectedStation = useEditor((s) => s.deleteSelectedStation);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState>({
    kind: "none",
    startClient: { x: 0, y: 0 },
    startViewport: { x: 0, y: 0 },
    stationId: null,
    startStationPos: null,
    currentMap: null,
    moved: false,
  });

  const [connectPreview, setConnectPreview] = useState<Vec2 | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [dragStationPos, setDragStationPos] = useState<Record<string, Vec2>>({});
  const [spaceDown, setSpaceDown] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);
  const [hoverStation, setHoverStation] = useState<string | null>(null);
  const [cursorScreen, setCursorScreen] = useState<Vec2>({ x: 0, y: 0 });

  const stationCount = Object.keys(map.stations).length;
  const parallel = computeParallelOffsets(map).bySegment;

  // Global Keyboard Shortcuts (Nodal Standards: V, A, C, H, F, Ctrl+Z, Ctrl+D, Ctrl+', Ctrl+;, etc.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const k = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      if (ctrlOrCmd) {
        if (k === "z") {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
        if (k === "y") {
          e.preventDefault();
          redo();
          return;
        }
        if (k === "d") {
          e.preventDefault();
          const sel = useEditor.getState().selectedStationId;
          if (sel) duplicateStation(sel);
          return;
        }
        if (k === "'") {
          e.preventDefault();
          toggleGrid();
          return;
        }
        if (k === ";") {
          e.preventDefault();
          toggleSnap();
          return;
        }
        if (k === "r") {
          e.preventDefault();
          toggleRulers();
          return;
        }
        if (k === "=" || k === "+") {
          e.preventDefault();
          zoomIn();
          return;
        }
        if (k === "-") {
          e.preventDefault();
          zoomOut();
          return;
        }
      }

      if (k === "v") setTool("select");
      else if (k === "a") setTool("add-station");
      else if (k === "c") setTool("connect");
      else if (k === "h") setTool("pan");
      else if (k === "m") setTool("measure");
      else if (k === "t") setTool("label");
      else if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        const s = useEditor.getState();
        if (s.selectedStationId) {
          const st = s.map.stations[s.selectedStationId];
          if (st) {
            const step = e.shiftKey ? 20 : 5;
            const dx = k === "arrowleft" ? -step : k === "arrowright" ? step : 0;
            const dy = k === "arrowup" ? -step : k === "arrowdown" ? step : 0;
            s.setStationPosition(s.selectedStationId, { x: st.position.x + dx, y: st.position.y + dy });
            e.preventDefault();
          }
        }
      }
      else if (k === "f") zoomFit();
      else if (k === "?" || e.key === "F1") {
        e.preventDefault();
        setShortcutsOpen(true);
      } else if (k === "delete" || k === "backspace") {
        const s = useEditor.getState();
        if (s.selectedStationId) s.deleteSelectedStation();
      } else if (k === "escape") {
        selectStation(null);
        setConnectFrom(null);
      } else if (e.key === " ") {
        setSpaceDown(true);
        e.preventDefault();
      } else if (e.key === "Shift") {
        setShiftDown(true);
      }
    };

    const onUp = (e: KeyboardEvent) => {
      if (e.key === " ") setSpaceDown(false);
      if (e.key === "Shift") setShiftDown(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [setTool, selectStation, duplicateStation, undo, redo, toggleGrid, toggleSnap, toggleRulers, zoomFit, zoomIn, zoomOut, setShortcutsOpen]);

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
    const effectivePan = tool === "pan" || spaceDown || e.button === 1;

    if (!effectivePan && hit) {
      if (tool === "connect") {
        if (!activeLineId) {
          setToast("Select or create a transit line first, then drag between stations");
          return;
        }
        if (!connectFrom) {
          setConnectFrom(hit.id);
          dragRef.current = {
            kind: "connect",
            startClient: client,
            startViewport: { x: viewport.x, y: viewport.y },
            stationId: hit.id,
            startStationPos: null,
            currentMap: mapPt,
            moved: true,
          };
          return;
        }
      }
      selectStation(hit.id);
      dragRef.current = {
        kind: "move",
        startClient: client,
        startViewport: { x: viewport.x, y: viewport.y },
        stationId: hit.id,
        startStationPos: { ...map.stations[hit.id]!.position },
        currentMap: mapPt,
        moved: false,
      };
      return;
    }

    if (tool === "add-station" && !effectivePan) {
      const pos = snapToGrid ? gridSnap(mapPt, map.style.gridStep) : mapPt;
      addStation(pos);
      selectStation(null);
      return;
    }

    if (tool === "measure" && !effectivePan) {
      const s = useEditor.getState();
      if (!s.measureFrom) {
        s.setMeasurePoints(mapPt, null);
      } else {
        s.setMeasurePoints(s.measureFrom, mapPt);
        const d = Math.hypot(mapPt.x - s.measureFrom.x, mapPt.y - s.measureFrom.y);
        s.setToast(`${d.toFixed(0)} units`);
      }
      return;
    }

    if (tool === "label" && !effectivePan) {
      const text = window.prompt("Label text", "New label");
      if (text && text.trim()) useEditor.getState().addStandaloneLabel(mapPt, text.trim());
      return;
    }

    if (tool === "connect" && connectFrom) {
      if (hit && hit.id !== connectFrom && activeLineId) {
        connectStations(activeLineId, connectFrom, hit.id);
        setConnectFrom(null);
        return;
      }
    }

    // Pan
    dragRef.current = {
      kind: "pan",
      startClient: client,
      startViewport: { x: viewport.x, y: viewport.y },
      stationId: null,
      startStationPos: null,
      currentMap: mapPt,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const client = { x: e.clientX, y: e.clientY };
    const mapPt = getRectMap(client);
    setCursorPos({ x: Math.round(mapPt.x), y: Math.round(mapPt.y) });

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setCursorScreen({ x: client.x - rect.left, y: client.y - rect.top });
    }

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
      let dxMap = (client.x - d.startClient.x) / viewport.k;
      let dyMap = (client.y - d.startClient.y) / viewport.k;

      // Shift constraint: 0, 45, 90 degree axis lock
      if (shiftDown) {
        const absX = Math.abs(dxMap);
        const absY = Math.abs(dyMap);
        if (absX > absY * 2) dyMap = 0;
        else if (absY > absX * 2) dxMap = 0;
        else {
          const avg = (absX + absY) / 2;
          dxMap = Math.sign(dxMap) * avg;
          dyMap = Math.sign(dyMap) * avg;
        }
      }

      let pos = { x: d.startStationPos.x + dxMap, y: d.startStationPos.y + dyMap };
      if (snapToGrid) {
        pos = gridSnap(pos, map.style.gridStep / 2);
      }
      setDragStationPos({ [d.stationId]: pos });
      d.currentMap = pos;
      d.moved = true;
    } else if (d.kind === "connect" || (connectFrom && tool === "connect")) {
      setConnectPreview(mapPt);
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    const client = { x: e.clientX, y: e.clientY };
    const mapPt = getRectMap(client);

    if (d.kind === "move" && d.stationId && d.currentMap) {
      if (d.moved) {
        const final = snapToGrid ? gridSnap(d.currentMap, map.style.gridStep / 2) : d.currentMap;
        moveStation(d.stationId, final);
      }
      setDragStationPos({});
      selectStation(d.stationId);
    } else if (d.kind === "connect" && d.stationId && activeLineId) {
      const hit = hitStation(mapPt, map.stations, 16 / viewport.k);
      if (hit && hit.id !== d.stationId) {
        connectStations(activeLineId, d.stationId, hit.id);
      }
      setConnectPreview(null);
      setConnectFrom(null);
    } else if (d.kind === "pan" && !d.moved) {
      if (tool === "select") selectStation(null);
    }

    dragRef.current = {
      kind: "none",
      startClient: { x: 0, y: 0 },
      startViewport: { x: 0, y: 0 },
      stationId: null,
      startStationPos: null,
      currentMap: null,
      moved: false,
    };
    setConnectPreview(null);
  };

  // Wheel zoom must preventDefault, so it cannot be React's passive listener.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0012);
      const vp = useEditor.getState().viewport;
      const k = Math.min(5, Math.max(0.15, vp.k * factor));
      const rect = svg.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const mapX = (cx - vp.x) / vp.k;
      const mapY = (cy - vp.y) / vp.k;
      useEditor.getState().setViewport({ k, x: cx - mapX * k, y: cy - mapY * k });
    };
    svg.addEventListener("wheel", handler, { passive: false });
    return () => svg.removeEventListener("wheel", handler);
  }, []);

  const fromPos = connectFrom ? map.stations[connectFrom]?.position : null;
  const selectedStation = selectedStationId ? map.stations[selectedStationId] : null;

  return (
    <main className="canvas-wrap" aria-label="Map canvas">
      {/* Canvas Rulers (Top & Left) */}
      {showRulers && (
        <>
          <div className="canvas-ruler-corner" />
          <svg className="canvas-ruler-top" aria-hidden="true">
            <line x1={cursorScreen.x} y1={0} x2={cursorScreen.x} y2={18} stroke="var(--color-accent)" strokeWidth={1.5} />
            {Array.from({ length: 40 }).map((_, i) => (
              <line key={i} x1={i * 50} y1={10} x2={i * 50} y2={18} stroke="var(--color-border-strong)" strokeWidth={1} />
            ))}
          </svg>
          <svg className="canvas-ruler-left" aria-hidden="true">
            <line x1={0} y1={cursorScreen.y} x2={18} y2={cursorScreen.y} stroke="var(--color-accent)" strokeWidth={1.5} />
            {Array.from({ length: 30 }).map((_, i) => (
              <line key={i} x1={10} y1={i * 50} x2={18} y2={i * 50} stroke="var(--color-border-strong)" strokeWidth={1} />
            ))}
          </svg>
        </>
      )}

      <svg
        ref={svgRef}
        className="canvas-svg"
        data-tool={spaceDown ? "pan" : tool}
        role="application"
        aria-label="Transit map canvas"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          setConnectPreview(null);
          setCursorPos(null);
        }}
      >
        {/* Background Grid Pattern */}
        <defs>
          <pattern
            id="canvas-grid"
            width={map.style.gridStep}
            height={map.style.gridStep}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${map.style.gridStep} 0 L 0 0 0 ${map.style.gridStep}`}
              fill="none"
              stroke="var(--canvas-grid)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.k})`}>
          {/* Background surface & Grid */}
          <rect
            x={-6000}
            y={-6000}
            width={12000}
            height={12000}
            fill={map.style.background}
          />
          {showGrid && (
            <rect
              x={-6000}
              y={-6000}
              width={12000}
              height={12000}
              fill="url(#canvas-grid)"
              pointerEvents="none"
            />
          )}

          {/* Transit Lines — one rounded path per continuous chain */}
          {Object.values(map.lines).map((line) => {
            if (hiddenLineIds[line.id]) return null;
            const chains = lineChains({ ...map, style: { ...map.style, cornerRadius } }, line.id);
            return (
              <g key={line.id} data-line={line.id}>
                {chains.map((chain, ci) => {
                  const raw = chainPoints(map, chain, line.id, parallel);
                  if (raw.length < 2) return null;
                  const pts = roundedPolyline(raw, cornerRadius);
                  const d = svgPath(pts);
                  const w = line.width ?? 10;
                  if (line.style === "double") {
                    return (
                      <g key={ci}>
                        <path d={d} fill="none" stroke={line.color} strokeWidth={w + 6} strokeLinecap="round" strokeLinejoin="round" />
                        <path d={d} fill="none" stroke="#ffffff" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
                        <path d={d} fill="none" stroke={line.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
                      </g>
                    );
                  }
                  return (
                    <path
                      key={ci}
                      d={d}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={w}
                      strokeLinecap="butt"
                      strokeLinejoin="round"
                      strokeDasharray={line.style === "dashed" ? "12 8" : undefined}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Live Connect Preview Drag Line */}
          {fromPos && connectPreview && (
            <path
              d={`M ${fromPos.x} ${fromPos.y} L ${connectPreview.x} ${connectPreview.y}`}
              stroke="var(--color-accent)"
              strokeWidth={3.5}
              strokeDasharray="6 6"
              strokeLinecap="round"
              pointerEvents="none"
            />
          )}

          {/* Transit Stations */}
          {Object.values(map.stations).map((s) => {
            const pos = dragStationPos[s.id] ?? s.position;
            const isSel = s.id === selectedStationId;
            const isHover = s.id === hoverStation;
            const r = map.style.stationRadius;
            const lineColor = Object.values(map.lines).find((l) =>
              l.segments.some((seg) => seg.from === s.id || seg.to === s.id),
            )?.color;
            const stroke = isSel ? "var(--color-accent)" : (lineColor ?? "#1e1e1e");
            const sw = isSel ? 3.5 : 2.5;

            return (
              <g
                key={s.id}
                transform={`translate(${pos.x} ${pos.y}) rotate(${s.rotation ?? 0})`}
                data-station={s.id}
                style={{ cursor: tool === "connect" ? "crosshair" : "pointer" }}
              >
                <circle r={r + 5} fill="#ffffff" />
                {/* Nodal Selection Halo Indicator */}
                {(isSel || isHover) && (
                  <circle
                    r={r + 6}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={isSel ? 2 : 1}
                    opacity={isSel ? 0.9 : 0.5}
                  />
                )}

                {s.kind === "interchange" ? (
                  <>
                    <circle r={r + 6} fill="none" stroke={stroke} strokeWidth={2} />
                    <circle r={r} fill="#ffffff" stroke={stroke} strokeWidth={sw} />
                  </>
                ) : s.kind === "terminus" ? (
                  <rect
                    x={-r}
                    y={-r}
                    width={r * 2}
                    height={r * 2}
                    rx={2}
                    fill="#ffffff"
                    stroke={stroke}
                    strokeWidth={sw}
                  />
                ) : (
                  <circle r={r} fill="#ffffff" stroke={stroke} strokeWidth={sw} />
                )}

                {/* Station Label & Bilingual Support (RMP Style) */}
                {(() => {
                  const off = anchorOffset(s.labelAnchor, r + 8);
                  const lx = off.x + (s.labelOffset?.x ?? 0);
                  const ly = off.y + (s.labelOffset?.y ?? 0);
                  const zhName = s.name["zh-TW"] || s.name["zh"];
                  const enName = s.name["en"];
                  const isBilingual = bilingualLabels && zhName && enName;

                  return (
                    <text
                      x={lx}
                      y={ly}
                      textAnchor={anchorTextAnchor(s.labelAnchor)}
                      dominantBaseline={anchorBaseline(s.labelAnchor)}
                      fontFamily={map.style.fontFamily ?? "Noto Sans, sans-serif"}
                      fontSize={map.style.fontSize}
                      fontWeight={isSel ? 600 : (map.style.fontWeight ?? 500)}
                      fontStyle={(map.style.fontStyle as "normal" | "italic") ?? "normal"}
                      letterSpacing={map.style.letterSpacing ?? 0}
                      style={{ pointerEvents: "none", fill: map.style.labelColor ?? "#000000" }}
                    >
                      {isBilingual ? (
                        <>
                          <tspan x={lx} dy={s.labelAnchor.includes("S") ? "0" : "-0.3em"}>
                            {map.style.textTransform === "uppercase" ? (zhName ?? "").toUpperCase() : map.style.textTransform === "lowercase" ? (zhName ?? "").toLowerCase() : zhName}
                          </tspan>
                          <tspan
                            x={lx}
                            dy="1.2em"
                            fontSize={Math.max(8, Math.round(map.style.fontSize * 0.78))}
                            fontWeight={400}
                            fill="var(--color-text-secondary)"
                          >
                            {map.style.textTransform === "uppercase" ? (enName ?? "").toUpperCase() : map.style.textTransform === "lowercase" ? (enName ?? "").toLowerCase() : enName}
                          </tspan>
                        </>
                      ) : (
                        (() => {
                          const raw = displayName(s.name, "Untitled station", map.style.labelLanguage);
                          return map.style.textTransform === "uppercase" ? raw.toUpperCase() : map.style.textTransform === "lowercase" ? raw.toLowerCase() : raw;
                        })()
                      )}
                    </text>
                  );
                })()}

                {/* Transfer Line Bullet Badges (RMP / Real Metro Style) */}
                {showTransferBadges && (() => {
                  const stationLines = Object.values(map.lines).filter(
                    (l) => !hiddenLineIds[l.id] && l.segments.some((seg) => seg.from === s.id || seg.to === s.id)
                  );
                  if (stationLines.length < 2 && s.kind !== "interchange") return null;
                  if (stationLines.length === 0) return null;

                  const badgeY = r + 10 + (s.labelAnchor.includes("S") ? 18 : 0);
                  const badgeW = 16;
                  const totalW = stationLines.length * (badgeW + 3) - 3;
                  const startX = -totalW / 2;

                  return (
                    <g transform={`translate(0, ${badgeY})`} style={{ pointerEvents: "none" }}>
                      {stationLines.map((l, lIdx) => {
                        const bx = startX + lIdx * (badgeW + 3);
                        const code = (displayName(l.name, "L")).slice(0, 2).toUpperCase();
                        return (
                          <g key={l.id} transform={`translate(${bx}, 0)`}>
                            <rect
                              x={0}
                              y={0}
                              width={badgeW}
                              height={11}
                              rx={3}
                              fill={l.color}
                            />
                            <text
                              x={badgeW / 2}
                              y={8.5}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize={7.5}
                              fontFamily="var(--font-mono)"
                              fontWeight={700}
                            >
                              {code}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Transfer footpaths (dashed) */}
          {Object.values(map.transfers ?? {}).map((tr) => {
            const a = map.stations[tr.from];
            const b = map.stations[tr.to];
            if (!a || !b) return null;
            return (
              <line
                key={tr.id}
                x1={a.position.x}
                y1={a.position.y}
                x2={b.position.x}
                y2={b.position.y}
                stroke="var(--color-text-secondary)"
                strokeWidth={3}
                strokeDasharray="8 6"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
            );
          })}

          {/* Standalone labels */}
          {Object.values(map.labels).map((lb) => (
            <text
              key={lb.id}
              x={lb.position.x}
              y={lb.position.y}
              textAnchor="middle"
              fontFamily={map.style.fontFamily ?? "Noto Sans, sans-serif"}
              fontSize={map.style.fontSize}
              style={{ fill: map.style.labelColor ?? "#000000", pointerEvents: "none" }}
            >
              {displayName(lb.text, "Label", map.style.labelLanguage)}
            </text>
          ))}

          {/* Measure overlay */}
          {measureFrom && tool === "measure" && (
            <g style={{ pointerEvents: "none" }}>
              <circle cx={measureFrom.x} cy={measureFrom.y} r={4} fill="var(--color-accent)" />
              {measureTo && (
                <>
                  <circle cx={measureTo.x} cy={measureTo.y} r={4} fill="var(--color-accent)" />
                  <line x1={measureFrom.x} y1={measureFrom.y} x2={measureTo.x} y2={measureTo.y} stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="6 4" />
                  <text x={(measureFrom.x + measureTo.x) / 2} y={(measureFrom.y + measureTo.y) / 2 - 8} textAnchor="middle" fontSize={12} style={{ fill: "var(--color-accent)" }}>
                    {Math.hypot(measureTo.x - measureFrom.x, measureTo.y - measureFrom.y).toFixed(0)} units
                  </text>
                </>
              )}
            </g>
          )}

          {/* Line Labels */}
          {Object.values(map.lines).map((line) => {
            if (hiddenLineIds[line.id]) return null;
            const seg = line.segments[0];
            if (!seg) return null;
            const a = map.stations[seg.from];
            const b = map.stations[seg.to];
            if (!a || !b) return null;
            const mid = {
              x: (a.position.x + b.position.x) / 2,
              y: (a.position.y + b.position.y) / 2 - 10,
            };
            return (
              <text
                key={`lbl-${line.id}`}
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                fontFamily={map.style.fontFamily ?? "Noto Sans, sans-serif"}
                fontSize={map.style.fontSize - 1}
                fontWeight={600}
                strokeWidth={3}
                paintOrder="stroke"
                style={{
                  pointerEvents: "none",
                  fill: map.style.labelColor ?? "#000000",
                  stroke: map.style.background,
                }}
              >
                {displayName(line.name, "Line", map.style.labelLanguage)}
              </text>
            );
          })}
        </g>
      </svg>

      {/* Floating contextual toolbar */}
      {selectedStation && (
        <div className="ctx-toolbar" role="toolbar" aria-label="Selected Station Actions">
          <span className="ctx-label">
            {displayName(selectedStation.name, "Station")}
          </span>
          <div className="ctx-sep" />
          <button
            type="button"
            className="ctx-btn"
            onClick={() => duplicateStation(selectedStation.id)}
            title="Duplicate Station (Ctrl+D)"
            aria-label="Duplicate"
          >
            <DuplicateIcon />
          </button>
          <button
            type="button"
            className="ctx-btn"
            onClick={() => {
              setTool("connect");
              setConnectFrom(selectedStation.id);
            }}
            title="Connect Line (C)"
            aria-label="Connect"
          >
            <ConnectIcon />
          </button>
          <div className="ctx-sep" />
          <button
            type="button"
            className="ctx-btn"
            onClick={() => copyStationAttrs(selectedStation.id)}
            title="Copy Station Style"
            aria-label="Copy Style"
          >
            Copy
          </button>
          {copiedStationAttrs && (
            <button
              type="button"
              className="ctx-btn"
              onClick={() => pasteStationAttrs(selectedStation.id)}
              title="Paste Station Style"
              aria-label="Paste Style"
            >
              Paste
            </button>
          )}
          {(selectedStation.name["zh-TW"] || selectedStation.name["zh"]) && (
            <button
              type="button"
              className="ctx-btn"
              onClick={() => autoEnglishName(selectedStation.id)}
              title="Auto Translate to English"
              aria-label="Auto English"
            >
              <SparklesIcon />
            </button>
          )}
          <div className="ctx-sep" />
          <button
            type="button"
            className="ctx-btn ctx-btn-danger"
            onClick={deleteSelectedStation}
            title="Delete Station (Del)"
            aria-label="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      )}

      {/* RMP-Style On-Canvas Navigation D-Pad */}
      {showDPad && (
        <DPadController
          panBy={panBy}
          zoomFit={zoomFit}
          selectedStationId={selectedStationId}
          deleteSelectedStation={deleteSelectedStation}
          duplicateStation={duplicateStation}
        />
      )}

      {/* Mini-Map / Navigator */}
      {showMiniMap && (
        <MiniMap
          stations={map.stations}
          lines={map.lines}
          viewport={viewport}
          setViewport={setViewport}
          containerRect={svgRef.current?.getBoundingClientRect() ?? null}
        />
      )}

      {/* Help Tip Overlay */}
      {stationCount === 0 && (
        <div className="canvas-hint" role="status">
          Click anywhere with the Add Station tool (A) to place your first transit hub
        </div>
      )}
    </main>
  );
}

function gridSnap(p: Vec2, step: number): Vec2 {
  if (step <= 0) return p;
  return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step };
}

function hitStation(
  p: Vec2,
  stations: Record<string, { id: string; position: Vec2 }>,
  tol: number
): { id: string; position: Vec2 } | null {
  let best: { id: string; position: Vec2; d: number } | null = null;
  for (const s of Object.values(stations)) {
    const d = Math.hypot(p.x - s.position.x, p.y - s.position.y);
    if (d <= Math.max(tol, 14) && (!best || d < best.d)) {
      best = { id: s.id, position: s.position, d };
    }
  }
  return best;
}

export { roundedPolyline };
