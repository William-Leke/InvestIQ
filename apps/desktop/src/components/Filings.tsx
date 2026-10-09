import { useState } from "react";
import { useApi } from "../lib/api";
import { openExternal } from "../lib/open";
import type { Filing } from "../lib/types";
import { ErrorNote, Loading } from "./Status";

const FILTERS: { label: string; forms: string }[] = [
  { label: "Key reports", forms: "10-K,10-Q,8-K,DEF 14A,S-1,20-F,6-K" },
  { label: "Annual (10-K)", forms: "10-K,20-F" },
  { label: "Quarterly (10-Q)", forms: "10-Q" },
  { label: "Current (8-K)", forms: "8-K" },
  { label: "Insider (Form 4)", forms: "4" },
  { label: "All", forms: "" },
];

export function Filings({ symbol }: { symbol: string }) {
  const [filter, setFilter] = useState(FILTERS[0]!);
  const { data, error, loading } = useApi<Filing[]>(`/api/filings/${symbol}?forms=${encodeURIComponent(filter.forms)}`);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs ${f === filter ? "border-sky-500 bg-sky-500/10 text-sky-300" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {loading && <Loading what="SEC filings" />}
      {error && <ErrorNote error={error} />}
      {data && data.length === 0 && <p className="text-sm text-slate-500">No recent filings of this type.</p>}
      {data && data.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 font-medium">Form</th>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium">Period</th>
              <th className="py-2 font-medium">Filed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((f) => (
              <tr
                key={f.accessionNumber}
                onClick={() => void openExternal(f.url)}
                className="cursor-pointer border-t border-slate-800 hover:bg-slate-900"
                title="Open on sec.gov"
              >
                <td className="py-2 pr-4 font-semibold text-sky-400">{f.form}</td>
                <td className="py-2 pr-4">{f.description}</td>
                <td className="py-2 pr-4 tabular-nums text-slate-400">{f.reportDate || "—"}</td>
                <td className="py-2 tabular-nums text-slate-400">{f.filingDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-slate-500">Source: SEC EDGAR. Filings open on sec.gov in your browser.</p>
    </div>
  );
}
