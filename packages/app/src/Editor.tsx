import { useEffect } from "react";
import "./styles/editor.css";
import { MenuBar } from "./components/MenuBar.js";
import { Toolbar } from "./components/Toolbar.js";
import { ToolsDock } from "./components/ToolsDock.js";
import { StartupWindow } from "./components/StartupWindow.js";
import { Canvas } from "./components/Canvas.js";
import { LinesPanel, PropertiesPanel } from "./components/Panels.js";
import { StatusBar } from "./components/StatusBar.js";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts.js";
import { useEditor } from "./store/useEditor.js";

export function Editor() {
  const error = useEditor((s) => s.error);
  const setError = useEditor((s) => s.setError);
  const toast = useEditor((s) => s.toast);
  const clearToast = useEditor((s) => s.clearToast);
  const undo = useEditor((s) => s.undo);
  const theme = useEditor((s) => s.theme);
  const startupOpen = useEditor((s) => s.startupOpen);
  const setStartupOpen = useEditor((s) => s.setStartupOpen);

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);

  // Preload the theme addon online at boot so it is active on first paint.
  useEffect(() => {
    const savedUi = (() => {
      try {
        return localStorage.getItem("nodal:theme-addon");
      } catch {
        return null;
      }
    })();
    if (!savedUi) return;
    const url = "https://cdn.jsdelivr.net/gh/xft0729/nodal-addon-theme@main/dist/apply.js";
    (import(/* @vite-ignore */ url) as Promise<unknown>)
      .then((mod) => {
        const applyUiTheme = (mod as { applyUiTheme: (id: string) => void }).applyUiTheme;
        if (applyUiTheme) applyUiTheme(savedUi);
      })
      .catch(() => { /* offline: stock light/dark stays */ });
  }, []);

  return (
    <div className="app-shell">
      <MenuBar />
      <Toolbar />
      <ToolsDock />
      <LinesPanel />
      <Canvas />
      <PropertiesPanel />
      <StatusBar />

      {error && (
        <div
          role="alert"
          style={{
            position: "absolute",
            top: "calc(var(--toolbar-h) + var(--menubar-h) + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            right: 16,
            maxWidth: 640,
            zIndex: 100,
          }}
        >
          <div className="error-banner">
            <span style={{ flex: 1 }}>{error}</span>
            <button type="button" className="btn btn-sm" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => {
              undo();
              clearToast();
            }}
          >
            Undo
          </button>
          <button type="button" onClick={clearToast}>
            Close
          </button>
        </div>
      )}

      {startupOpen && <StartupWindow onClose={() => setStartupOpen(false)} />}
      <KeyboardShortcuts />
    </div>
  );
}
