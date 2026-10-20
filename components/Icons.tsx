const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const MenuIcon = () => (
  <svg {...base}><path d="M5 9h14M5 15h9" /></svg>
);
export const NewIcon = () => (
  <svg {...base}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
);
export const ArrowUpIcon = () => (
  <svg {...base} strokeWidth={2.5}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
export const DownloadIcon = () => (
  <svg {...base}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>
);
export const TrashIcon = () => (
  <svg {...base} width={18} height={18}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const ImageIcon = () => (
  <svg {...base}><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="9" cy="9" r="1.6" /><path d="M4 17l5-5 4 4 3-3 4 4" /></svg>
);
