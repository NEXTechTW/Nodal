import { useEditor, type Tool } from "../store/useEditor.js";
import {
  AddStationIcon,
  ConnectIcon,
  GridIcon,
  PanIcon,
  RulersIcon,
  SelectIcon,
  SnapIcon,
} from "./Icons.js";

/** Clean Adobe-style vertical tool dock with icon buttons and tooltips. */
export function ToolsDock() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const showGrid = useEditor((s) => s.showGrid);
  const toggleGrid = useEditor((s) => s.toggleGrid);
  const snapToGrid = useEditor((s) => s.snapToGrid);
  const toggleSnap = useEditor((s) => s.toggleSnap);
  const showRulers = useEditor((s) => s.showRulers);
  const toggleRulers = useEditor((s) => s.toggleRulers);

  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: "select", label: "Select (V)", icon: <SelectIcon /> },
    { id: "add-station", label: "Add Station (A)", icon: <AddStationIcon /> },
    { id: "connect", label: "Connect Stations (C)", icon: <ConnectIcon /> },
    { id: "pan", label: "Hand / Pan (H)", icon: <PanIcon /> },
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

      <div className="dock-sep" aria-hidden="true" />

      {/* Grid Toggle */}
      <button
        type="button"
        className="dock-btn"
        aria-label="Toggle Grid (Ctrl+')"
        title="Toggle Grid (Ctrl+')"
        aria-pressed={showGrid}
        onClick={toggleGrid}
      >
        <GridIcon />
      </button>

      {/* Snap to Grid Toggle */}
      <button
        type="button"
        className="dock-btn"
        aria-label="Toggle Snap to Grid (Ctrl+;)"
        title="Toggle Snap to Grid (Ctrl+;)"
        aria-pressed={snapToGrid}
        onClick={toggleSnap}
      >
        <SnapIcon />
      </button>

      {/* Rulers Toggle */}
      <button
        type="button"
        className="dock-btn"
        aria-label="Toggle Rulers (Ctrl+R)"
        title="Toggle Rulers (Ctrl+R)"
        aria-pressed={showRulers}
        onClick={toggleRulers}
      >
        <RulersIcon />
      </button>
    </nav>
  );
}
