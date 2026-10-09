import { HttpError } from "../errors.js";
import type { Financials, Profile, Quote, SearchResult } from "../types.js";
import { type Fetch, getJson, num, str } from "./http.js";

type Row = Record<string, unknown>;

const BASE = "https://financialmodelingprep.com/stable";

export class FmpClient {
  constructor(private apiKey: string, private fetchImpl: Fetch = fetch) {}

  private async get(path: string, params: Record<string, string | number>): Promise<Row[]> {
    if (!this.apiKey) throw new HttpError(503, "FMP_API_KEY is not configured");
    const qs = new URLSearchParams({ ...stringify(params), apikey: this.apiKey });
    const data = await getJson<unknown>(this.fetchImpl, "FMP", `${BASE}/${path}?${qs}`);
    return Array.isArray(data) ? (data as Row[]) : [];
  }

  async search(query: string): Promise<SearchResult[]> {
    const rows = await this.get("search-symbol", { query, limit: 10 });
    return rows.map((r) => ({
      symbol: str(r, "symbol"),
      name: str(r, "name"),
      exchange: str(r, "exchange", "exchangeShortName"),
    }));
  }

  async quote(symbol: string): Promise<Quote> {
    const [r] = await this.get("quote", { symbol });
    if (!r) throw new HttpError(404, `No quote for ${symbol}`);
    return {
      symbol: str(r, "symbol"),
      name: str(r, "name"),
      price: num(r, "price") ?? 0,
      change: num(r, "change") ?? 0,
      changePercent: num(r, "changePercentage", "changesPercentage") ?? 0,
      dayLow: num(r, "dayLow"),
      dayHigh: num(r, "dayHigh"),
      yearLow: num(r, "yearLow"),
      yearHigh: num(r, "yearHigh"),
      marketCap: num(r, "marketCap"),
      volume: num(r, "volume"),
      pe: num(r, "pe"),
      exchange: str(r, "exchange"),
      timestamp: num(r, "timestamp") ?? 0,
    };
  }

  async profile(symbol: string): Promise<Profile> {
    const [r] = await this.get("profile", { symbol });
    if (!r) throw new HttpError(404, `No profile for ${symbol}`);
    return {
      symbol: str(r, "symbol"),
      name: str(r, "companyName"),
      exchange: str(r, "exchange", "exchangeShortName"),
      sector: str(r, "sector"),
      industry: str(r, "industry"),
      description: str(r, "description"),
      website: str(r, "website"),
      ceo: str(r, "ceo"),
      employees: num(r, "fullTimeEmployees"),
      country: str(r, "country"),
      image: str(r, "image"),
    };
  }

  async financials(symbol: string, years = 10): Promise<Financials> {
    const params = { symbol, period: "annual", limit: years };
    const [income, balance, cash] = await Promise.all([
      this.get("income-statement", params),
      this.get("balance-sheet-statement", params),
      this.get("cash-flow-statement", params),
    ]);
    if (income.length === 0) throw new HttpError(404, `No financial statements for ${symbol}`);

    // Align all three statements on fiscal year, oldest first.
    const byYear = (rows: Row[]) => new Map(rows.map((r) => [fiscalYear(r), r]));
    const inc = byYear(income);
    const bal = byYear(balance);
    const cf = byYear(cash);
    const yearList = [...inc.keys()].filter(Boolean).sort();
    const col = (m: Map<string, Row>, ...keys: string[]) => yearList.map((y) => num(m.get(y), ...keys));

    const capex = col(cf, "capitalExpenditure");
    const ocf = col(cf, "operatingCashFlow", "netCashProvidedByOperatingActivities");
    const reportedFcf = col(cf, "freeCashFlow");

    return {
      symbol: symbol.toUpperCase(),
      currency: str(income[0], "reportedCurrency") || "USD",
      years: yearList,
      income: {
        revenue: col(inc, "revenue"),
        grossProfit: col(inc, "grossProfit"),
        operatingIncome: col(inc, "operatingIncome"),
        netIncome: col(inc, "netIncome"),
        eps: col(inc, "epsDiluted", "epsdiluted", "eps"),
      },
      balance: {
        totalAssets: col(bal, "totalAssets"),
        totalLiabilities: col(bal, "totalLiabilities"),
        totalEquity: col(bal, "totalStockholdersEquity", "totalEquity"),
        cash: col(bal, "cashAndCashEquivalents"),
        totalDebt: col(bal, "totalDebt"),
      },
      cashflow: {
        operatingCashFlow: ocf,
        capitalExpenditure: capex,
        freeCashFlow: reportedFcf.map((v, i) => {
          if (v !== null) return v;
          const o = ocf[i];
          const c = capex[i];
          // FMP reports capex as a negative number.
          return o !== null && c !== null ? o + c : null;
        }),
      },
    };
  }
}

function fiscalYear(r: Row): string {
  return str(r, "fiscalYear", "calendarYear") || str(r, "date").slice(0, 4);
}

function stringify(params: Record<string, string | number>): Record<string, string> {
  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]));
}
