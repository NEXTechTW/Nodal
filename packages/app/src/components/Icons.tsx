/** Inline SVG icons. currentColor so CSS states recolor them. */
import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>) {
  return {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
    ...props,
  } as const;
}

export const SelectIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 3l14 7-6 2-2 6L5 3z" /></svg>
);
export const AddStationIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
);
export const ConnectIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="5" cy="19" r="3" /><circle cx="19" cy="5" r="3" /><path d="M7 17L17 7" strokeDasharray="3 3" /></svg>
);
export const PanIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 12V5a1.5 1.5 0 013 0v6V4a1.5 1.5 0 013 0v7V6a1.5 1.5 0 013 0v7a7 7 0 01-7 7h-1c-2.5 0-4-1-5.5-3L4 14c-1-1.4-.3-3 .8-3.4.7-.3 1.4 0 1.9.6" /></svg>
);
export const UndoIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M9 14L4 9l5-5" /><path d="M4 9h9a7 7 0 017 7v1" /></svg>
);
export const RedoIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M15 14l5-5-5-5" /><path d="M20 9h-9a7 7 0 00-7 7v1" /></svg>
);
export const ExportIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" /></svg>
);
export const SaveIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M5 3h11l5 5v13H5z" /><path d="M8 3v5h8V3" /><path d="M8 21v-7h8v7" /></svg>
);
export const LoadIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M4 21h16" /></svg>
);
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 14h10l1-14" /></svg>
);
export const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M20 13.5A8.5 8.5 0 0110.5 4 8.5 8.5 0 1020 13.5z" /></svg>
);
export const SunIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
/** GitHub mark (filled). */
export const GitHubIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...p}><path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 015 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0012 2z"/></svg>
);
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M18 6L6 18M6 6l12 12" /></svg>
);
export const KeyboardIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" /></svg>
);
export const SparklesIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3l1.9 5.6L19.5 10.5 13.9 12.4 12 18l-1.9-5.6L4.5 10.5 10.1 8.6 12 3z" /><path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" /></svg>
);
export const CompassIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="10" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" /></svg>
);

/* ---- Nodal UI Extra Icons ---- */
export const ChevronDownIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><polyline points="6 9 12 15 18 9" /></svg>
);
export const LayersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
);
export const HistoryIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
);
export const MapIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
);
export const SnapIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 3v6a6 6 0 0012 0V3" /><line x1="4" y1="3" x2="8" y2="3" /><line x1="16" y1="3" x2="20" y2="3" /></svg>
);
export const GridIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
);
export const EyeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
);
export const SlidersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
);
export const DuplicateIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
);
export const AlignCenterIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" /></svg>
);
export const AlignLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>
);
export const AlignRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" /></svg>
);
export const AlignTopIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><line x1="6" y1="3" x2="6" y2="21" /><line x1="10" y1="3" x2="10" y2="17" /><line x1="14" y1="3" x2="14" y2="21" /><line x1="18" y1="3" x2="18" y2="17" /></svg>
);
export const AlignBottomIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><line x1="6" y1="21" x2="6" y2="3" /><line x1="10" y1="21" x2="10" y2="7" /><line x1="14" y1="21" x2="14" y2="3" /><line x1="18" y1="21" x2="18" y2="7" /></svg>
);
export const RulersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M21.3 8.7l-6-6a1 1 0 00-1.4 0l-11.2 11.2a1 1 0 000 1.4l6 6a1 1 0 001.4 0l11.2-11.2a1 1 0 000-1.4z" /><line x1="7.5" y1="10.5" x2="9" y2="12" /><line x1="10.5" y1="7.5" x2="13.5" y2="10.5" /><line x1="13.5" y1="4.5" x2="15" y2="6" /></svg>
);
export const PaletteIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8z" /></svg>
);
