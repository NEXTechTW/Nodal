import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { UI_THEMES, useEditor } from "../store/useEditor.js";
import { PaletteIcon } from "./Icons.js";

export function isThemeAddonEnabled(): boolean {
  try {
    const raw = localStorage.getItem("nodal:addons");
    if (!raw) return true;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed["nodal-addon-theme"] !== false;
  } catch {
    return true;
  }
}

const UI_SWATCH: Record<string, string> = {
  light: "#1473e6",
  dark: "#2680eb",
  midnight: "#4cc9f0",
  forest: "#52d273",
  crimson: "#ff4d6d",
  solar: "#c25307",
  "high-contrast": "#0000c8",
  lavender: "#7c3aed",
  mint: "#059669",
  sky: "#0284c7",
  rose: "#e11d48",
  violet: "#a78bfa",
  teal: "#2dd4bf",
};

/**
 * Whole-app theme picker (nodal-addon-theme).
 * Icon-only trigger (palette). Menu is right-aligned so it never
 * overflows the viewport edge. App themes are bundled in tokens.css
 * and applied via the store, so toolbar, panels, menu bar and
 * canvas grid all change and persist across reload.
 */
export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const theme = useEditor((s) => s.theme);
  const setTheme = useEditor((s) => s.setTheme);
  const uiLang = useEditor((s) => s.uiLang);
  const tr = (k: string) => t(uiLang, k);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-tool icon-btn"
        aria-expanded={open}
        aria-label={tr("AppTheme")}
        title={tr("WholeAppTheme")}
        onClick={() => setOpen((v) => !v)}
      >
        <PaletteIcon />
      </button>
      {open && (
        <div
          className="menu-pop"
          role="menu"
          style={{
            right: 0,
            left: "auto",
            minWidth: 280,
            maxWidth: "min(320px, calc(100vw - 16px))",
            maxHeight: "min(75dvh, 480px)",
            overflowY: "auto",
            padding: 6,
          }}
        >
          <p style={{ margin: "4px 8px 2px", fontSize: 11, fontWeight: 700, color: "var(--color-text)" }}>
            {tr("WholeAppTheme")}
          </p>
          <p style={{ margin: "0 8px 6px", fontSize: 10, lineHeight: 1.4, color: "var(--color-text-secondary)" }}>
            {tr("WholeAppThemeDesc")}
          </p>
          {UI_THEMES.map((t) => {
            const isCur = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={isCur}
                className="menu-item"
                style={{
                  padding: "8px",
                  background: isCur ? "var(--color-accent-soft)" : undefined,
                  fontWeight: isCur ? 600 : 400,
                  alignItems: "center",
                }}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: UI_SWATCH[t.id] ?? "var(--color-accent)",
                      border: "1px solid var(--color-border-strong)",
                    }}
                  />
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.25, textAlign: "left" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                    <span style={{ fontSize: 10, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.hint}</span>
                  </span>
                </span>
                {isCur && (
                  <span aria-hidden="true" style={{ color: "var(--color-accent)", fontWeight: 700 }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
