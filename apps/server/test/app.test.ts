import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { buildApp } from "../src/app.js";
import type { BillingGateway } from "../src/billing.js";
import { loadConfig } from "../src/config.js";
import { SubscriptionStore } from "../src/db.js";
import * as fx from "./fixtures.js";

type App = Awaited<ReturnType<typeof buildApp>>;
let app: App | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

function fakeFetch() {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const routes: [RegExp, unknown][] = [
    [/\/stable\/quote\?/, fx.fmpQuote],
    [/\/stable\/income-statement\?/, fx.fmpIncome],
    [/\/stable\/balance-sheet-statement\?/, fx.fmpBalance],
    [/\/stable\/cash-flow-statement\?/, fx.fmpCashflow],
    [/company_tickers\.json$/, fx.secTickers],
    [/submissions\/CIK0000320193\.json$/, fx.secSubmissions],
  ];
  const impl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
    const match = routes.find(([re]) => re.test(url));
    return match ? Response.json(match[1]) : new Response("not found", { status: 404 });
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

const baseEnv = { FMP_API_KEY: "test-key", SEC_USER_AGENT: "Trendsight test@example.com", DB_PATH: ":memory:" };

async function devApp(env: Record<string, string> = {}) {
  const f = fakeFetch();
  app = await buildApp(loadConfig({ ...baseEnv, AUTH_MODE: "dev", ...env }), { fetch: f.impl, gateway: null });
  return f;
}

describe("market data (dev mode)", () => {
  it("returns a normalized quote and caches repeat requests", async () => {
    const f = await devApp();
    const first = await app!.inject("/api/quote/aapl");
    const second = await app!.inject("/api/quote/AAPL");
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({ symbol: "AAPL", price: 232.14, changePercent: 1.23, marketCap: 3.45e12 });
    expect(second.json()).toEqual(first.json());
    expect(f.calls.filter((c) => c.url.includes("/quote?"))).toHaveLength(1);
    expect(f.calls[0]!.url).toContain("apikey=test-key");
  });

  it("aligns three statements by fiscal year, oldest first, and derives missing free cash flow", async () => {
    await devApp();
    const res = await app!.inject("/api/financials/AAPL");
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.years).toEqual(["2023", "2024", "2025"]);
    expect(body.income.revenue).toEqual([383e9, 391e9, 416e9]);
    expect(body.income.eps).toEqual([6.13, 6.08, 7.46]);
    expect(body.balance.totalEquity).toEqual([62e9, 57e9, 74e9]);
    expect(body.cashflow.freeCashFlow).toEqual([99e9, 109e9, 99e9]);
  });

  it("lists SEC filings filtered by form, with document links and the required User-Agent", async () => {
    const f = await devApp();
    const res = await app!.inject("/api/filings/AAPL?forms=10-K,10-Q");
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      expect.objectContaining({
        form: "10-K",
        filingDate: "2025-10-31",
        url: "https://www.sec.gov/Archives/edgar/data/320193/000032019325000123/aapl-20250927.htm",
      }),
      expect.objectContaining({ form: "10-Q", reportDate: "2025-06-28" }),
    ]);
    const secCalls = f.calls.filter((c) => c.url.includes("sec.gov"));
    expect(secCalls.length).toBe(2);
    for (const c of secCalls) expect(c.headers["User-Agent"]).toBe("Trendsight test@example.com");
  });

  it("rejects malformed tickers and unknown SEC registrants", async () => {
    await devApp();
    expect((await app!.inject("/api/quote/../../etc")).statusCode).toBe(404);
    expect((await app!.inject("/api/quote/AAPL$")).statusCode).toBe(400);
    expect((await app!.inject("/api/filings/ZZZZ")).statusCode).toBe(404);
  });

  it("reports a missing FMP key as 503 rather than a crash", async () => {
    await devApp({ FMP_API_KEY: "" });
    const res = await app!.inject("/api/quote/AAPL");
    expect(res.statusCode).toBe(503);
    expect(res.json().error).toMatch(/FMP_API_KEY/);
  });
});

