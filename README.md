# InvestIQ

Desktop stock research for paying subscribers: live quote, TradingView chart, company profile, ten years of financial statements with charts, and SEC filings.

This is Phase 1 of the build plan. Analyst ratings, fair value, earnings transcripts and AI bull/bear cases come in later phases.

## Layout

| Path | What it is |
| --- | --- |
| `apps/desktop` | Tauri 2 desktop app, React + TypeScript + Tailwind, ECharts for financial charts |
| `apps/server` | Data service (Fastify). Holds the vendor keys, caches responses, checks sign-in and subscription before serving data |

The desktop app never talks to data vendors directly; every request goes through the service, which keeps API keys out of the installer and lets vendors be swapped in one place.

## Run it locally

Prerequisites: Node 22+, pnpm 10, Rust (stable), and the [Tauri system dependencies](https://v2.tauri.app/start/prerequisites/) for your OS.

```sh
pnpm install
cp apps/server/.env.example apps/server/.env      # add FMP_API_KEY and a real SEC_USER_AGENT
pnpm dev:server                                   # http://localhost:8787
pnpm dev:desktop                                  # opens the InvestIQ window
```

`pnpm dev:web` runs the same interface in a browser at http://localhost:1420 if you don't need the desktop shell.

With `AUTH_MODE=dev` (the default in `.env.example`) the service skips sign-in and subscription checks. Never deploy that way.

## Sign-in and billing

- **Sign-in:** the service verifies [Clerk](https://clerk.com) session tokens (`AUTH_MODE=clerk`, `CLERK_ISSUER`, `CLERK_JWKS_URL`). The desktop sign-in screen is still a placeholder; wiring Clerk's sign-in into the Tauri window needs a Clerk account.
- **Subscriptions:** Stripe Checkout and the customer portal. Point a Stripe webhook at `POST /api/billing/webhook` with the `checkout.session.completed` and `customer.subscription.*` events. Users get data only while their subscription is `active` or `trialing`; anyone else gets a 402 and the app shows a Subscribe button.

## Data sources

| Feature | Source |
| --- | --- |
| Search, quote, profile, financial statements | [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs) `stable` API |
| SEC filings | [SEC EDGAR](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) submissions API (free; 10 requests/second, descriptive User-Agent required) |
| Price chart | [TradingView Advanced Chart widget](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/) (free; attribution must stay visible) |

Serving vendor data to paying users requires FMP's commercial redistribution license, not a personal plan. Get that in writing before the first subscriber.

The desktop window's Content Security Policy (`apps/desktop/src-tauri/tauri.conf.json`) allows the API at `http://localhost:8787` and `https://api.investiq.app`; change the latter to the real production host when the service is deployed.

## Tests

```sh
pnpm test        # server API tests (vendor responses mocked) + formatting tests
pnpm typecheck
```

## Endpoints

| Method and path | Purpose | Cache |
| --- | --- | --- |
| `GET /api/me` | Current user and subscription status | none |
| `GET /api/search?q=` | Ticker and company search | 1 hour |
| `GET /api/quote/:symbol` | Price, change, ranges, market cap | 15 seconds |
| `GET /api/profile/:symbol` | Company profile | 24 hours |
| `GET /api/financials/:symbol` | 10 fiscal years of income, balance sheet and cash flow, oldest first | 12 hours |
| `GET /api/filings/:symbol?forms=10-K,10-Q` | Recent SEC filings with document links | 30 minutes |
| `POST /api/billing/checkout` | Stripe Checkout URL | none |
| `POST /api/billing/portal` | Stripe customer portal URL | none |
| `POST /api/billing/webhook` | Stripe events (signature verified) | none |
