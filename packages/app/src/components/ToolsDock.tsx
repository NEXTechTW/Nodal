import { t } from "../i18n.js";
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

/** Clean Nodal-style vertical tool dock with icon buttons and tooltips. */
export function ToolsDock() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);
  const showGrid = useEditor((s) => s.showGrid);
  const toggleGrid = useEditor((s) => s.toggleGrid);
  const snapToGrid = useEditor((s) => s.snapToGrid);
  const toggleSnap = useEditor((s) => s.toggleSnap);
  const showRulers = useEditor((s) => s.showRulers);
  const toggleRulers = useEditor((s) => s.toggleRulers);
  const uiLang = useEditor((s) => s.uiLang);
  const tr = (k: string) => t(uiLang, k);

  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: "select", label: `${tr("ToolSelect")} (V)`, icon: <SelectIcon /> },
    { id: "add-station", label: `${tr("ToolAddStation")} (A)`, icon: <AddStationIcon /> },
    { id: "connect", label: `${tr("ToolConnect")} (C)`, icon: <ConnectIcon /> },
    { id: "pan", label: `${tr("ToolPan")} (H)`, icon: <PanIcon /> },
    { id: "measure", label: `${tr("ToolMeasure")} (M)`, icon: <RulersIcon /> },
    { id: "label", label: `${tr("ToolLabel")} (T)`, icon: <SelectIcon /> },
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
        aria-label={`${tr("ToggleGrid")} (Ctrl+')`}
        title={`${tr("ToggleGrid")} (Ctrl+')`}
        aria-pressed={showGrid}
        onClick={toggleGrid}
      >
        <GridIcon />
      </button>

      {/* Snap to Grid Toggle */}
      <button
        type="button"
        className="dock-btn"
        aria-label={`${tr("ToggleSnap")} (Ctrl+;)`}
        title={`${tr("ToggleSnap")} (Ctrl+;)`}
        aria-pressed={snapToGrid}
        onClick={toggleSnap}
      >
        <SnapIcon />
      </button>

      {/* Rulers Toggle */}
      <button
        type="button"
        className="dock-btn"
        aria-label={`${tr("ToggleRulers")} (Ctrl+R)`}
        title={`${tr("ToggleRulers")} (Ctrl+R)`}
        aria-pressed={showRulers}
        onClick={toggleRulers}
      >
        <RulersIcon />
      </button>
    </nav>
  );
}
