import type { FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from "jose";
import type { Config } from "./config.js";
import { isActive, type SubscriptionStore } from "./db.js";
import { HttpError } from "./errors.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export const DEV_USER_ID = "dev-user";

export type TokenVerifier = (token: string) => Promise<string>;

/** Verifies a Clerk session JWT and returns the user id (the `sub` claim). */
export function clerkVerifier(config: Config, keys?: JWTVerifyGetKey): TokenVerifier {
  if (!config.clerkJwksUrl || !config.clerkIssuer) {
    throw new Error("AUTH_MODE=clerk requires CLERK_JWKS_URL and CLERK_ISSUER");
  }
  const jwks = keys ?? createRemoteJWKSet(new URL(config.clerkJwksUrl));
  return async (token) => {
    const { payload } = await jwtVerify(token, jwks, { issuer: config.clerkIssuer });
    if (!payload.sub) throw new Error("token has no subject");
    return payload.sub;
  };
}

export function authenticate(config: Config, verify: TokenVerifier | null) {
  return async (req: FastifyRequest) => {
    if (config.authMode === "dev") {
      req.userId = DEV_USER_ID;
      return;
    }
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token || !verify) throw new HttpError(401, "Sign in required");
    try {
      req.userId = await verify(token);
    } catch {
      throw new HttpError(401, "Session expired or invalid; sign in again");
    }
  };
}

/** Market data is only served to users with an active or trialing subscription. */
export function requireSubscription(config: Config, store: SubscriptionStore) {
  return async (req: FastifyRequest, _reply: FastifyReply) => {
    if (config.authMode === "dev") return;
    if (!isActive(store.get(req.userId))) {
      throw new HttpError(402, "An active Trendsight subscription is required");
    }
  };
}
