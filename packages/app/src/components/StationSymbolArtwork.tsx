import type { StationSymbol, StationSymbolLayer } from "@nodal/core";

export function StationSymbolArtwork({ symbol }: { symbol: StationSymbol }) {
  return <>{symbol.layers.map((layer) => <StationSymbolShape key={layer.id} layer={layer} />)}</>;
}

export function StationSymbolShape({ layer }: { layer: StationSymbolLayer }) {
  const transform = `translate(${layer.x} ${layer.y}) rotate(${layer.rotation})${layer.matrix ? ` matrix(${layer.matrix.join(" ")})` : ""}`;
  return (
    <g transform={transform} fill={layer.fill} stroke={layer.stroke} strokeWidth={layer.strokeWidth}>
      {layer.type === "circle" && <ellipse rx={layer.width / 2} ry={layer.height / 2} />}
      {layer.type === "rect" && <rect x={-layer.width / 2} y={-layer.height / 2} width={layer.width} height={layer.height} />}
      {layer.type === "line" && <line x1={-layer.width / 2} y1={-layer.height / 2} x2={layer.width / 2} y2={layer.height / 2} />}
      {layer.type === "path" && <path d={layer.d} />}
    </g>
  );
}
