import { useEditor, type Tool } from "../store/useEditor.js";
import { AddStationIcon, ConnectIcon, PanIcon, SelectIcon } from "./Icons.js";

/** Adobe-style vertical tools dock (H). */
export function ToolsDock() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);

  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: "select", label: "Select (V)", icon: <SelectIcon /> },
    { id: "add-station", label: "Add station (A)", icon: <AddStationIcon /> },
    { id: "connect", label: "Connect stations (C)", icon: <ConnectIcon /> },
    { id: "pan", label: "Pan (H) — hold Space to pan", icon: <PanIcon /> },
  ];

  return (
    <nav className="tools-dock" aria-label="Tools">
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          className="dock-btn"
          aria-label={t.label}
          title={t.label}
          aria-pressed={tool === t.id}
          onClick={() => setTool(t.id)}
        >
          {t.icon}
        </button>
      ))}
      <span className="dock-sep" aria-hidden="true" />
      <span className="dock-hint" aria-hidden="true">V · A · C · H</span>
    </nav>
  );
}
