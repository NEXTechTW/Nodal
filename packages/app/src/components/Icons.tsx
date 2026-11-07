/** Inline SVG icons — currentColor, stroke tracks text weight (better-ui). */
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
