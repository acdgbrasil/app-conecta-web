import { createMiddleware } from "@hono/hono/factory";
import type { AppEnv } from "../types.ts";

/**
 * Fetch Metadata middleware. Validates browser-sent Sec-Fetch-* headers on /api/* routes.
 *
 * - Sec-Fetch-Site: must be "same-origin" or "none" (direct navigation) on ALL methods.
 *   Missing header is allowed (non-browser clients like curl).
 * - X-Requested-With: "XMLHttpRequest" required on ALL methods to /api/*.
 *   This is defense-in-depth for browsers that don't support Sec-Fetch-Site.
 *   Missing header is rejected because all legitimate client code sets it via base-client.ts.
 *
 * Non-API routes pass through without checks.
 * Returns 403 on validation failure.
 */
export const fetchMetadata = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const path = c.req.path;

    // Only enforce on /api/* routes
    if (!path.startsWith("/api/")) {
      await next();
      return;
    }

    // Sec-Fetch-Site validation: reject cross-origin requests
    const fetchSite = c.req.header("sec-fetch-site");
    if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
      return c.json({ error: "Forbidden: cross-origin request" }, 403);
    }

    // X-Requested-With required on ALL methods for /api/* (defense-in-depth)
    const xrw = c.req.header("x-requested-with");
    if (xrw !== "XMLHttpRequest") {
      return c.json(
        { error: "Forbidden: missing X-Requested-With header" },
        403,
      );
    }

    await next();
  });
