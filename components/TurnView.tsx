"use client";

import { DownloadIcon } from "./Icons";

export type Turn = {
  key: string;
  prompt: string;
  createdAt: number;
  url?: string;
  error?: string;
};

export default function TurnView({ turn, onRetry }: { turn: Turn; onRetry: (t: Turn) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl bg-bubble px-4 py-2.5 text-[17px] leading-6">
          {turn.prompt}
        </p>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-line bg-surface">
        {turn.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={turn.url} alt={turn.prompt} className="h-full w-full object-cover" />
            <a
              href={turn.url}
              download={`gambar-${turn.createdAt}.webp`}
              aria-label="Unduh gambar"
              className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-bg/85 text-ink backdrop-blur active:scale-95"
            >
              <DownloadIcon />
            </a>
          </>
        ) : turn.error ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="space-y-3">
              <p className="text-[15px] text-danger">{turn.error}</p>
              <button
                onClick={() => onRetry(turn)}
                className="min-h-11 rounded-full border border-line px-5 text-[15px] font-medium active:opacity-60"
              >
                Coba lagi
              </button>
            </div>
          </div>
        ) : (
          <div className="skeleton absolute inset-0 grid place-items-center">
            <p className="rounded-full bg-bg/80 px-4 py-2 text-sm text-muted">Membuat gambar…</p>
          </div>
        )}
      </div>
    </div>
  );
}
