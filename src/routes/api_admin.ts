// Admin API routes — proxies to people-context and social-care backends
// with audit logging on all mutations. Mounted at /api/admin.

import { Hono } from "@hono/hono";
import type { ContentfulStatusCode } from "@hono/hono/utils/http-status";
import type { AppEnv } from "../types.ts";
import type {
  RemoteClient,
  RemoteError,
  RemoteResponse,
} from "../adapters/remote/remote_client.ts";
import type { AuditAppendInput, AuditAction, AuditStore } from "../adapters/admin/types.ts";
import type { Result } from "../domain/shared/result.ts";

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

export type AdminRoutesDeps = Readonly<{
  remoteClient: RemoteClient;
  auditStore: AuditStore;
}>;

// ---------------------------------------------------------------------------
// Proxy helpers (duplicated from api.ts to avoid touching stable code)
// ---------------------------------------------------------------------------

const toJsonBody = (
  body: unknown,
): Record<string, unknown> | readonly unknown[] | null => {
  if (body === null || body === undefined) return null;
  // Safe: Array.isArray narrows to unknown[], cast adds readonly
  if (Array.isArray(body)) return body as readonly unknown[];
  // Safe: typeof + null check narrows to object, cast adds index signature
  if (typeof body === "object") return body as Record<string, unknown>;
  return null;
};

const isNullBodyStatus = (status: number): boolean =>
  status === 101 || status === 204 || status === 205 || status === 304;

/** Safely coerce response status to ContentfulStatusCode (same as api.ts). */
const toResponseStatus = (status: number): ContentfulStatusCode => {
  const clamped = Math.max(100, Math.min(599, status));
  // Safe: clamped is in valid HTTP range
  return clamped as ContentfulStatusCode;
};

/** Maps RemoteError to appropriate HTTP status codes. */
const ERROR_STATUS_MAP: Readonly<Record<RemoteError, ContentfulStatusCode>> = {
  UNAUTHORIZED: 401,
  SERVER_ERROR: 502,
  NETWORK_ERROR: 502,
  TIMEOUT: 504,
};

/** Allowed lookup table names — prevents path traversal via :tableName. */
const ALLOWED_LOOKUP_TABLES: ReadonlySet<string> = new Set([
  "dominio_tipo_identidade",
  "dominio_tipo_deficiencia",
  "dominio_parentesco",
  "dominio_programa_social",
  "dominio_condicao_ocupacao",
  "dominio_tipo_ingresso",
  "dominio_escolaridade",
  "dominio_tipo_beneficio",
  "dominio_efeito_condicionalidade",
  "dominio_tipo_violacao",
  "dominio_servico_vinculo",
  "dominio_tipo_medida",
  "dominio_unidade_realizacao",
]);

/** UUID v4 format regex for path parameter validation. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string): boolean => UUID_RE.test(value);

/** Max entries per page on audit endpoint. */
const MAX_AUDIT_LIMIT = 100;

/** Status value used by social-care backend for pending lookup requests. */
const PENDING_REQUEST_STATUS = "pendente";

/** Extracts a numeric `total` from a remote response body, defaulting to 0. */
const extractTotal = (
  result: Result<RemoteResponse, RemoteError>,
): number => {
  if (!result.ok || !result.value.body) return 0;
  const body = result.value.body;
  if (Array.isArray(body)) return body.length;
  if (
    typeof body === "object" &&
    body !== null &&
    "total" in body &&
    typeof (body as Record<string, unknown>).total === "number"
  ) {
    // Safe: narrowed via typeof check above
    return (body as Record<string, unknown>).total as number;
  }
  return 0;
};