describe("sign-in and subscriptions (clerk mode)", () => {
  function fakeGateway(sub: Partial<Stripe.Subscription>): BillingGateway & { events: Stripe.Event[] } {
    const events: Stripe.Event[] = [];
    return {
      events,
      createCheckout: vi.fn(async () => "https://checkout.stripe.com/c/pay/test"),
      createPortal: vi.fn(async () => "https://billing.stripe.com/p/session/test"),
      parseEvent: (raw, sig) => {
        if (sig !== "valid") throw new Error("bad signature");
        return JSON.parse(raw.toString()) as Stripe.Event;
      },
      getSubscription: vi.fn(async (id: string) => ({ id, ...sub }) as Stripe.Subscription),
    };
  }

  async function clerkApp(gateway: BillingGateway) {
    const store = new SubscriptionStore(":memory:");
    app = await buildApp(loadConfig({ ...baseEnv, AUTH_MODE: "clerk", CLERK_ISSUER: "x", CLERK_JWKS_URL: "x" }), {
      fetch: fakeFetch().impl,
      store,
      gateway,
      verifier: async (token) => {
        if (token !== "good-token") throw new Error("invalid");
        return "user_123";
      },
    });
    return store;
  }

  const auth = { authorization: "Bearer good-token" };

  function webhook(event: object, signature = "valid") {
    return app!.inject({
      method: "POST",
      url: "/api/billing/webhook",
      headers: { "content-type": "application/json", "stripe-signature": signature },
      payload: JSON.stringify(event),
    });
  }

  it("requires a valid session token", async () => {
    await clerkApp(fakeGateway({}));
    expect((await app!.inject("/api/quote/AAPL")).statusCode).toBe(401);
    expect((await app!.inject({ url: "/api/quote/AAPL", headers: { authorization: "Bearer nope" } })).statusCode).toBe(401);
  });

  it("blocks signed-in users without a subscription, then unlocks after Stripe checkout completes", async () => {
    const gateway = fakeGateway({ status: "active", items: { data: [{ current_period_end: 1794268800 }] } as never });
    const store = await clerkApp(gateway);

    expect((await app!.inject({ url: "/api/quote/AAPL", headers: auth })).statusCode).toBe(402);

    const checkout = await app!.inject({ method: "POST", url: "/api/billing/checkout", headers: auth });
    expect(checkout.json().url).toContain("checkout.stripe.com");
    expect(gateway.createCheckout).toHaveBeenCalledWith("user_123", null);

    const done = await webhook({
      type: "checkout.session.completed",
      data: { object: { client_reference_id: "user_123", customer: "cus_1", subscription: "sub_1" } },
    });
    expect(done.statusCode).toBe(200);
    expect(store.get("user_123")).toMatchObject({ status: "active", stripeCustomerId: "cus_1", currentPeriodEnd: 1794268800 });

    expect((await app!.inject({ url: "/api/quote/AAPL", headers: auth })).statusCode).toBe(200);
    const me = (await app!.inject({ url: "/api/me", headers: auth })).json();
    expect(me).toMatchObject({ userId: "user_123", subscribed: true, devMode: false });
  });

  it("locks access again when the subscription is canceled, and rejects unsigned webhooks", async () => {
    const store = await clerkApp(fakeGateway({}));
    store.upsert({ userId: "user_123", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1", status: "active", currentPeriodEnd: null });

    expect((await webhook({ type: "customer.subscription.deleted", data: { object: { id: "sub_1", customer: "cus_1" } } }, "forged")).statusCode).toBe(400);
    expect(store.get("user_123")?.status).toBe("active");

    await webhook({ type: "customer.subscription.deleted", data: { object: { id: "sub_1", customer: "cus_1", status: "canceled" } } });
    expect(store.get("user_123")?.status).toBe("canceled");
    expect((await app!.inject({ url: "/api/quote/AAPL", headers: auth })).statusCode).toBe(402);
  });
});
