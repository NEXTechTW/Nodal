import { useState } from "react";
import { useEditor } from "../store/useEditor.js";

const CDN = "https://cdn.jsdelivr.net/gh/xft0729/nodal-addon-theme@main";

/**
 * Online theme loader — fetches the published addon at runtime.
 * Nothing is bundled into the editor; if the network is down, themes
 * list as unavailable instead of crashing.
 */
export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [mapThemes, setMapThemes] = useState<{ id: string; name: string }[]>([]);
  const [uiThemes, setUiThemes] = useState<{ id: string; name: string }[]>([]);
  const [status, setStatus] = useState("Loading themes online…");
  const map = useEditor((s) => s.map);
  const loadMap = useEditor((s) => s.loadMap);
  const setToast = useEditor((s) => s.setToast);

  const loadOnline = async () => {
    setStatus("Loading themes online…");
    const dyn = (url: string) => (import(/* @vite-ignore */ url) as Promise<unknown>);
    try {
      const [mapMod, uiMod, applyMod] = await Promise.all([
        dyn(`${CDN}/dist/map-themes.js`),
        dyn(`${CDN}/dist/ui-themes.js`),
        dyn(`${CDN}/dist/apply.js`),
      ]);
      setMapThemes((mapMod as { MAP_THEMES: { id: string; name: string }[] }).MAP_THEMES);
      setUiThemes((uiMod as { UI_THEMES: { id: string; name: string }[] }).UI_THEMES);
      (window as unknown as { __nodalThemeApply?: unknown }).__nodalThemeApply = applyMod;
      setStatus("Online.");
    } catch {
      setStatus("Could not load themes online. Check your connection.");
    }
  };

  const apply = async (id: string) => {
    try {
      const dyn = (url: string) => (import(/* @vite-ignore */ url) as Promise<{ applyMapTheme: (m: unknown, id: string, o?: unknown) => unknown }>);
      const mod = (window as unknown as { __nodalThemeApply?: { applyMapTheme: (m: unknown, id: string, o?: unknown) => unknown } }).__nodalThemeApply
        ?? await dyn(`${CDN}/dist/apply.js`);
      const next = (mod as { applyMapTheme: (m: unknown, id: string, o?: unknown) => unknown }).applyMapTheme(map, id, { preserveLabelLanguage: true });
      loadMap(next as Parameters<typeof loadMap>[0]);
      setToast(`Theme applied: ${id}`);
    } catch {
      setToast("Cannot apply theme offline.");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-sm"
        aria-expanded={open}
        onClick={() => { setOpen((v) => !v); loadOnline(); }}
      >
        Themes (online)
      </button>
      {open && (
        <div className="menu-pop" role="menu" style={{ minWidth: 260, maxHeight: 320, overflowY: "auto" }}>
          <p style={{ margin: "4px 8px", fontSize: 11, color: "var(--color-text-secondary)" }}>
            {status} Source: {CDN}
          </p>
          {mapThemes.length === 0 && uiThemes.length === 0 && (
            <p style={{ margin: "4px 8px", fontSize: 11 }}>No themes loaded yet.</p>
          )}
          {mapThemes.map((t) => (
            <button key={t.id} type="button" role="menuitem" className="menu-item" onClick={() => apply(t.id)}>
              <span>{t.name}</span>
            </button>
          ))}
          {uiThemes.length > 0 && <div className="menu-divider" />}
          {uiThemes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={async () => {
                try {
                  const dyn = (url: string) => (import(/* @vite-ignore */ url) as Promise<{ applyUiTheme: (id: string) => () => void }>);
                  const mod = (window as unknown as { __nodalThemeApply?: { applyUiTheme: (id: string) => () => void } }).__nodalThemeApply
                    ?? await dyn(`${CDN}/dist/apply.js`);
                  (mod as { applyUiTheme: (id: string) => () => void }).applyUiTheme(t.id);
                } catch { /* offline */ }
                setOpen(false);
              }}
            >
              <span>{t.name} (UI)</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
