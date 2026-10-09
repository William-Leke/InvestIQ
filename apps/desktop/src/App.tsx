import { useState } from "react";
import { AccessGate } from "./components/AccessGate";
import { CompanyProfile } from "./components/CompanyProfile";
import { Filings } from "./components/Filings";
import { Financials } from "./components/Financials";
import { QuoteHeader } from "./components/QuoteHeader";
import { Settings } from "./components/Settings";
import { SearchBar } from "./components/SearchBar";
import { ErrorNote, Loading } from "./components/Status";
import { Wordmark } from "./components/Wordmark";
import { ThemeSwitch } from "./components/ThemeSwitch";
import { TradingViewChart } from "./components/TradingViewChart";
import { type ApiError, useApi } from "./lib/api";
import type { Financials as FinancialsData, Profile, Quote } from "./lib/types";

const TABS = ["Overview", "Financials", "SEC filings"] as const;
type Tab = (typeof TABS)[number];

const isAccessError = (e?: ApiError) => e?.status === 401 || e?.status === 402;

export default function App() {
  const [symbol, setSymbol] = useState("AAPL");
  const [tab, setTab] = useState<Tab>("Overview");
  const [showSettings, setShowSettings] = useState(false);

  const quote = useApi<Quote>(`/api/quote/${symbol}`);
  const profile = useApi<Profile>(`/api/profile/${symbol}`);
  const financials = useApi<FinancialsData>(tab === "Financials" ? `/api/financials/${symbol}` : null);

  const accessError = [quote.error, profile.error].find(isAccessError);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-6 border-b border-line px-6 py-3">
        <Wordmark className="text-lg" />
        <SearchBar
          onSelect={(s) => {
            setSymbol(s);
            setTab("Overview");
            setShowSettings(false);
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitch />
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            aria-pressed={showSettings}
            aria-label="Appearance settings"
            title="Appearance settings"
            className={`grid h-8 w-8 place-items-center rounded-lg border ${showSettings ? "border-accent text-accent" : "border-line-2 text-muted hover:text-fg"}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="13.5" cy="6.5" r="1.5" />
              <circle cx="17.5" cy="10.5" r="1.5" />
              <circle cx="8.5" cy="7.5" r="1.5" />
              <circle cx="6.5" cy="12.5" r="1.5" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H16c3.1 0 5.6-2.5 5.6-5.6C21.9 6 17.5 2 12 2z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-6 py-5">
        {showSettings ? (
          <Settings onClose={() => setShowSettings(false)} />
        ) : accessError ? (
          <AccessGate error={accessError} />
        ) : (
          <div className="mx-auto max-w-7xl space-y-5">
            {quote.loading && !quote.data && <Loading what={symbol} />}
            {quote.error && <ErrorNote error={quote.error} />}
            {quote.data && <QuoteHeader quote={quote.data} profile={profile.data} />}

            <nav className="flex gap-1 border-b border-line">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm ${t === tab ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"}`}
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

            <footer className="pt-4 text-xs text-faint">
              Market data from Financial Modeling Prep, filings from SEC EDGAR. Prices may be delayed. Trendsight is a research tool, not investment advice.
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
