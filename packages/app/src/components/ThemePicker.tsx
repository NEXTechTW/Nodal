import { useState } from "react";
import { MAP_THEMES } from "../../node_modules/nodal-addon-theme/dist/map-themes.js";
import { UI_THEMES } from "../../node_modules/nodal-addon-theme/dist/ui-themes.js";
import { applyMapTheme } from "../../node_modules/nodal-addon-theme/dist/apply.js";
import { applyUiTheme } from "../../node_modules/nodal-addon-theme/dist/apply.js";
import { useEditor } from "../store/useEditor.js";

/** Map + UI theme pickers powered by nodal-addon-theme. */
export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const map = useEditor((s) => s.map);
  const loadMap = useEditor((s) => s.loadMap);
  const setToast = useEditor((s) => s.setToast);

  const apply = (id: string) => {
    try {
      const next = applyMapTheme(map, id, { preserveLabelLanguage: true });
      loadMap(next);
      setToast(`Theme applied: ${id}`);
      setOpen(false);
    } catch (e) {
      setToast(`Cannot apply ${id}: ${e instanceof Error ? e.message : "error"}`);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button type="button" className="btn btn-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Themes
      </button>
      {open && (
        <div className="menu-pop" role="menu" style={{ minWidth: 260, maxHeight: 320, overflowY: "auto" }}>
          <p style={{ margin: "4px 8px", fontSize: 11, color: "var(--color-text-secondary)" }}>Map themes</p>
          {MAP_THEMES.map((t) => (
            <button key={t.id} type="button" role="menuitem" className="menu-item" onClick={() => apply(t.id)}>
              <span>{t.name}</span>
            </button>
          ))}
          <div className="menu-divider" />
          <p style={{ margin: "4px 8px", fontSize: 11, color: "var(--color-text-secondary)" }}>UI themes</p>
          {UI_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => { applyUiTheme(t.id); setOpen(false); }}
            >
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
