// Admin Guard — RBAC middleware for admin/owner roles.
// Runs AFTER authGuard (session already resolved).

import { createMiddleware } from "@hono/hono/factory";
import type { AppEnv } from "../types.ts";

/** Roles that grant access to admin routes. */
type AdminRole = "admin" | "owner";

const ADMIN_ROLES: ReadonlySet<string> = new Set<AdminRole>(["admin", "owner"]);

/** Returns true if the request targets an API endpoint. */
const isApiPath = (path: string): boolean => path.startsWith("/api/");

/**
 * Admin-guard middleware.
 * Checks `session.roles` for "admin" or "owner".
 *
 * - For `/api/admin/*`: returns 403 JSON.
 * - For `/admin/*` SSR: redirects to `/` (user IS authenticated, just not admin).
 */
export const adminGuard = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const session = c.get("session");

    const hasRole = session?.roles?.some((r) => ADMIN_ROLES.has(r)) ?? false;

    if (!hasRole) {
      if (isApiPath(c.req.path)) {
        return c.json({ error: "Forbidden: admin role required" }, 403);
      }
      return c.redirect("/");
    }

    await next();
  });
