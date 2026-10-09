import { DatabaseSync } from "node:sqlite";

export interface Subscription {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: number | null;
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function isActive(sub: Subscription | undefined): boolean {
  return !!sub && ACTIVE_STATUSES.has(sub.status);
}

export class SubscriptionStore {
  private db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT PRIMARY KEY,
        stripe_customer_id TEXT UNIQUE,
        stripe_subscription_id TEXT,
        status TEXT NOT NULL,
        current_period_end INTEGER,
        updated_at INTEGER NOT NULL
      )
    `);
  }

  get(userId: string): Subscription | undefined {
    const row = this.db.prepare("SELECT * FROM subscriptions WHERE user_id = ?").get(userId);
    return row ? toSubscription(row) : undefined;
  }

  getByCustomer(customerId: string): Subscription | undefined {
    const row = this.db.prepare("SELECT * FROM subscriptions WHERE stripe_customer_id = ?").get(customerId);
    return row ? toSubscription(row) : undefined;
  }

  upsert(sub: Subscription): void {
    this.db
      .prepare(
        `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           stripe_customer_id = excluded.stripe_customer_id,
           stripe_subscription_id = excluded.stripe_subscription_id,
           status = excluded.status,
           current_period_end = excluded.current_period_end,
           updated_at = excluded.updated_at`,
      )
      .run(sub.userId, sub.stripeCustomerId, sub.stripeSubscriptionId, sub.status, sub.currentPeriodEnd, Date.now());
  }

  close() {
    this.db.close();
  }
}

function toSubscription(row: Record<string, unknown>): Subscription {
  return {
    userId: String(row.user_id),
    stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? null,
    status: String(row.status),
    currentPeriodEnd: (row.current_period_end as number | null) ?? null,
  };
}
