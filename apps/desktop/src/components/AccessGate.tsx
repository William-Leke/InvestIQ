import { useState } from "react";
import { api, type ApiError } from "../lib/api";
import { openExternal } from "../lib/open";

/** Shown when the service says the user must sign in (401) or subscribe (402). */
export function AccessGate({ error }: { error: ApiError }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (error.status === 401) {
    return (
      <Panel title="Sign in to InvestIQ">
        <p>Your session has ended or you haven't signed in yet.</p>
        <p className="text-xs text-slate-500">Desktop sign-in arrives with the Clerk setup; locally, run the service with AUTH_MODE=dev.</p>
      </Panel>
    );
  }

  const subscribe = async () => {
    setBusy(true);
    setMessage("");
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", { method: "POST" });
      await openExternal(url);
      setMessage("Checkout opened in your browser. Come back here once payment completes.");
    } catch (e) {
      setMessage((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Subscribe to keep researching">
      <p>Prices, financials and filings are part of the InvestIQ subscription.</p>
      <button onClick={subscribe} disabled={busy} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50">
        {busy ? "Opening checkout…" : "Start subscription"}
      </button>
      {message && <p className="text-xs text-slate-400">{message}</p>}
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-24 max-w-md space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {children}
    </div>
  );
}
