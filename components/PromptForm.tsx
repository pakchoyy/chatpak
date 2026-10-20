"use client";

type Props = {
  value: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
};

export default function PromptForm({ value, loading, onChange, onSubmit }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!loading && value.trim()) onSubmit();
      }}
      className="space-y-3"
    >
      <label htmlFor="prompt" className="sr-only">
        Prompt
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Jelaskan gambar yang kamu mau…"
        className="w-full resize-none rounded-2xl border border-line bg-surface p-4 text-base outline-none placeholder:text-muted focus:border-ink"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="min-h-14 w-full rounded-2xl bg-accent text-base font-medium text-accent-ink transition active:scale-[0.99] disabled:opacity-40"
      >
        {loading ? "Membuat…" : "Buat gambar"}
      </button>
    </form>
  );
}
