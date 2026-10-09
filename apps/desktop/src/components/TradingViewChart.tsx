import { useEffect, useRef } from "react";
import { openExternal } from "../lib/open";

const TV_EXCHANGES: Record<string, string> = { NASDAQ: "NASDAQ", NYSE: "NYSE", AMEX: "AMEX", NYSEARCA: "AMEX" };

/**
 * TradingView's free Advanced Chart widget. Its terms require the TradingView
 * attribution link below to stay visible; the chart data comes from TradingView.
 */
export function TradingViewChart({ symbol, exchange }: { symbol: string; exchange: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    host.appendChild(widget);

    const prefix = TV_EXCHANGES[exchange.toUpperCase()];
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: prefix ? `${prefix}:${symbol}` : symbol,
      interval: "D",
      timezone: "America/New_York",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      hide_side_toolbar: false,
      support_host: "https://www.tradingview.com",
    });
    host.appendChild(script);
    return () => {
      host.innerHTML = "";
    };
  }, [symbol, exchange]);

  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-lg border border-slate-800">
      <div ref={ref} className="tradingview-widget-container min-h-0 flex-1" />
      <div className="border-t border-slate-800 px-3 py-1 text-right text-xs text-slate-500">
        <a
          href="https://www.tradingview.com/"
          onClick={(e) => {
            e.preventDefault();
            void openExternal("https://www.tradingview.com/");
          }}
          rel="noopener nofollow"
          className="hover:text-sky-400"
        >
          Chart by TradingView
        </a>
      </div>
    </div>
  );
}
