import { useState } from "react";
import { useEditor } from "../store/useEditor.js";

/**
 * Station mark editor — the R03 / BL12·R10 / BL01 styles from the reference.
 * Pick a mark, then click a station (or it applies to the current selection).
 */
export function MarkEditor() {
  const [open, setOpen] = useState(false);
  const selectedStationId = useEditor((s) => s.selectedStationId);
  const setStationKind = useEditor((s) => s.setStationKind);
  const setToast = useEditor((s) => s.setToast);

  const apply = (kind: "normal" | "interchange" | "terminus") => {
    if (!selectedStationId) {
      setToast("Select a station first");
      return;
    }
    setStationKind(selectedStationId, kind);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button type="button" className="btn btn-sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Mark
      </button>
      {open && (
        <div className="menu-pop" role="menu" style={{ minWidth: 280 }}>
          <p style={{ margin: "4px 8px", fontSize: 11, color: "var(--color-text-secondary)" }}>
            Applies to the selected station.
          </p>
          <button type="button" role="menuitem" className="menu-item" onClick={() => apply("normal")}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="34" height="18" viewBox="0 0 34 18" aria-hidden="true">
                <rect x="1" y="1" width="16" height="16" rx="4" fill="none" stroke="#E00034" strokeWidth="2.5" />
              </svg>
              General — R03
            </span>
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={() => apply("interchange")}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="44" height="18" viewBox="0 0 44 18" aria-hidden="true">
                <rect x="1" y="1" width="19" height="16" rx="8" fill="none" stroke="#0067C0" strokeWidth="2.5" />
                <rect x="23" y="1" width="19" height="16" rx="8" fill="#E00034" />
              </svg>
              Transfer — BL12 · R10
            </span>
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={() => apply("terminus")}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="34" height="18" viewBox="0 0 34 18" aria-hidden="true">
                <rect x="1" y="1" width="16" height="16" rx="3" fill="none" stroke="#0067C0" strokeWidth="2.5" />
              </svg>
              Terminus — BL01
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
