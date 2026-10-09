import { HttpError } from "../errors.js";
import type { Filing } from "../types.js";
import { type Fetch, getJson } from "./http.js";

interface TickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

interface Submissions {
  cik: string;
  name: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

/** SEC fair-access policy allows at most 10 requests per second. */
class RateLimiter {
  private queue: Promise<void> = Promise.resolve();
  constructor(private minIntervalMs: number, private sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))) {}

  schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task);
    this.queue = run.then(
      () => this.sleep(this.minIntervalMs),
      () => this.sleep(this.minIntervalMs),
    );
    return run;
  }
}

export class EdgarClient {
  private limiter = new RateLimiter(110);
  private tickers?: Map<string, TickerEntry>;

  constructor(private userAgent: string, private fetchImpl: Fetch = fetch) {}

  private get<T>(url: string): Promise<T> {
    return this.limiter.schedule(() => getJson<T>(this.fetchImpl, "SEC EDGAR", url, { "User-Agent": this.userAgent }));
  }

  async cikFor(symbol: string): Promise<string> {
    if (!this.tickers) {
      const data = await this.get<Record<string, TickerEntry>>("https://www.sec.gov/files/company_tickers.json");
      this.tickers = new Map(Object.values(data).map((t) => [t.ticker.toUpperCase(), t]));
    }
    const entry = this.tickers.get(symbol.toUpperCase());
    if (!entry) throw new HttpError(404, `No SEC registrant found for ${symbol}`);
    return String(entry.cik_str).padStart(10, "0");
  }

  async filings(symbol: string, forms?: string[], limit = 50): Promise<Filing[]> {
    const cik = await this.cikFor(symbol);
    const data = await this.get<Submissions>(`https://data.sec.gov/submissions/CIK${cik}.json`);
    const r = data.filings.recent;
    const wanted = forms?.length ? new Set(forms.map((f) => f.toUpperCase())) : null;
    const cikNumber = String(Number(cik));
    const out: Filing[] = [];
    for (let i = 0; i < r.accessionNumber.length && out.length < limit; i++) {
      const form = r.form[i] ?? "";
      if (wanted && !wanted.has(form.toUpperCase())) continue;
      const accession = r.accessionNumber[i] ?? "";
      out.push({
        form,
        filingDate: r.filingDate[i] ?? "",
        reportDate: r.reportDate[i] ?? "",
        description: r.primaryDocDescription[i] || form,
        accessionNumber: accession,
        url: `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accession.replace(/-/g, "")}/${r.primaryDocument[i] ?? ""}`,
      });
    }
    return out;
  }
}
