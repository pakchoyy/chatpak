"use client";

import { useEffect } from "react";
import { CloseIcon, DownloadIcon } from "./Icons";

export default function ImageViewer({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Pratinjau gambar" className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <button onClick={onClose} aria-label="Tutup" className="grid size-12 place-items-center rounded-full active:bg-white/15">
          <CloseIcon />
        </button>
        <a
          href={url}
          download={`gambar-${Date.now()}.webp`}
          aria-label="Unduh gambar"
          className="grid size-12 place-items-center rounded-full active:bg-white/15"
        >
          <DownloadIcon />
        </a>
      </div>
      <div className="grid flex-1 place-items-center overflow-hidden p-2 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={onClose}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}
