"use client";

export type Shown = { prompt: string; url: string; createdAt: number };

type Props = {
  loading: boolean;
  error: string | null;
  shown: Shown | null;
  onRetry: () => void;
};

export default function ResultView({ loading, error, shown, onRetry }: Props) {
  return (
    <section aria-label="Hasil" className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-surface">
        {loading ? (
          <div className="skeleton absolute inset-0 grid place-items-center">
            <p className="rounded-full bg-bg/80 px-4 py-2 text-sm text-muted">Membuat gambar…</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="space-y-3">
              <p className="text-sm text-danger">{error}</p>
              <button
                onClick={onRetry}
                className="min-h-11 rounded-full border border-line px-5 text-sm active:opacity-60"
              >
                Coba lagi
              </button>
            </div>
          </div>
        ) : shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown.url} alt={shown.prompt} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted">
            Gambar akan muncul di sini.
          </div>
        )}
      </div>

      {shown && !loading && !error && (
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-3 flex-1 text-sm text-muted">{shown.prompt}</p>
          <a
            href={shown.url}
            download={`gambar-${shown.createdAt}.webp`}
            className="grid min-h-11 shrink-0 place-items-center rounded-full border border-line px-5 text-sm font-medium active:opacity-60"
          >
            Unduh
          </a>
        </div>
      )}
    </section>
  );
}
