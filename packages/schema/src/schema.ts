/**
 * JSON Schema for MetroMap v1 ??published alongside the format (PROJECT.md §3, §8).
 * `core.validateMap` is the runtime validator; this schema is for editors / docs.
 */
export const metroMapSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://nodal.app/schemas/metro-map.v1.json",
  title: "MetroMap",
  type: "object",
  required: ["schemaVersion", "meta", "stations", "lines", "labels", "style"],
  properties: {
    schemaVersion: { type: "integer", const: 1 },
    meta: {
      type: "object",
      required: ["title", "createdAt"],
      properties: {
        title: { type: "string" },
        author: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    stations: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["id", "name", "position", "kind", "labelAnchor"],
        properties: {
          id: { type: "string" },
          name: { type: "object", additionalProperties: { type: "string" } },
          position: {
            type: "object",
            required: ["x", "y"],
            properties: { x: { type: "number" }, y: { type: "number" } },
          },
          kind: { enum: ["normal", "interchange", "terminus"] },
          labelAnchor: { enum: ["N","NE","E","SE","S","SW","W","NW"] },
          labelOffset: {
            type: "object",
            properties: { x: { type: "number" }, y: { type: "number" } },
          },
          rotation: { type: "number", description: "Station rotation in degrees." },
          symbolId: { type: "string", description: "Key of a reusable mark in stationSymbols." },
        },
      },
    },
    stationSymbols: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["id", "name", "layers"],
        properties: {
          id: { type: "string", minLength: 1 },
          name: { type: "string" },
          layers: {
            type: "array",
            maxItems: 100,
            items: {
              type: "object",
              required: ["id", "type", "x", "y", "width", "height", "fill", "stroke", "strokeWidth", "rotation"],
              properties: {
                id: { type: "string", minLength: 1 },
                type: { enum: ["circle", "rect", "line", "path"] },
                x: { type: "number", minimum: -24, maximum: 24 },
                y: { type: "number", minimum: -24, maximum: 24 },
                width: { type: "number", minimum: 0, maximum: 100000 },
                height: { type: "number", minimum: 0, maximum: 100000 },
                fill: { type: "string", pattern: "^(?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|none|currentColor)$" },
                stroke: { type: "string", pattern: "^(?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|none|currentColor)$" },
                strokeWidth: { type: "number", minimum: 0, maximum: 100000 },
                rotation: { type: "number", minimum: -360, maximum: 360 },
                d: { type: "string", maxLength: 10000, pattern: "^\\s*[Mm][MmZzLlHhVvCcSsQqTtAa0-9eE+.,\\s-]*$" },
                matrix: { type: "array", minItems: 6, maxItems: 6, items: { type: "number", minimum: -10000, maximum: 10000 } },
              },
              allOf: [{ if: { properties: { type: { const: "path" } } }, then: { required: ["d"] } }],
            },
          },
        },
      },
    },
    lines: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["id", "name", "color", "segments", "style"],
        properties: {
          id: { type: "string" },
          name: { type: "object", additionalProperties: { type: "string" } },
          color: { type: "string", pattern: "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$" },
          style: { enum: ["solid", "dashed", "double"] },
          width: { type: "number", exclusiveMinimum: 0 },
          segments: {
            type: "array",
            items: {
              type: "object",
              required: ["from", "to"],
              properties: {
                from: { type: "string" },
                to: { type: "string" },
                waypoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { x: { type: "number" }, y: { type: "number" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    transfers: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["id", "from", "to"],
        properties: {
          id: { type: "string" },
          from: { type: "string" },
          to: { type: "string" },
          label: { type: "object", additionalProperties: { type: "string" } },
        },
      },
    },
    labels: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["id", "targetId", "targetKind", "text", "position", "anchor"],
        properties: {
          id: { type: "string" },
          targetId: { type: "string" },
          targetKind: { enum: ["station", "line"] },
          text: { type: "object", additionalProperties: { type: "string" } },
          position: {
            type: "object",
            properties: { x: { type: "number" }, y: { type: "number" } },
          },
          anchor: { enum: ["N","NE","E","SE","S","SW","W","NW"] },
        },
      },
    },
    style: {
      type: "object",
      required: ["background", "gridStep", "cornerRadius", "labelLanguage", "fontSize", "stationRadius"],
      properties: {
        background: { type: "string", pattern: "^#" },
        gridStep: { type: "number", exclusiveMinimum: 0 },
        cornerRadius: { type: "number", minimum: 0 },
        snap45: { type: "boolean", deprecated: true, description: "Deprecated and ignored; kept so older files still validate." },
        labelLanguage: { type: "string" },
        labelColor: { type: "string", pattern: "^#" },
        fontWeight: { type: "number" },
        fontStyle: { type: "string", enum: ["normal", "italic"] },
        textTransform: { type: "string", enum: ["none", "uppercase", "lowercase"] },
        letterSpacing: { type: "number" },
        fontFamily: { type: "string" },
        fontSize: { type: "number", exclusiveMinimum: 0 },
        stationRadius: { type: "number", exclusiveMinimum: 0 },
      },
    },
  },
} as const;
