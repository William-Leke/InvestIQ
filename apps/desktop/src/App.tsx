import { useState } from "react";
import { AccessGate } from "./components/AccessGate";
import { CompanyProfile } from "./components/CompanyProfile";
import { Filings } from "./components/Filings";
import { Financials } from "./components/Financials";
import { QuoteHeader } from "./components/QuoteHeader";
import { SearchBar } from "./components/SearchBar";
import { ErrorNote, Loading } from "./components/Status";
import { TradingViewChart } from "./components/TradingViewChart";
import { type ApiError, useApi } from "./lib/api";
import type { Financials as FinancialsData, Profile, Quote } from "./lib/types";

const TABS = ["Overview", "Financials", "SEC filings"] as const;
type Tab = (typeof TABS)[number];

const isAccessError = (e?: ApiError) => e?.status === 401 || e?.status === 402;

export default function App() {
  const [symbol, setSymbol] = useState("AAPL");
  const [tab, setTab] = useState<Tab>("Overview");

  const quote = useApi<Quote>(`/api/quote/${symbol}`);
  const profile = useApi<Profile>(`/api/profile/${symbol}`);
  const financials = useApi<FinancialsData>(tab === "Financials" ? `/api/financials/${symbol}` : null);

  const accessError = [quote.error, profile.error].find(isAccessError);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-6 border-b border-slate-800 px-6 py-3">
        <div className="text-lg font-bold tracking-tight">
          Invest<span className="text-sky-400">IQ</span>
        </div>
        <SearchBar
          onSelect={(s) => {
            setSymbol(s);
            setTab("Overview");
          }}
        />
      </header>

      <main className="flex-1 overflow-auto px-6 py-5">
        {accessError ? (
          <AccessGate error={accessError} />
        ) : (
          <div className="mx-auto max-w-7xl space-y-5">
            {quote.loading && !quote.data && <Loading what={symbol} />}
            {quote.error && <ErrorNote error={quote.error} />}
            {quote.data && <QuoteHeader quote={quote.data} profile={profile.data} />}

            <nav className="flex gap-1 border-b border-slate-800">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm ${t === tab ? "border-sky-400 text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                >
                  {t}
                </button>
              ))}
            </nav>

            {tab === "Overview" && (
              <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <TradingViewChart symbol={symbol} exchange={quote.data?.exchange ?? ""} />
                {profile.data ? <CompanyProfile profile={profile.data} /> : profile.error && <ErrorNote error={profile.error} />}
              </div>
            )}
            {tab === "Financials" && (
              <>
                {financials.loading && <Loading what="financial statements" />}
                {financials.error && <ErrorNote error={financials.error} />}
                {financials.data && <Financials data={financials.data} />}
              </>
            )}
            {tab === "SEC filings" && <Filings symbol={symbol} />}

            <footer className="pt-4 text-xs text-slate-600">
              Market data from Financial Modeling Prep, filings from SEC EDGAR. Prices may be delayed. InvestIQ is a research tool, not investment advice.
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
