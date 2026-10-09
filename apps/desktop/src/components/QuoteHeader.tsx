import { compact, compactMoney, money, percent } from "../lib/format";
import type { Profile, Quote } from "../lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

export function QuoteHeader({ quote, profile }: { quote: Quote; profile?: Profile }) {
  const up = quote.change >= 0;
  const range = (lo: number | null, hi: number | null) => (lo === null || hi === null ? "—" : `${money(lo)} – ${money(hi)}`);
  return (
    <section className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex items-center gap-4">
        {profile?.image && <img src={profile.image} alt="" className="h-12 w-12 rounded-lg bg-white object-contain p-1" />}
        <div>
          <h1 className="text-2xl font-semibold">
            {quote.name} <span className="text-slate-400">{quote.symbol}</span>
          </h1>
          <div className="text-xs text-slate-500">
            {quote.exchange}
            {profile?.sector ? ` · ${profile.sector}` : ""}
            {profile?.industry ? ` · ${profile.industry}` : ""}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-3xl font-semibold tabular-nums">{money(quote.price)}</div>
        <div className={`text-sm font-medium tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}>
          {up ? "+" : ""}
          {quote.change.toFixed(2)} ({percent(quote.changePercent)})
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-5">
        <Stat label="Market cap" value={compactMoney(quote.marketCap)} />
        <Stat label="Day range" value={range(quote.dayLow, quote.dayHigh)} />
        <Stat label="52-week range" value={range(quote.yearLow, quote.yearHigh)} />
        <Stat label="Volume" value={compact(quote.volume, 1)} />
        <Stat label="P/E" value={quote.pe === null ? "—" : quote.pe.toFixed(1)} />
      </div>
    </section>
  );
}
