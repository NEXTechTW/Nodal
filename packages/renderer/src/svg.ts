/**
 * Pure SVG exporter — zero UI deps (teardown skill: renderer is a layer that
 * can be swapped for Canvas later; the map model never changes).
 * Produces a standalone SVG string for export (PROJECT.md §5, §6 v0.1).
 */
import { anchorBaseline, anchorOffset, anchorTextAnchor, displayName, roundedPolyline, svgPath, type MetroMap, type Vec2 } from "@linewright/core";

export interface RenderOptions {
  width?: number;
  height?: number;
  showGrid?: boolean;
  /** CSS color for selected station (editor export keeps neutral). */
  selectedId?: string | null;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function linePathPoints(map: MetroMap, lineId: string, segIdx: number): Vec2[] {
  const line = map.lines[lineId];
  if (!line) return [];
  const seg = line.segments[segIdx];
  if (!seg) return [];
  const a = map.stations[seg.from];
  const b = map.stations[seg.to];
  if (!a || !b) return [];
  const pts = [a.position, ...(seg.waypoints ?? []), b.position];
  return roundedPolyline(pts, map.style.cornerRadius);
}

export function stationLabelPos(map: MetroMap, stationId: string): Vec2 {
  const s = map.stations[stationId];
  if (!s) return { x: 0, y: 0 };
  const off = anchorOffset(s.labelAnchor, map.style.stationRadius + 8);
  return { x: s.position.x + off.x + (s.labelOffset?.x ?? 0), y: s.position.y + off.y + (s.labelOffset?.y ?? 0) };
}

export function computeBounds(map: MetroMap): { x: number; y: number; w: number; h: number } {
  const pts: Vec2[] = [];
  for (const s of Object.values(map.stations)) pts.push(s.position);
  for (const l of Object.values(map.lines)) {
    for (const seg of l.segments) {
      for (const wp of seg.waypoints ?? []) pts.push(wp);
    }
  }
  if (pts.length === 0) return { x: 0, y: 0, w: 800, h: 600 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  const pad = 80;
  return { x: minX - pad, y: minY - pad, w: Math.max(maxX - minX + pad * 2, 200), h: Math.max(maxY - minY + pad * 2, 200) };
}

export function toSVGString(map: MetroMap, opts: RenderOptions = {}): string {
  const b = computeBounds(map);
  const width = opts.width ?? Math.round(b.w);
  const height = opts.height ?? Math.round(b.h);
  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}" width="${width}" height="${height}" role="img" aria-label="${esc(map.meta.title)}">`);
  parts.push(`<title>${esc(map.meta.title)}</title>`);
  parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${esc(map.style.background)}"/>`);

  if (opts.showGrid) {
    const step = map.style.gridStep;
    const cols = Math.ceil(b.w / step) + 1;
    const rows = Math.ceil(b.h / step) + 1;
    let grid = `<g stroke="#000" stroke-opacity="0.06" stroke-width="1">`;
    for (let i = 0; i < cols; i++) {
      const x = b.x + i * step;
      grid += `<line x1="${x}" y1="${b.y}" x2="${x}" y2="${b.y + b.h}"/>`;
    }
    for (let i = 0; i < rows; i++) {
      const y = b.y + i * step;
      grid += `<line x1="${b.x}" y1="${y}" x2="${b.x + b.w}" y2="${y}"/>`;
    }
    grid += `</g>`;
    parts.push(grid);
  }

  // Lines (casing first for double style, then main stroke)
  for (const line of Object.values(map.lines)) {
    line.segments.forEach((_seg, i) => {
      const pts = linePathPoints(map, line.id, i);
      if (pts.length < 2) return;
      const d = svgPath(pts);
      const w = line.width ?? 8;
      if (line.style === "double") {
        parts.push(`<path d="${d}" fill="none" stroke="${esc(line.color)}" stroke-width="${w + 6}" stroke-linecap="round" stroke-linejoin="round"/>`);
        parts.push(`<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
        parts.push(`<path d="${d}" fill="none" stroke="${esc(line.color)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
      } else {
        const dash = line.style === "dashed" ? ` stroke-dasharray="12 8"` : "";
        parts.push(`<path d="${d}" fill="none" stroke="${esc(line.color)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`);
      }
    });
  }

  // Lines labels
  for (const line of Object.values(map.lines)) {
    // Cheap: place line label at first segment midpoint.
    const seg = line.segments[0];
    if (!seg) continue;
    const a = map.stations[seg.from]; const b = map.stations[seg.to];
    if (!a || !b) continue;
    const mid = { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 };
    parts.push(`<text x="${mid.x}" y="${mid.y}" text-anchor="middle" dy="-0.5em" font-family="Noto Sans, sans-serif" font-size="${map.style.fontSize}" font-weight="600" fill="#111" stroke="${esc(map.style.background)}" stroke-width="4" paint-order="stroke">${esc(displayName(line.name, "Line"))}</text>`);
  }

  // Stations
  for (const s of Object.values(map.stations)) {
    const r = map.style.stationRadius;
    const isSel = opts.selectedId === s.id;
    const stroke = isSel ? "#0B5FFF" : "#111";
    if (s.kind === "interchange") {
      parts.push(`<g data-station="${esc(s.id)}"><circle cx="${s.position.x}" cy="${s.position.y}" r="${r}" fill="#fff" stroke="${stroke}" stroke-width="2.5"/><circle cx="${s.position.x}" cy="${s.position.y}" r="${r + 7}" fill="none" stroke="${stroke}" stroke-width="2" opacity="0.9"/></g>`);
    } else if (s.kind === "terminus") {
      parts.push(`<g data-station="${esc(s.id)}"><rect x="${s.position.x - r}" y="${s.position.y - r}" width="${r * 2}" height="${r * 2}" rx="3" fill="#fff" stroke="${stroke}" stroke-width="2.5"/></g>`);
    } else {
      parts.push(`<g data-station="${esc(s.id)}"><circle cx="${s.position.x}" cy="${s.position.y}" r="${r}" fill="#fff" stroke="${stroke}" stroke-width="2.5"/></g>`);
    }
    const lp = stationLabelPos(map, s.id);
    const name = displayName(s.name, "Untitled station");
    parts.push(`<text x="${lp.x}" y="${lp.y}" text-anchor="${anchorTextAnchor(s.labelAnchor)}" dominant-baseline="${anchorBaseline(s.labelAnchor)}" font-family="Noto Sans, sans-serif" font-size="${map.style.fontSize}" fill="#111">${esc(name)}</text>`);
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}

/** Download helper — browser only, kept out of pure string API. */
export function downloadSVG(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
