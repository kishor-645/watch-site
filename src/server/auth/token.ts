import { SignJWT, jwtVerify } from "jose";

/**
 * Session token helpers. Edge-safe (used by middleware) — must not import mongodb or server-only.
 * A valid token alone is NOT sufficient for access: server code must also compare `sv`
 * with admins.sessionVersion (see session.ts).
 */

/**
 * Production uses the `__Host-` prefix: browsers only accept it with Secure, Path=/ and no Domain
 * (see sessionCookieOptions), so a sibling subdomain cannot plant or overwrite the session cookie.
 * Plain-HTTP local development cannot set Secure cookies, hence the unprefixed name there.
 * Middleware reads the same constant (NODE_ENV is inlined at build time).
 */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-mw_admin_session" : "mw_admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
const ISSUER = "mywatch";
const AUDIENCE = "mywatch-admin";

export interface SessionClaims {
  sub: string; // admin _id (hex)
  username: string;
  sv: number; // session version
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("[config] SESSION_SECRET must be set (min 32 characters)");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ username: claims.username, sv: claims.sv })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionClaims | null> {
  if (!token || token.length > 2048) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || typeof payload.username !== "string" || typeof payload.sv !== "number") {
      return null;
    }
    return { sub: payload.sub, username: payload.username, sv: payload.sv };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
