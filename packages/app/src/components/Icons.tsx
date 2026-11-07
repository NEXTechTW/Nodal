/** Inline SVG icons. `currentColor` so CSS states recolor them. */
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
