import { HttpError, UpstreamError } from "../errors.js";

export type Fetch = typeof fetch;

export async function getJson<T>(
  fetchImpl: Fetch,
  provider: string,
  url: string,
  headers: Record<string, string> = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetchImpl(url, { headers: { Accept: "application/json", ...headers } });
  } catch {
    throw new HttpError(502, `${provider} is unreachable`);
  }
  if (!res.ok) throw new UpstreamError(provider, res.status);
  return (await res.json()) as T;
}

/** Reads the first numeric field present on a row, or null. */
export function num(row: Record<string, unknown> | undefined, ...keys: string[]): number | null {
  if (!row) return null;
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

export function str(row: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!row) return "";
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v) return v;
  }
  return "";
}
