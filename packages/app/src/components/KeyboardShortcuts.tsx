import { t } from "../i18n.js";
import { useEditor } from "../store/useEditor.js";
import { CloseIcon, KeyboardIcon } from "./Icons.js";

export function KeyboardShortcuts() {
  const shortcutsOpen = useEditor((s) => s.shortcutsOpen);
  const setShortcutsOpen = useEditor((s) => s.setShortcutsOpen);
  const uiLang = useEditor((s) => s.uiLang);
  const tr = (k: string) => t(uiLang, k);

  if (!shortcutsOpen) return null;

  const shortcuts: { key: string; desc: string; category: string }[] = [
    { key: "V", desc: tr("ToolSelect"), category: tr("View") },
    { key: "A", desc: tr("ToolAddStation"), category: tr("View") },
    { key: "C", desc: tr("ToolConnect"), category: tr("View") },
    { key: "H", desc: tr("ToolPan"), category: tr("View") },
    { key: "Space + Drag", desc: tr("ToolHelpPan"), category: tr("View") },
    { key: "Scroll Wheel", desc: `${tr("ZoomIn")} / ${tr("ZoomOut")}`, category: tr("View") },
    { key: "Ctrl + + / -", desc: `${tr("ZoomIn")} / ${tr("ZoomOut")}`, category: tr("View") },
    { key: "F", desc: tr("FitView"), category: tr("View") },
    { key: "Ctrl + Z", desc: tr("Undo"), category: tr("Edit") },
    { key: "Ctrl + Shift + Z", desc: tr("Redo"), category: tr("Edit") },
    { key: "Ctrl + D", desc: tr("DuplicateStation"), category: tr("Edit") },
    { key: "Delete / Backspace", desc: tr("DeleteSelected"), category: tr("Edit") },
    { key: "Esc", desc: tr("NoSelection"), category: tr("Edit") },
    { key: "Ctrl + '", desc: tr("ToggleGrid"), category: tr("View") },
    { key: "Ctrl + ;", desc: tr("ToggleSnap"), category: tr("View") },
    { key: "Ctrl + R", desc: tr("ToggleRulers"), category: tr("View") },
  ];

  return (
    <div className="kbd-overlay" role="dialog" aria-modal="true" onClick={() => setShortcutsOpen(false)}>
      <div className="kbd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="kbd-head">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KeyboardIcon />
            <h2 className="kbd-title">{tr("KeyboardShortcutsTitle")}</h2>
          </div>
          <button
            type="button"
            className="btn btn-tool icon-btn"
            onClick={() => setShortcutsOpen(false)}
            aria-label={tr("CloseShortcuts")}
          >
            <CloseIcon />
          </button>
        </div>

        <table className="kbd-table">
          <thead>
            <tr style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-11)", textTransform: "uppercase" }}>
              <th style={{ textAlign: "left", padding: "4px 8px" }}>{tr("KeyCol")}</th>
              <th style={{ textAlign: "left", padding: "4px 8px" }}>{tr("ActionCol")}</th>
              <th style={{ textAlign: "left", padding: "4px 8px" }}>{tr("CategoryCol")}</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map((s, idx) => (
              <tr key={idx}>
                <td><kbd>{s.key}</kbd></td>
                <td>{s.desc}</td>
                <td style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-11)" }}>{s.category}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-primary" onClick={() => setShortcutsOpen(false)}>
            {tr("Done")}
          </button>
        </div>
      </div>
    </div>
  );
}
