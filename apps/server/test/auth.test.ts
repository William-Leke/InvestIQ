import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { clerkVerifier } from "../src/auth.js";
import { loadConfig } from "../src/config.js";

describe("clerkVerifier", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
  const config = loadConfig({ AUTH_MODE: "clerk", CLERK_ISSUER: "https://clerk.test", CLERK_JWKS_URL: "https://clerk.test/jwks" });
  const verify = clerkVerifier(config, createLocalJWKSet({ keys: [jwk] }));
  const sign = (claims: { iss: string; sub?: string; exp?: string }) => {
    const jwt = new SignJWT({}).setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer(claims.iss).setIssuedAt().setExpirationTime(claims.exp ?? "5m");
    if (claims.sub) jwt.setSubject(claims.sub);
    return jwt.sign(privateKey);
  };

  it("returns the user id from a valid Clerk session token", async () => {
    expect(await verify(await sign({ iss: "https://clerk.test", sub: "user_abc" }))).toBe("user_abc");
  });

  it("rejects tokens from another issuer, expired tokens and tokens without a subject", async () => {
    await expect(verify(await sign({ iss: "https://evil.test", sub: "user_abc" }))).rejects.toThrow();
    await expect(verify(await sign({ iss: "https://clerk.test", sub: "user_abc", exp: "-1m" }))).rejects.toThrow();
    await expect(verify(await sign({ iss: "https://clerk.test" }))).rejects.toThrow();
  });
});
