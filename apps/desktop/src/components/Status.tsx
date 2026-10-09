import type { ApiError } from "../lib/api";

export function Loading({ what }: { what: string }) {
  return <p className="animate-pulse text-sm text-faint">Loading {what}…</p>;
}

export function ErrorNote({ error }: { error: ApiError }) {
  return <p className="rounded-lg border border-down/40 bg-down/10 px-4 py-3 text-sm text-down">{error.message}</p>;
}
