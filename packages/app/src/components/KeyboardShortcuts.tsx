import { useEditor } from "../store/useEditor.js";
import { CloseIcon, KeyboardIcon } from "./Icons.js";

export function KeyboardShortcuts() {
  const shortcutsOpen = useEditor((s) => s.shortcutsOpen);
  const setShortcutsOpen = useEditor((s) => s.setShortcutsOpen);

  if (!shortcutsOpen) return null;

  const shortcuts: { key: string; desc: string; category: string }[] = [
    { key: "V", desc: "Select Tool", category: "Tools" },
    { key: "A", desc: "Add Station Tool", category: "Tools" },
    { key: "C", desc: "Connect Stations Tool", category: "Tools" },
    { key: "H", desc: "Pan Hand Tool", category: "Tools" },
    { key: "Space + Drag", desc: "Temporary Pan Hand", category: "Navigation" },
    { key: "Scroll Wheel", desc: "Zoom to Cursor", category: "Navigation" },
    { key: "Ctrl + + / -", desc: "Zoom In / Out", category: "Navigation" },
    { key: "F", desc: "Fit All in View", category: "Navigation" },
    { key: "Ctrl + Z", desc: "Undo Edit", category: "Edit" },
    { key: "Ctrl + Shift + Z", desc: "Redo Edit", category: "Edit" },
    { key: "Ctrl + D", desc: "Duplicate Selected Station", category: "Edit" },
    { key: "Delete / Backspace", desc: "Delete Selected Station", category: "Edit" },
    { key: "Esc", desc: "Deselect / Cancel Connect", category: "Selection" },
    { key: "Ctrl + '", desc: "Toggle Grid", category: "View" },
    { key: "Ctrl + ;", desc: "Toggle Snap to Grid", category: "View" },
    { key: "Ctrl + R", desc: "Toggle Rulers", category: "View" },
  ];

  return (
    <div className="kbd-overlay" role="dialog" aria-modal="true" onClick={() => setShortcutsOpen(false)}>
      <div className="kbd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="kbd-head">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KeyboardIcon />
            <h2 className="kbd-title">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            className="btn btn-tool icon-btn"
            onClick={() => setShortcutsOpen(false)}
            aria-label="Close shortcuts"
          >
            <CloseIcon />
          </button>
        </div>

        <table className="kbd-table">
          <thead>
            <tr style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-11)", textTransform: "uppercase" }}>
              <th style={{ textAlign: "left", padding: "4px 8px" }}>Key</th>
              <th style={{ textAlign: "left", padding: "4px 8px" }}>Action</th>
              <th style={{ textAlign: "left", padding: "4px 8px" }}>Category</th>
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

