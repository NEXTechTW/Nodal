import type { ID } from "./types.js";

/** Zero-dependency ID generator (UUID v4 via Web Crypto, fallback). */
export function createId(): ID {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Fallback: timestamp + random (not cryptographic).
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isId(value: unknown): value is ID {
  return typeof value === "string" && value.length > 0;
}
