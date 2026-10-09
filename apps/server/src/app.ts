import cors from "@fastify/cors";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { authenticate, clerkVerifier, DEV_USER_ID, requireSubscription, type TokenVerifier } from "./auth.js";
import { type BillingGateway, billingRoutes, stripeGateway } from "./billing.js";
import { TtlCache } from "./cache.js";
import type { Config } from "./config.js";
import { isActive, SubscriptionStore } from "./db.js";
import { HttpError } from "./errors.js";
import { EdgarClient } from "./providers/edgar.js";
import { FmpClient } from "./providers/fmp.js";
import type { Fetch } from "./providers/http.js";
import { marketRoutes } from "./routes/market.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => Promise<void>;
    requireSubscription: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface AppDeps {
  fetch?: Fetch;
  store?: SubscriptionStore;
  verifier?: TokenVerifier | null;
  gateway?: BillingGateway | null;
}

export async function buildApp(config: Config, deps: AppDeps = {}) {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });
  const store = deps.store ?? new SubscriptionStore(config.dbPath);
  const verifier = deps.verifier !== undefined ? deps.verifier : config.authMode === "clerk" ? clerkVerifier(config) : null;
  const gateway = deps.gateway !== undefined ? deps.gateway : stripeGateway(config);
  const fetchImpl = deps.fetch ?? fetch;

  await app.register(cors, { origin: config.corsOrigins });

  app.decorate("authenticate", authenticate(config, verifier));
  app.decorate("requireSubscription", requireSubscription(config, store));

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HttpError) {
      return reply.status(err.statusCode).send({ error: err.message });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) return reply.status(status).send({ error: (err as Error).message });
    req.log.error(err);
    return reply.status(500).send({ error: "Internal error" });
  });

  app.get("/health", async () => ({ ok: true }));

  app.get("/api/me", { preHandler: app.authenticate }, async (req) => {
    const sub = store.get(req.userId);
    return {
      userId: req.userId,
      devMode: config.authMode === "dev",
      subscribed: config.authMode === "dev" || isActive(sub),
      subscription: sub ? { status: sub.status, currentPeriodEnd: sub.currentPeriodEnd } : null,
    };
  });

  await app.register(billingRoutes, { store, gateway });
  await app.register(marketRoutes, {
    fmp: new FmpClient(config.fmpApiKey, fetchImpl),
    edgar: new EdgarClient(config.secUserAgent, fetchImpl),
    cache: new TtlCache(),
  });

  app.addHook("onClose", async () => store.close());
  return app;
}

export { DEV_USER_ID };
