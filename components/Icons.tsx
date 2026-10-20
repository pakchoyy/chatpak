const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

type P = { size?: number };
const s = (p: P) => (p.size ? { width: p.size, height: p.size } : {});

export const MenuIcon = (p: P) => <svg {...base} {...s(p)}><path d="M5 9h14M5 15h9" /></svg>;
export const NewIcon = (p: P) => <svg {...base} {...s(p)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>;
export const ArrowUpIcon = (p: P) => <svg {...base} {...s(p)} strokeWidth={2.5}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
export const StopIcon = (p: P) => <svg {...base} {...s(p)}><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" /></svg>;
export const DownloadIcon = (p: P) => <svg {...base} {...s(p)}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>;
export const TrashIcon = (p: P) => <svg {...base} width={18} height={18} {...s(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
export const ImageIcon = (p: P) => <svg {...base} {...s(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="9" cy="9" r="1.6" /><path d="M4 17l5-5 4 4 3-3 4 4" /></svg>;
export const CopyIcon = (p: P) => <svg {...base} width={18} height={18} {...s(p)}><rect x="8" y="8" width="12" height="12" rx="3" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></svg>;
export const CheckIcon = (p: P) => <svg {...base} width={18} height={18} {...s(p)}><path d="M5 12l5 5 9-10" /></svg>;
export const RetryIcon = (p: P) => <svg {...base} width={18} height={18} {...s(p)}><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /></svg>;
export const SearchIcon = (p: P) => <svg {...base} width={18} height={18} {...s(p)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const CloseIcon = (p: P) => <svg {...base} {...s(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const InstallIcon = (p: P) => <svg {...base} {...s(p)}><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M12 7v7M9 11l3 3 3-3" /></svg>;
export const ShareIcon = (p: P) => <svg {...base} width={16} height={16} {...s(p)}><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>;
