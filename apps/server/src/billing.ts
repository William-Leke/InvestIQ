import type { FastifyInstance } from "fastify";
import Stripe from "stripe";
import type { Config } from "./config.js";
import type { SubscriptionStore } from "./db.js";
import { HttpError } from "./errors.js";

/** The slice of Stripe InvestIQ uses, so tests can substitute a fake. */
export interface BillingGateway {
  createCheckout(userId: string, customerId: string | null): Promise<string>;
  createPortal(customerId: string): Promise<string>;
  parseEvent(rawBody: Buffer, signature: string): Stripe.Event;
  getSubscription(id: string): Promise<Stripe.Subscription>;
}

export function stripeGateway(config: Config): BillingGateway | null {
  if (!config.stripeSecretKey) return null;
  const stripe = new Stripe(config.stripeSecretKey);
  return {
    async createCheckout(userId, customerId) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: config.stripePriceId, quantity: 1 }],
        client_reference_id: userId,
        ...(customerId ? { customer: customerId } : {}),
        success_url: config.checkoutSuccessUrl,
        cancel_url: config.checkoutCancelUrl,
      });
      if (!session.url) throw new HttpError(502, "Stripe did not return a checkout URL");
      return session.url;
    },
    async createPortal(customerId) {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: config.checkoutSuccessUrl,
      });
      return session.url;
    },
    parseEvent(rawBody, signature) {
      return stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
    },
    getSubscription(id) {
      return stripe.subscriptions.retrieve(id);
    },
  };
}

/** Newer Stripe API versions report the billing period on the subscription item. */
function periodEnd(sub: Stripe.Subscription): number | null {
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const item = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined;
  return item?.current_period_end ?? legacy ?? null;
}

function customerId(c: string | { id: string } | null | undefined): string | null {
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

export async function billingRoutes(app: FastifyInstance, opts: { store: SubscriptionStore; gateway: BillingGateway | null }) {
  const { store, gateway } = opts;
  const needGateway = () => {
    if (!gateway) throw new HttpError(503, "Billing is not configured");
    return gateway;
  };

  app.post("/api/billing/checkout", { preHandler: app.authenticate }, async (req) => {
    const existing = store.get(req.userId);
    const url = await needGateway().createCheckout(req.userId, existing?.stripeCustomerId ?? null);
    return { url };
  });

  app.post("/api/billing/portal", { preHandler: app.authenticate }, async (req) => {
    const existing = store.get(req.userId);
    if (!existing?.stripeCustomerId) throw new HttpError(404, "No billing account yet");
    return { url: await needGateway().createPortal(existing.stripeCustomerId) };
  });

  // Webhooks need the raw body for signature verification, so they get their own parser scope.
  await app.register(async (scope) => {
    scope.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => done(null, body));

    scope.post("/api/billing/webhook", async (req, reply) => {
      const signature = req.headers["stripe-signature"];
      if (typeof signature !== "string") throw new HttpError(400, "Missing Stripe signature");
      let event: Stripe.Event;
      try {
        event = needGateway().parseEvent(req.body as Buffer, signature);
      } catch (err) {
        if (err instanceof HttpError) throw err;
        throw new HttpError(400, "Invalid Stripe signature");
      }

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.client_reference_id;
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
          if (!userId || !subId) break;
          const sub = await needGateway().getSubscription(subId);
          store.upsert({
            userId,
            stripeCustomerId: customerId(session.customer),
            stripeSubscriptionId: sub.id,
            status: sub.status,
            currentPeriodEnd: periodEnd(sub),
          });
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object;
          const cust = customerId(sub.customer);
          const existing = cust ? store.getByCustomer(cust) : undefined;
          if (!existing) break; // Checkout completion links the customer to a user first.
          store.upsert({
            ...existing,
            stripeSubscriptionId: sub.id,
            status: event.type === "customer.subscription.deleted" ? "canceled" : sub.status,
            currentPeriodEnd: periodEnd(sub),
          });
          break;
        }
      }
      return reply.send({ received: true });
    });
  });
}
