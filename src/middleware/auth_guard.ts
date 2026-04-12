import { createMiddleware } from "@hono/hono/factory";
import type { AppEnv } from "../types.ts";

/** Exact-match public paths (no prefix matching). */
const PUBLIC_EXACT_PATHS: ReadonlySet<string> = new Set([
  "/health",
  "/ready",
  "/login",
  "/",
]);

/** Prefix-match public paths (startsWith matching). */
const PUBLIC_PREFIX_PATHS = ["/auth/", "/static/"] as const;

/** Returns `true` when the requested path is public (no session required). */
const isPublicPath = (path: string): boolean =>
  PUBLIC_EXACT_PATHS.has(path) ||
  PUBLIC_PREFIX_PATHS.some((p) => path.startsWith(p));

/** Returns `true` when the request targets an API endpoint. */
const isApiRequest = (path: string): boolean => path.startsWith("/api/");

/**
 * Auth-guard middleware. Must run AFTER `sessionMiddleware` so that
 * `c.get("session")` is already resolved.
 *
 * - Public paths (`/health`, `/ready`, `/auth/*`, `/static/*`) pass through.
 * - If no valid session exists:
 *   - API requests (`/api/*`) receive a `401 JSON` response.
 *   - Page requests receive a `302` redirect to `/auth/login`.
 * - If a valid session exists the request continues to the next handler.
 */
export const authGuard = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const path = c.req.path;

    if (isPublicPath(path)) {
      await next();
      return;
    }

    const session = c.get("session");

    if (!session) {
      if (isApiRequest(path)) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      return c.redirect("/auth/login");
    }

    await next();
  });
