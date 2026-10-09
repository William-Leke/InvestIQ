import type { FastifyInstance } from "fastify";
import { HOUR, MINUTE, type TtlCache } from "../cache.js";
import { HttpError } from "../errors.js";
import type { EdgarClient } from "../providers/edgar.js";
import type { FmpClient } from "../providers/fmp.js";

const SYMBOL = /^[A-Za-z0-9.\-]{1,10}$/;

function symbolParam(raw: string): string {
  if (!SYMBOL.test(raw)) throw new HttpError(400, `Invalid ticker symbol "${raw}"`);
  return raw.toUpperCase();
}

export async function marketRoutes(
  app: FastifyInstance,
  opts: { fmp: FmpClient; edgar: EdgarClient; cache: TtlCache },
) {
  const { fmp, edgar, cache } = opts;
  app.addHook("preHandler", app.authenticate);
  app.addHook("preHandler", app.requireSubscription);

  app.get<{ Querystring: { q?: string } }>("/api/search", async (req) => {
    const q = (req.query.q ?? "").trim();
    if (q.length < 1 || q.length > 50) return [];
    return cache.get(`search:${q.toLowerCase()}`, HOUR, () => fmp.search(q));
  });

  app.get<{ Params: { symbol: string } }>("/api/quote/:symbol", async (req) => {
    const s = symbolParam(req.params.symbol);
    return cache.get(`quote:${s}`, 15_000, () => fmp.quote(s));
  });

  app.get<{ Params: { symbol: string } }>("/api/profile/:symbol", async (req) => {
    const s = symbolParam(req.params.symbol);
    return cache.get(`profile:${s}`, 24 * HOUR, () => fmp.profile(s));
  });

  app.get<{ Params: { symbol: string } }>("/api/financials/:symbol", async (req) => {
    const s = symbolParam(req.params.symbol);
    return cache.get(`financials:${s}`, 12 * HOUR, () => fmp.financials(s));
  });

  app.get<{ Params: { symbol: string }; Querystring: { forms?: string } }>("/api/filings/:symbol", async (req) => {
    const s = symbolParam(req.params.symbol);
    const forms = (req.query.forms ?? "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    const key = `filings:${s}:${forms.join(",")}`;
    return cache.get(key, 30 * MINUTE, () => edgar.filings(s, forms));
  });
}
