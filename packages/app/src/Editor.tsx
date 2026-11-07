import "./styles/editor.css";
import { Toolbar } from "./components/Toolbar.js";
import { Canvas } from "./components/Canvas.js";
import { LinesPanel, PropertiesPanel } from "./components/Panels.js";
import { StatusBar } from "./components/StatusBar.js";
import { useEditor } from "./store/useEditor.js";

export function Editor() {
  const error = useEditor((s) => s.error);
  const setError = useEditor((s) => s.setError);
  const toast = useEditor((s) => s.toast);
  const clearToast = useEditor((s) => s.clearToast);
  const undo = useEditor((s) => s.undo);

  return (
    <div className="app-shell">
      <Toolbar />
      <LinesPanel />
      <Canvas />
      <PropertiesPanel />
      <StatusBar />

      {error && (
        <div
          role="alert"
          style={{ position: "absolute", top: "calc(var(--toolbar-h) + 8px)", left: "50%", transform: "translateX(-50%)", right: 16, maxWidth: 640 }}
        >
          <div className="error-banner">
            <span style={{ flex: 1 }}>{error}</span>
            <button type="button" className="btn btn-sm" onClick={() => setError(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => { undo(); clearToast(); }}>Undo</button>
          <button type="button" onClick={clearToast}>Close</button>
        </div>
      )}
    </div>
  );
}
