import { createId, type StationSymbol } from "@nodal/core";

type Matrix = [number, number, number, number, number, number];
type Paint = { fill: string; stroke: string; strokeWidth: number };
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const NUMBER = "[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?";
const NUMBER_RE = new RegExp(`^${NUMBER}$`);
const SVG_NS = "http://www.w3.org/2000/svg";
const COLORS: Record<string, string> = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000",
  blue: "#0000ff", yellow: "#ffff00", cyan: "#00ffff", aqua: "#00ffff",
  magenta: "#ff00ff", fuchsia: "#ff00ff", gray: "#808080", grey: "#808080",
  silver: "#c0c0c0", maroon: "#800000", olive: "#808000", lime: "#00ff00",
  teal: "#008080", navy: "#000080", purple: "#800080", orange: "#ffa500",
  rebeccapurple: "#663399",
};

function fail(message: string): never {
  throw new Error(`Cannot import SVG: ${message}`);
}

function number(value: string, label: string, max = 100000): number {
  const text = value.trim();
  const result = Number(text);
  if (!NUMBER_RE.test(text) || !Number.isFinite(result) || Math.abs(result) > max) {
    fail(`${label} must be a finite number within +/-${max}.`);
  }
  return result;
}

function numbers(value: string, label: string): number[] {
  const tokens = value.trim().match(new RegExp(NUMBER, "g")) ?? [];
  const residue = value.replace(new RegExp(NUMBER, "g"), " ");
  if (/[^\s,]/.test(residue) || /^\s*,|,\s*,|,\s*$/.test(value)) fail(`Invalid ${label}.`);
  return tokens.map((token) => number(token, label));
}

function multiply(a: Matrix, b: Matrix): Matrix {
  const result: Matrix = [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
  ];
  if (result.some((n) => !Number.isFinite(n) || Math.abs(n) > 1e12)) fail("Transform is too large.");
  return result;
}

function translate(x: number, y: number): Matrix {
  return [1, 0, 0, 1, x, y];
}

function transform(source: string): Matrix {
  let result: Matrix = [...IDENTITY];
  let rest = source.trim();
  while (rest) {
    const match = /^([a-zA-Z]+)\s*\(([^()]*)\)/.exec(rest);
    if (!match) fail("Invalid transform syntax.");
    const op = match[1]!;
    const args = numbers(match[2]!, "transform");
    const [a = 0, b = 0, c = 0] = args;
    let next: Matrix;
    if (op === "matrix" && args.length === 6) {
      next = args as Matrix;
    } else if (op === "translate" && (args.length === 1 || args.length === 2)) {
      next = translate(a, b);
    } else if (op === "scale" && (args.length === 1 || args.length === 2)) {
      next = [a, 0, 0, args[1] ?? a, 0, 0];
    } else if (op === "rotate" && (args.length === 1 || args.length === 3)) {
      const radians = a * Math.PI / 180;
      const rotation: Matrix = [Math.cos(radians), Math.sin(radians), -Math.sin(radians), Math.cos(radians), 0, 0];
      next = multiply(multiply(translate(b, c), rotation), translate(-b, -c));
    } else if ((op === "skewX" || op === "skewY") && args.length === 1) {
      if (Math.abs(Math.cos(a * Math.PI / 180)) < 1e-10) fail("Singular skew transform.");
      const tangent = Math.tan(a * Math.PI / 180);
      next = op === "skewX" ? [1, 0, tangent, 1, 0, 0] : [1, tangent, 0, 1, 0, 0];
    } else {
      fail(`Unsupported or malformed transform ${op}.`);
    }
    result = multiply(result, next);
    rest = rest.slice(match[0].length).trimStart();
    if (rest.startsWith(",")) {
      rest = rest.slice(1).trimStart();
      if (!rest) fail("Invalid transform syntax.");
    }
  }
  return result;
}

