import type { ApiError } from "../lib/api";

export function Loading({ what }: { what: string }) {
  return <p className="animate-pulse text-sm text-slate-500">Loading {what}…</p>;
}

export function ErrorNote({ error }: { error: ApiError }) {
  return <p className="rounded-lg border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">{error.message}</p>;
}