/** Build audit input with discriminated outcome (SUCCESS has no errorMessage). */
const auditInput = (
  base: Readonly<{ actorId: string; actorName: string; action: AuditAction; targetId: string; details?: string }>,
  result: Result<RemoteResponse, RemoteError>,
): AuditAppendInput =>
  result.ok
    ? { ...base, outcome: "SUCCESS" as const }
    : { ...base, outcome: "FAILURE" as const, errorMessage: result.error };

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const createAdminApiRoutes = (
  deps: AdminRoutesDeps,
): Hono<AppEnv> => {
  const { remoteClient, auditStore } = deps;
  const admin = new Hono<AppEnv>();

  // --- Validate JSON body on mutating methods ---
  admin.use("*", async (c, next) => {
    const method = c.req.method;
    if (
      method === "POST" ||
      method === "PUT" ||
      method === "DELETE" ||
      method === "PATCH"
    ) {
      const contentType = c.req.header("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          await c.req.raw.clone().json();
        } catch {
          return c.json({ error: "Malformed JSON body" }, 400);
        }
      }
    }
    await next();
  });

  // =========================================================================
  // People Routes (proxy → people-context)
  // =========================================================================

  // GET /people — list
  admin.get("/people", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");

    const result = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: "/api/v1/people",
      method: "GET",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(toJsonBody(result.value.body), 200);
  });

  // GET /people/:id — detail
  admin.get("/people/:id", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const personId = c.req.param("id");
    if (!isValidUuid(personId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const result = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: `/api/v1/people/${personId}`,
      method: "GET",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // POST /people — register
  admin.post("/people", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");

    const body: unknown = await c.req.json();

    const result = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: "/api/v1/people",
      method: "POST",
      accessToken: session.accessToken,
      actorId: session.userSub,
      body,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "PERSON_CREATED", targetId: "new" },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // PUT /people/:id — update
  admin.put("/people/:id", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const personId = c.req.param("id");
    if (!isValidUuid(personId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const body: unknown = await c.req.json();

    const result = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: `/api/v1/people/${personId}`,
      method: "PUT",
      accessToken: session.accessToken,
      actorId: session.userSub,
      body,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "PERSON_UPDATED", targetId: personId },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // =========================================================================
  // Role Routes (proxy → people-context)
  // =========================================================================

  // GET /people/:id/roles — list roles
  admin.get("/people/:id/roles", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const personId = c.req.param("id");
    if (!isValidUuid(personId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const result = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: `/api/v1/people/${personId}/roles`,
      method: "GET",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(toJsonBody(result.value.body), 200);
  });

  // POST /people/:id/roles — assign role
  admin.post("/people/:id/roles", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const personId = c.req.param("id");
    if (!isValidUuid(personId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const body: unknown = await c.req.json();

    const result = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: `/api/v1/people/${personId}/roles`,
      method: "POST",
      accessToken: session.accessToken,
      actorId: session.userSub,
      body,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "ROLE_ASSIGNED", targetId: personId },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // PUT /people/:id/roles/:roleId/deactivate
  admin.put("/people/:id/roles/:roleId/deactivate", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const personId = c.req.param("id");
    const roleId = c.req.param("roleId");
    if (!isValidUuid(personId) || !isValidUuid(roleId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const result = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: `/api/v1/people/${personId}/roles/${roleId}/deactivate`,
      method: "PUT",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "ROLE_DEACTIVATED", targetId: personId, details: `roleId: ${roleId}` },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // PUT /people/:id/roles/:roleId/reactivate
  admin.put("/people/:id/roles/:roleId/reactivate", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const personId = c.req.param("id");
    const roleId = c.req.param("roleId");
    if (!isValidUuid(personId) || !isValidUuid(roleId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const result = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: `/api/v1/people/${personId}/roles/${roleId}/reactivate`,
      method: "PUT",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "ROLE_REACTIVATED", targetId: personId, details: `roleId: ${roleId}` },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // =========================================================================
  // Lookup Request Routes (proxy → social-care /api/v1/dominios/requests)
  // MUST be registered BEFORE /lookups/:tableName to prevent "requests"
  // being captured as a :tableName parameter.
  // =========================================================================

  // GET /lookups/requests — list pending requests
  admin.get("/lookups/requests", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");

    const result = await remoteClient.fetch({
      baseUrl: config.apiBaseUrl,
      path: "/api/v1/dominios/requests",
      method: "GET",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(toJsonBody(result.value.body), 200);
  });

  // POST /lookups/requests — create a new lookup request
  admin.post("/lookups/requests", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");

    const body: unknown = await c.req.json();

    const result = await remoteClient.fetch({
      baseUrl: config.apiBaseUrl,
      path: "/api/v1/dominios/requests",
      method: "POST",
      accessToken: session.accessToken,
      actorId: session.userSub,
      body,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "LOOKUP_REQUEST_CREATED", targetId: "new-request" },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // PUT /lookups/requests/:requestId/approve — approve a lookup request
  admin.put("/lookups/requests/:requestId/approve", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const requestId = c.req.param("requestId");
    if (!isValidUuid(requestId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const result = await remoteClient.fetch({
      baseUrl: config.apiBaseUrl,
      path: `/api/v1/dominios/requests/${requestId}/approve`,
      method: "PUT",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "LOOKUP_REQUEST_APPROVED", targetId: requestId },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // PUT /lookups/requests/:requestId/reject — reject a lookup request
  admin.put("/lookups/requests/:requestId/reject", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const requestId = c.req.param("requestId");
    if (!isValidUuid(requestId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const body: unknown = await c.req.json();

    const result = await remoteClient.fetch({
      baseUrl: config.apiBaseUrl,
      path: `/api/v1/dominios/requests/${requestId}/reject`,
      method: "PUT",
      accessToken: session.accessToken,
      actorId: session.userSub,
      body,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "LOOKUP_REQUEST_REJECTED", targetId: requestId },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // =========================================================================
  // Lookup Table Routes (proxy → social-care /api/v1/dominios/)
  // =========================================================================

  // GET /lookups/:tableName — list entries
  admin.get("/lookups/:tableName", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const tableName = c.req.param("tableName");
    if (!ALLOWED_LOOKUP_TABLES.has(tableName)) {
      return c.json({ error: "Invalid lookup table name" }, 400);
    }

    const result = await remoteClient.fetch({
      baseUrl: config.apiBaseUrl,
      path: `/api/v1/dominios/${tableName}`,
      method: "GET",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(toJsonBody(result.value.body), 200);
  });

  // POST /lookups/:tableName — create entry
  admin.post("/lookups/:tableName", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const tableName = c.req.param("tableName");
    if (!ALLOWED_LOOKUP_TABLES.has(tableName)) {
      return c.json({ error: "Invalid lookup table name" }, 400);
    }

    const body: unknown = await c.req.json();

    const result = await remoteClient.fetch({
      baseUrl: config.apiBaseUrl,
      path: `/api/v1/dominios/${tableName}`,
      method: "POST",
      accessToken: session.accessToken,
      actorId: session.userSub,
      body,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "LOOKUP_CREATED", targetId: tableName },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // PUT /lookups/:tableName/:id — update entry
  admin.put("/lookups/:tableName/:id", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const tableName = c.req.param("tableName");
    const entryId = c.req.param("id");
    if (!ALLOWED_LOOKUP_TABLES.has(tableName)) {
      return c.json({ error: "Invalid lookup table name" }, 400);
    }
    if (!isValidUuid(entryId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const body: unknown = await c.req.json();

    const result = await remoteClient.fetch({
      baseUrl: config.apiBaseUrl,
      path: `/api/v1/dominios/${tableName}/${entryId}`,
      method: "PUT",
      accessToken: session.accessToken,
      actorId: session.userSub,
      body,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "LOOKUP_UPDATED", targetId: `${tableName}/${entryId}` },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // PATCH /lookups/:tableName/:id/toggle — toggle active/inactive
  admin.patch("/lookups/:tableName/:id/toggle", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");
    const tableName = c.req.param("tableName");
    const entryId = c.req.param("id");
    if (!ALLOWED_LOOKUP_TABLES.has(tableName)) {
      return c.json({ error: "Invalid lookup table name" }, 400);
    }
    if (!isValidUuid(entryId)) {
      return c.json({ error: "Invalid ID format" }, 400);
    }

    const result = await remoteClient.fetch({
      baseUrl: config.apiBaseUrl,
      path: `/api/v1/dominios/${tableName}/${entryId}/toggle`,
      method: "PATCH",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    auditStore.append(auditInput(
      { actorId: session.userSub, actorName: session.userName, action: "LOOKUP_TOGGLED", targetId: `${tableName}/${entryId}` },
      result,
    ));

    if (!result.ok) {
      return c.json({ error: result.error }, ERROR_STATUS_MAP[result.error]);
    }
    if (isNullBodyStatus(result.value.status)) return c.body(null, 204);
    return c.json(
      toJsonBody(result.value.body),
      toResponseStatus(result.value.status),
    );
  });

  // =========================================================================
  // Audit Route (local store, not proxied)
  // =========================================================================

  admin.get("/audit", (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const rawLimit = Number(c.req.query("limit") ?? "50");
    const rawOffset = Number(c.req.query("offset") ?? "0");
    const limit = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_AUDIT_LIMIT)
      : 50;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

    const result = auditStore.list({ limit, offset });
    return c.json(result);
  });

  // =========================================================================
  // Stats Route (aggregated dashboard data)
  // =========================================================================

  admin.get("/stats", async (c) => {
    const session = c.get("session");
    if (!session) return c.json({ error: "Unauthorized" }, 401);
    const config = c.get("config");

    // Fetch people count from people-context
    const peopleResult = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: "/api/v1/people?limit=0",
      method: "GET",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    const peopleTotal = extractTotal(peopleResult);

    // Fetch active roles from people-context
    const rolesResult = await remoteClient.fetch({
      baseUrl: config.peopleContextBaseUrl,
      path: "/api/v1/roles?active=true",
      method: "GET",
      accessToken: session.accessToken,
      actorId: session.userSub,
    });

    const rolesActive = extractTotal(rolesResult);

    // Fetch pending lookup requests from social-care backend
    let pendingCount = 0;
    try {
      const requestsResult = await remoteClient.fetch({
        baseUrl: config.apiBaseUrl,
        path: "/api/v1/dominios/requests",
        method: "GET",
        accessToken: session.accessToken,
        actorId: session.userSub,
      });
      if (requestsResult.ok && requestsResult.value.body) {
        const reqBody = requestsResult.value.body as { data?: unknown[] };
        if (Array.isArray(reqBody?.data)) {
          pendingCount = reqBody.data.filter(
            (item: unknown) =>
              typeof item === "object" && item !== null && (item as Record<string, unknown>).status === PENDING_REQUEST_STATUS,
          ).length;
        }
      }
    } catch {
      // Stats should not break if one sub-fetch fails — default to 0
    }

    return c.json({
      data: {
        totalPeople: peopleTotal,
        activeRoles: rolesActive,
        pendingRequests: pendingCount,
        recentAuditCount: auditStore.count(),
      },
    });
  });

  return admin;
};
