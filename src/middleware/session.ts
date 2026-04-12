import { createMiddleware } from "@hono/hono/factory";
import { getCookie } from "@hono/hono/cookie";
import type { AppEnv } from "../types.ts";

/** Cookie name for the opaque session ID. __Host- prefix requires Secure + Path=/ + no Domain. */
export const SESSION_COOKIE_SECURE = "__Host-session";
export const SESSION_COOKIE_DEV = "session";
export const SESSION_COOKIE = SESSION_COOKIE_SECURE; // default for imports

/** Refresh buffer — attempt refresh when token expires within this window. */
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Session middleware. Reads the session cookie, resolves the session from the
 * store, and sets `session` + `sessionId` on Hono context.
 *
 * If the access token is about to expire (within 5 min) and a refresh token
 * is available, automatically refreshes the token pair via the TokenRefresher.
 *
 * If no cookie is present, session not found, or session is expired without
 * a refresh token, both context values are set to `undefined`.
 * Redirection is NOT handled here — that is the responsibility of `authGuard`.
 */
export const sessionMiddleware = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    // Try secure cookie first, then dev cookie
    const rawCookie = getCookie(c, SESSION_COOKIE_SECURE) ??
      getCookie(c, SESSION_COOKIE_DEV);
    const sessionStore = c.get("sessionStore");

    // Verify HMAC signature and extract plain session ID
    let sessionId: string | undefined;
    if (rawCookie) {
      const tokenRefresher = c.get("tokenRefresher");
      if (tokenRefresher) {
        sessionId = await tokenRefresher.verifySessionCookie(rawCookie);
      } else {
        // Fallback: use raw cookie value (for tests without HMAC)
        sessionId = rawCookie;
      }
    }

    if (sessionId && sessionStore) {
      const session = sessionStore.get(sessionId);
      const now = Date.now();

      if (session) {
        const needsRefresh = session.expiresAt - now < REFRESH_BUFFER_MS;

        if (needsRefresh && session.refreshToken !== undefined) {
          // Attempt silent refresh
          const tokenRefresher = c.get("tokenRefresher");
          if (tokenRefresher) {
            const result = await tokenRefresher.refresh(sessionId);
            if (result.ok) {
              c.set("session", result.value);
              c.set("sessionId", sessionId);
            } else {
              // Refresh failed — if token still valid, use it; otherwise clear
              if (session.expiresAt > now) {
                c.set("session", session);
                c.set("sessionId", sessionId);
              } else {
                sessionStore.delete(sessionId);
                c.set("session", undefined);
                c.set("sessionId", undefined);
              }
            }
          } else if (session.expiresAt > now) {
            c.set("session", session);
            c.set("sessionId", sessionId);
          } else {
            sessionStore.delete(sessionId);
            c.set("session", undefined);
            c.set("sessionId", undefined);
          }
        } else if (session.expiresAt > now) {
          c.set("session", session);
          c.set("sessionId", sessionId);
        } else {
          // Expired, no refresh token
          sessionStore.delete(sessionId);
          c.set("session", undefined);
          c.set("sessionId", undefined);
        }
      } else {
        c.set("session", undefined);
        c.set("sessionId", undefined);
      }
    } else {
      c.set("session", undefined);
      c.set("sessionId", undefined);
    }

    await next();
  });
