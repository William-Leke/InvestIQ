export type AuthMode = "dev" | "clerk";

export interface Config {
  port: number;
  corsOrigins: string[];
  fmpApiKey: string;
  secUserAgent: string;
  authMode: AuthMode;
  clerkIssuer: string;
  clerkJwksUrl: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripePriceId: string;
  checkoutSuccessUrl: string;
  checkoutCancelUrl: string;
  dbPath: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const authMode = (env.AUTH_MODE ?? "dev") as AuthMode;
  if (authMode !== "dev" && authMode !== "clerk") {
    throw new Error(`AUTH_MODE must be "dev" or "clerk", got "${authMode}"`);
  }
  return {
    port: Number(env.PORT ?? 8787),
    corsOrigins: (env.CORS_ORIGINS ?? "http://localhost:1420,tauri://localhost,http://tauri.localhost")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    fmpApiKey: env.FMP_API_KEY ?? "",
    secUserAgent: env.SEC_USER_AGENT ?? "Trendsight admin@example.com",
    authMode,
    clerkIssuer: env.CLERK_ISSUER ?? "",
    clerkJwksUrl: env.CLERK_JWKS_URL ?? "",
    stripeSecretKey: env.STRIPE_SECRET_KEY ?? "",
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET ?? "",
    stripePriceId: env.STRIPE_PRICE_ID ?? "",
    checkoutSuccessUrl: env.CHECKOUT_SUCCESS_URL ?? "https://trendsight.app/billing/success",
    checkoutCancelUrl: env.CHECKOUT_CANCEL_URL ?? "https://trendsight.app/billing/cancel",
    dbPath: env.DB_PATH ?? "./trendsight.db",
  };
}
