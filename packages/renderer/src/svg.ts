/**
 * Turns a MetroMap into a standalone SVG string for export.
 * Kept free of DOM calls so it can run in Node.
 */
import { anchorBaseline, anchorOffset, anchorTextAnchor, chainPoints, computeParallelOffsets, displayName, lineChains, offsetPolyline, roundedPolyline, svgPath, type MetroMap, type Vec2 } from "@linewright/core";

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

export function linePathPoints(
  map: MetroMap,
  lineId: string,
  segIdx: number,
  offsets?: Map<string, Map<number, number>>,
): Vec2[] {
  const line = map.lines[lineId];
  if (!line) return [];
  const seg = line.segments[segIdx];
  if (!seg) return [];
  const a = map.stations[seg.from];
  const b = map.stations[seg.to];
  if (!a || !b) return [];
  let pts = [a.position, ...(seg.waypoints ?? []), b.position];
  const offset = offsets?.get(lineId)?.get(segIdx) ?? 0;
  if (offset) pts = offsetPolyline(pts, offset);
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

  // Parallel offsets: shared tracks are nudged apart (PROJECT.md §5).
  const offsets = computeParallelOffsets(map).bySegment;

  // Lines — one rounded path per continuous chain so bends between
  // segments curve instead of meeting at a sharp point.
  for (const line of Object.values(map.lines)) {
    const w = line.width ?? 10;
    for (const chain of lineChains(map, line.id)) {
      const raw = chainPoints(map, chain, line.id);
      if (raw.length < 2) continue;
      // Apply parallel offset from the first matching segment.
      let pts = raw;
      for (let i = 0; i < line.segments.length; i++) {
        const off = offsets.get(line.id)?.get(i) ?? 0;
        if (off) {
          pts = offsetPolyline(roundedPolyline(raw, map.style.cornerRadius), off);
          break;
        }
      }
      if (pts === raw) pts = roundedPolyline(raw, map.style.cornerRadius);
      const d = svgPath(pts);
      if (line.style === "double") {
        parts.push(`<path d="${d}" fill="none" stroke="${esc(line.color)}" stroke-width="${w + 6}" stroke-linecap="round" stroke-linejoin="round"/>`);
        parts.push(`<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
        parts.push(`<path d="${d}" fill="none" stroke="${esc(line.color)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
      } else {
        const dash = line.style === "dashed" ? ` stroke-dasharray="12 8"` : "";
        // White casing separates overlapping lines, like the reference detail.
        parts.push(`<path d="${d}" fill="none" stroke="#fff" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`);
        parts.push(`<path d="${d}" fill="none" stroke="${esc(line.color)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`);
      }
    }
  }

  // Transfers: dashed footpaths between stations (AARC pointLinks).
  for (const tr of Object.values(map.transfers ?? {})) {
    const a = map.stations[tr.from];
    const b = map.stations[tr.to];
    if (!a || !b) continue;
    parts.push(`<line x1="${a.position.x}" y1="${a.position.y}" x2="${b.position.x}" y2="${b.position.y}" stroke="#333" stroke-width="3" stroke-dasharray="8 6" stroke-linecap="round"/>`);
    if (tr.label) {
      const mid = { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 };
      const txt = displayName(tr.label, "", map.style.labelLanguage);
      if (txt) {
        parts.push(`<rect x="${mid.x - 70}" y="${mid.y - 14}" width="140" height="28" rx="4" fill="#fff" opacity="0.85"/>`);
        parts.push(`<text x="${mid.x}" y="${mid.y}" text-anchor="middle" dominant-baseline="middle" font-family="${esc(map.style.fontFamily ?? "Noto Sans, sans-serif")}" font-size="${Math.round(map.style.fontSize * 0.8)}" fill="${esc(map.style.labelColor ?? "#000000")}">${esc(txt)}</text>`);
      }
    }
  }

  // Lines labels
  for (const line of Object.values(map.lines)) {
    // Cheap: place line label at first segment midpoint.
    const seg = line.segments[0];
    if (!seg) continue;
    const a = map.stations[seg.from]; const b = map.stations[seg.to];
    if (!a || !b) continue;
    const mid = { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 };
    parts.push(`<text x="${mid.x}" y="${mid.y}" text-anchor="middle" dy="-0.5em" font-family="${esc(map.style.fontFamily ?? "Noto Sans, sans-serif")}" font-size="${map.style.fontSize}" font-weight="600" fill="${esc(map.style.labelColor ?? "#000000")}" stroke="${esc(map.style.background)}" stroke-width="4" paint-order="stroke">${esc(displayName(line.name, "Line", map.style.labelLanguage))}</text>`);
  }

  // Stations
  for (const s of Object.values(map.stations)) {
    const r = map.style.stationRadius;
    const isSel = opts.selectedId === s.id;
    const lineColor = Object.values(map.lines).find((l) =>
      l.segments.some((seg) => seg.from === s.id || seg.to === s.id),
    )?.color;
    const stroke = isSel ? "#0B5FFF" : (lineColor ?? "#111");
    const rot = s.rotation ? ` transform="rotate(${s.rotation} ${s.position.x} ${s.position.y})"` : "";
    // White halo hides line casings notching into the station disc.
    parts.push(`<circle cx="${s.position.x}" cy="${s.position.y}" r="${r + 5}" fill="#fff"/>`);
    if (s.kind === "interchange") {
      parts.push(`<g data-station="${esc(s.id)}"${rot}><circle cx="${s.position.x}" cy="${s.position.y}" r="${r}" fill="#fff" stroke="${stroke}" stroke-width="2.5"/><circle cx="${s.position.x}" cy="${s.position.y}" r="${r + 7}" fill="none" stroke="${stroke}" stroke-width="2" opacity="0.9"/></g>`);
    } else if (s.kind === "terminus") {
      parts.push(`<g data-station="${esc(s.id)}"${rot}><rect x="${s.position.x - r}" y="${s.position.y - r}" width="${r * 2}" height="${r * 2}" rx="3" fill="#fff" stroke="${stroke}" stroke-width="2.5"/></g>`);
    } else {
      parts.push(`<g data-station="${esc(s.id)}"${rot}><circle cx="${s.position.x}" cy="${s.position.y}" r="${r}" fill="#fff" stroke="${stroke}" stroke-width="2.5"/></g>`);
    }
    const lp = stationLabelPos(map, s.id);
    let name = displayName(s.name, "Untitled station", map.style.labelLanguage);
    if (map.style.textTransform === "uppercase") name = name.toUpperCase();
    else if (map.style.textTransform === "lowercase") name = name.toLowerCase();
    const labelRot = s.rotation ? ` transform="rotate(${s.rotation} ${lp.x} ${lp.y})"` : "";
    const ls = map.style.letterSpacing ? ` letter-spacing="${map.style.letterSpacing}"` : "";
    const fs = map.style.fontStyle && map.style.fontStyle !== "normal" ? ` font-style="${esc(map.style.fontStyle)}"` : "";
    const fw = map.style.fontWeight ? ` font-weight="${map.style.fontWeight}"` : "";
    parts.push(`<text${labelRot} x="${lp.x}" y="${lp.y}" text-anchor="${anchorTextAnchor(s.labelAnchor)}" dominant-baseline="${anchorBaseline(s.labelAnchor)}" font-family="${esc(map.style.fontFamily ?? "Noto Sans, sans-serif")}" font-size="${map.style.fontSize}" fill="${esc(map.style.labelColor ?? "#000000")}"${fs}${fw}${ls}>${esc(name)}</text>`);
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

/** Rasterize an SVG string to PNG at the given scale (browser only). */
export function svgToPNG(svg: string, scale = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => {
      const w = Math.round((img.naturalWidth || img.width) * scale) || 800;
      const h = Math.round((img.naturalHeight || img.height) * scale) || 600;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("Canvas is not available in this browser"));
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to encode PNG. Try exporting SVG instead."));
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read SVG. Try exporting SVG instead."));
    };
    img.src = url;
  });
}

export async function downloadPNG(map: MetroMap, filename: string): Promise<void> {
  const svg = toSVGString(map, { showGrid: false });
  const blob = await svgToPNG(svg, 2);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * PDF via the browser print path: open a clean page with the SVG and invoke
 * print (the user picks “Save as PDF”). No Rust/print-js dependency (MIT-safe).
 */
export function printPDF(map: MetroMap): void {
  const svg = toSVGString(map, { showGrid: false });
  const title = map.meta.title || "Map";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{margin:24px}svg{max-width:100%;height:auto}</style></head><body>${svg}</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const w = window.open(url, "_blank", "noopener");
  if (!w) {
    URL.revokeObjectURL(url);
    throw new Error("Unable to open print view. Allow popups for Nodal, then export PDF again.");
  }
  w.addEventListener("load", () => {
    w.focus();
    w.print();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
}
