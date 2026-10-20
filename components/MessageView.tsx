"use client";

import { memo, useState } from "react";
import type { Msg } from "@/lib/db";
import { CheckIcon, CopyIcon, DownloadIcon, ImageIcon, RetryIcon } from "./Icons";
import Markdown from "./Markdown";

export type ViewMsg = Msg & { pending?: boolean; url?: string };

type Props = {
  msg: ViewMsg;
  last: boolean;
  busy: boolean;
  onRetry: (id: string) => void;
  onOpenImage: (url: string, alt: string) => void;
};

const actionBtn = "grid size-10 place-items-center rounded-full text-muted active:bg-bubble";

export default memo(function MessageView({ msg, last, busy, onRetry, onOpenImage }: Props) {
  const [copied, setCopied] = useState(false);

  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-bubble px-4 py-2.5 text-[16px] leading-6">
          {msg.kind === "image" && (
            <span className="mb-1 flex items-center gap-1.5 text-[13px] text-muted">
              <ImageIcon size={14} /> Gambar
            </span>
          )}
          {msg.text}
        </div>
      </div>
    );
  }

  const retry = !busy && (last || msg.error) && (
    <button onClick={() => onRetry(msg.id)} aria-label="Ulangi" className={actionBtn}>
      <RetryIcon />
    </button>
  );

  if (msg.kind === "image") {
    return (
      <div className="space-y-1">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-surface">
          {msg.url ? (
            <>
              <button
                onClick={() => onOpenImage(msg.url!, msg.text)}
                aria-label="Lihat gambar penuh"
                className="block h-full w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={msg.url} alt={msg.text} className="h-full w-full object-cover" />
              </button>
              <a
                href={msg.url}
                download={`gambar-${msg.id.slice(0, 8)}.webp`}
                aria-label="Unduh gambar"
                className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-bg/85 text-ink backdrop-blur active:scale-95"
              >
                <DownloadIcon />
              </a>
            </>
          ) : msg.error ? (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <p className="text-[15px] text-danger">{msg.error}</p>
            </div>
          ) : (
            <div className="skeleton absolute inset-0 grid place-items-center" aria-busy="true">
              <p className="rounded-full bg-bg/80 px-4 py-2 text-sm text-muted">Membuat gambar…</p>
            </div>
          )}
        </div>
        <div className="flex">{retry}</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {msg.text ? (
        <Markdown text={msg.text} />
      ) : msg.pending ? (
        <div className="flex h-7 items-center gap-1" aria-label="Sedang menulis" role="status">
          <span className="dot" />
          <span className="dot [animation-delay:150ms]" />
          <span className="dot [animation-delay:300ms]" />
        </div>
      ) : null}
      {msg.error && <p className="text-[15px] text-danger">{msg.error}</p>}
      {!msg.pending && (
        <div className="-ml-2 flex">
          {msg.text && (
            <button
              onClick={() => {
                navigator.clipboard?.writeText(msg.text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              aria-label={copied ? "Tersalin" : "Salin"}
              className={actionBtn}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          )}
          {retry}
        </div>
      )}
    </div>
  );
});
