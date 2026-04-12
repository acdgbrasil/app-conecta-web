import { createMiddleware } from "@hono/hono/factory";
import { getCookie, setCookie } from "@hono/hono/cookie";
import type { AppEnv } from "../types.ts";

/** Cookie name for the CSRF token (double-submit cookie pattern). */
const CSRF_COOKIE = "__Host-csrf";

/** Header name where client sends the CSRF token back. */
const CSRF_HEADER = "x-csrf-token";

/** Methods that require CSRF validation. */
const MUTATING_METHODS: ReadonlySet<string> = new Set([
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
]);

/** Generates a random CSRF token (256-bit hex). */
const generateCsrfToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * CSRF middleware using the double-submit cookie pattern.
 *
 * - On GET/HEAD/OPTIONS: sets a CSRF cookie if not present.
 * - On POST/PUT/DELETE/PATCH: verifies `X-CSRF-Token` header matches the cookie value.
 * - Returns 403 on mismatch or missing token.
 *
 * API routes (/api/*) rely on fetch-metadata + X-Requested-With instead,
 * so CSRF cookie validation is only enforced on non-API mutating requests
 * (e.g., form submissions to /auth/logout).
 */
export const csrf = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const method = c.req.method;

    if (!MUTATING_METHODS.has(method)) {
      // On safe methods, ensure a CSRF cookie exists for subsequent mutating requests
      const existing = getCookie(c, CSRF_COOKIE);
      if (!existing) {
        const token = generateCsrfToken();
        setCookie(c, CSRF_COOKIE, token, {
          path: "/",
          httpOnly: false, // Client JS needs to read this to send it back
          secure: true,
          sameSite: "Strict",
        });
      }
      await next();
      return;
    }

    // For mutating methods on non-API paths, validate the CSRF token
    const path = c.req.path;
    if (!path.startsWith("/api/")) {
      const cookieToken = getCookie(c, CSRF_COOKIE);
      const headerToken = c.req.header(CSRF_HEADER);

      if (
        !cookieToken ||
        !headerToken ||
        cookieToken !== headerToken
      ) {
        return c.json({ error: "Forbidden: CSRF token mismatch" }, 403);
      }
    }

    await next();
  });
