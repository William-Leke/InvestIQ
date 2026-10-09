import { useEffect, useState } from "react";

const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8787").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let sessionToken: string | null = null;

/** Set by the sign-in flow; sent as a Bearer token on every request. */
export function setSessionToken(token: string | null) {
  sessionToken = token;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Can't reach the InvestIQ service. Check your connection.");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface Loadable<T> {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
}

/** Fetches `path` whenever it changes; pass null to skip. */
export function useApi<T>(path: string | null): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ data: undefined, error: undefined, loading: !!path });

  useEffect(() => {
    if (!path) {
      setState({ data: undefined, error: undefined, loading: false });
      return;
    }
    const controller = new AbortController();
    setState((s) => ({ data: s.data, error: undefined, loading: true }));
    api<T>(path, { signal: controller.signal })
      .then((data) => !controller.signal.aborted && setState({ data, error: undefined, loading: false }))
      .catch((error: ApiError) => !controller.signal.aborted && setState({ data: undefined, error, loading: false }));
    return () => controller.abort();
  }, [path]);

  return state;
}