function color(source: string): string {
  const value = source.trim().toLowerCase();
  if (value === "none") return "none";
  if (value === "currentcolor") return "currentColor";
  if (COLORS[value]) return COLORS[value]!;
  if (/^#[\da-f]{3}$/.test(value)) return `#${value.slice(1).split("").map((c) => c + c).join("")}`;
  if (/^#[\da-f]{6}$/.test(value)) return value;
  const rgb = /^rgb\(\s*([^()]*)\s*\)$/.exec(value);
  if (rgb) {
    const parts = rgb[1]!.trim().split(/\s*,\s*|\s+/);
    if (parts.length === 3) {
      const channels = parts.map((part) => {
        const percent = part.endsWith("%");
        const n = number(percent ? part.slice(0, -1) : part, "RGB color", 255);
        if (n < 0 || n > (percent ? 100 : 255)) fail("RGB color is out of range.");
        return Math.round(percent ? n * 255 / 100 : n).toString(16).padStart(2, "0");
      });
      return `#${channels.join("")}`;
    }
  }
  fail(`Unsupported paint "${source}". Use solid hex/RGB colors, common named colors, currentColor, or none; convert gradients first.`);
}

function pathData(source: string): string {
  if (!source.trim() || source.length > 20000) fail("Path data must contain 1 to 20000 characters.");
  const tokens = source.match(new RegExp(`[a-zA-Z]|${NUMBER}`, "g")) ?? [];
  if (/[^\s,]/.test(source.replace(new RegExp(`[a-zA-Z]|${NUMBER}`, "g"), " ")) || /^\s*,|,\s*,|,\s*$|[a-zA-Z]\s*,|,\s*[a-zA-Z]/.test(source)) {
    fail("Invalid path data.");
  }
  const arities: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  if (tokens[0]?.toUpperCase() !== "M") fail("Paths must begin with a move command.");
  let index = 0;
  while (index < tokens.length) {
    const command = tokens[index++]!.toUpperCase();
    const arity = arities[command];
    if (arity === undefined) fail(`Unsupported path command ${command}.`);
    let count = 0;
    while (index < tokens.length && NUMBER_RE.test(tokens[index]!)) {
      const n = number(tokens[index++]!, "path coordinate");
      if (command === "A") {
        const position = count % 7;
        if ((position === 0 || position === 1) && n < 0) fail("Arc radii cannot be negative.");
        if ((position === 3 || position === 4) && n !== 0 && n !== 1) fail("Arc flags must be 0 or 1.");
      }
      count++;
    }
    if (arity === 0 ? count !== 0 : count === 0 || count % arity !== 0) fail(`Invalid arguments for path command ${command}.`);
  }
  return source.trim();
}

const COMMON = new Set(["id", "transform", "fill", "stroke", "stroke-width", "style", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "fill-rule"]);
const GEOMETRY: Record<string, string[]> = {
  svg: ["xmlns", "version", "width", "height", "viewBox", "preserveAspectRatio"], g: [],
  circle: ["cx", "cy", "r"], ellipse: ["cx", "cy", "rx", "ry"],
  rect: ["x", "y", "width", "height", "rx", "ry"], line: ["x1", "y1", "x2", "y2"],
  path: ["d"], polygon: ["points"], polyline: ["points"],
};

function paintFor(element: Element, parent: Paint): Paint {
  const result = { ...parent };
  const properties = new Map<string, string>();
  for (const attribute of Array.from(element.attributes)) {
    if (attribute.name !== "style") properties.set(attribute.name, attribute.value);
  }
  const style = element.getAttribute("style");
  if (style) {
    for (const declaration of style.split(";")) {
      if (!declaration.trim()) continue;
      const match = /^\s*([a-z-]+)\s*:\s*([^:]+?)\s*$/.exec(declaration);
      if (!match) fail("Invalid inline style.");
      const property = match[1]!;
      if (!["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "fill-rule"].includes(property)) {
        fail(`Unsupported style ${property}. Convert text, effects, and gradients to simple paths first.`);
      }
      properties.set(property, match[2]!);
    }
  }
  for (const [key, value] of properties) {
    if (value.trim() === "inherit") continue;
    if (key === "fill" || key === "stroke") result[key] = color(value);
    if (key === "stroke-width") {
      result.strokeWidth = number(value, "stroke width");
      if (result.strokeWidth < 0) fail("Stroke width cannot be negative.");
    }
    const defaults: Record<string, string> = { "stroke-linecap": "butt", "stroke-linejoin": "miter", "stroke-miterlimit": "4", "fill-rule": "nonzero" };
    if (key in defaults && value.trim() !== defaults[key]) fail(`Unsupported ${key}=${value}. Outline strokes or convert artwork to simple filled paths first.`);
  }
  return result;
}

/** Imports only structured, editable geometry. The parsed SVG is never mounted. */
export function importStationSymbolSVG(source: string, name: string): StationSymbol {
  if (source.length > 200000 || new TextEncoder().encode(source).length > 200000) fail("SVG exceeds the 200 KB limit.");
  if (/<!DOCTYPE|<!ENTITY|<\?/i.test(source.replace(/^\s*<\?xml\s[^?]*\?>/i, ""))) fail("Document types, entities, and processing instructions are not supported.");
  if (typeof DOMParser === "undefined") fail("SVG import requires a browser DOMParser.");
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  const root = document.documentElement;
  if (!root || document.getElementsByTagName("parsererror").length || root.localName !== "svg") fail("Malformed SVG document.");
  const viewBox = root.getAttribute("viewBox");
  let box: number[];
  if (viewBox !== null) {
    box = numbers(viewBox, "viewBox");
    if (box.length !== 4) fail("viewBox must contain four numbers.");
  } else {
    const dimension = (attribute: string) => {
      const value = root.getAttribute(attribute);
      if (value === null) fail("SVG needs a viewBox or numeric width and height.");
      return number(value.replace(/px\s*$/, ""), attribute);
    };
    box = [0, 0, dimension("width"), dimension("height")];
  }
  const [minX = 0, minY = 0, width = 0, height = 0] = box;
  if (width <= 0 || height <= 0) fail("SVG dimensions must be positive.");
  const scale = 40 / Math.max(width, height);
  const normalization: Matrix = [scale, 0, 0, scale, -(minX + width / 2) * scale, -(minY + height / 2) * scale];
  const layers: StationSymbol["layers"] = [];
  let elementCount = 0;
  const visit = (element: Element, inherited: Paint, parentMatrix: Matrix, depth: number): void => {
    if (++elementCount > 1000 || depth > 100) fail("SVG structure is too complex.");
    const tag = element.localName;
    if (element.namespaceURI && element.namespaceURI !== SVG_NS) fail("Foreign XML namespaces are not supported.");
    if (["title", "desc", "metadata"].includes(tag)) return;
    if (!Object.hasOwn(GEOMETRY, tag) || (tag === "svg" && element !== root)) fail(`Unsupported <${tag}>. Convert text, images, effects, and gradients to simple paths first.`);
    for (const attribute of Array.from(element.attributes)) {
      if (!COMMON.has(attribute.name) && !GEOMETRY[tag]!.includes(attribute.name)) fail(`Unsupported attribute ${attribute.name} on <${tag}>. Remove scripts, references, and effects before importing.`);
      if (/url\s*\(|javascript:|data:|@import/i.test(attribute.value)) fail("External references and paint servers are not supported.");
    }
    if (element === root && element.hasAttribute("preserveAspectRatio") && !["xMidYMid meet", "xMidYMid"].includes(element.getAttribute("preserveAspectRatio")!.trim())) fail("Only centered, aspect-preserving SVG viewports are supported.");
    const paint = paintFor(element, inherited);
    let matrix = multiply(parentMatrix, transform(element.getAttribute("transform") ?? ""));
    const get = (key: string, fallback = 0) => element.hasAttribute(key) ? number(element.getAttribute(key)!, key) : fallback;
    let type: "circle" | "rect" | "line" | "path" = "path";
    let w = 0;
    let h = 0;
    let d: string | undefined;
    if (tag === "circle" || tag === "ellipse") {
      type = "circle";
      w = 2 * get(tag === "circle" ? "r" : "rx");
      h = tag === "circle" ? w : 2 * get("ry");
      matrix = multiply(matrix, translate(get("cx"), get("cy")));
    } else if (tag === "rect") {
      type = "rect";
      w = get("width"); h = get("height");
      if (get("rx") !== 0 || get("ry") !== 0) fail("Rounded rectangles must be converted to paths first.");
      matrix = multiply(matrix, translate(get("x") + w / 2, get("y") + h / 2));
    } else if (tag === "line") {
      type = "line";
      const x1 = get("x1"), y1 = get("y1"), x2 = get("x2"), y2 = get("y2");
      w = Math.abs(x2 - x1); h = Math.abs(y2 - y1);
      matrix = multiply(matrix, [x2 < x1 ? -1 : 1, 0, 0, y2 < y1 ? -1 : 1, (x1 + x2) / 2, (y1 + y2) / 2]);
    } else if (tag === "path") {
      d = pathData(element.getAttribute("d") ?? "");
    } else if (tag === "polygon" || tag === "polyline") {
      const points = numbers(element.getAttribute("points") ?? "", "points");
      if (points.length < (tag === "polygon" ? 6 : 4) || points.length % 2) fail("Invalid polygon/polyline points.");
      d = pathData(`M ${points[0]} ${points[1]} L ${points.slice(2).join(" ")}${tag === "polygon" ? " Z" : ""}`);
    }
    if (tag !== "svg" && tag !== "g") {
      if (w < 0 || h < 0 || w > 100000 || h > 100000) fail("Shape dimensions must be between 0 and 100000.");
      if (matrix.some((n) => Math.abs(n) > 10000)) fail("Normalized transform exceeds supported bounds.");
      if (layers.length >= 100) fail("SVG exceeds the 100 layer limit.");
      layers.push({ id: createId(), type, x: 0, y: 0, width: w, height: h, ...paint, rotation: 0, matrix, ...(d === undefined ? {} : { d }) });
    }
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 1) {
        if (tag !== "svg" && tag !== "g") fail("Shapes cannot contain child elements.");
        visit(child as Element, paint, matrix, depth + 1);
      } else if ((child.nodeType === 3 || child.nodeType === 4) && child.textContent?.trim()) {
        fail("Visible text is not supported. Convert text to paths first.");
      } else if (child.nodeType === 7) fail("Processing instructions are not supported.");
    }
  };
  visit(root, { fill: "#000000", stroke: "none", strokeWidth: 1 }, normalization, 0);
  if (!layers.length) fail("SVG contains no supported artwork.");
  return { id: createId(), name: name.trim().slice(0, 100) || "Imported symbol", layers };
}
