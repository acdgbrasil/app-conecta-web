import type { Result } from "../../domain/shared/result.ts";
import { ok, err } from "../../domain/shared/result.ts";
import type { ServerConfig } from "../config/server_config.ts";
import type { Session, SessionStore, TokenRefreshError } from "../../types.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** BFFAuthError is an alias for TokenRefreshError — keeps adapter aligned with contract. */
export type BFFAuthError = TokenRefreshError;

type OIDCDiscovery = Readonly<{
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string | undefined;
  userinfo_endpoint: string | undefined;
}>;

type PKCEEntry = Readonly<{
  verifier: string;
  createdAt: number;
}>;

type TokenResponse = Readonly<{
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}>;

/** Matches Zitadel roles claim with or without project ID. */
const ROLES_CLAIM_PATTERN = /^urn:zitadel:iam:org:project:(?:\d+:)?roles$/;

/** Finds the roles claim in a JWT payload, handling both formats. */
const findRolesClaim = (
  payload: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> | undefined => {
  const key = Object.keys(payload).find((k) => ROLES_CLAIM_PATTERN.test(k));
  if (!key) return undefined;
  const value = payload[key];
  return typeof value === "object" && value !== null
    ? value as Readonly<Record<string, unknown>>
    : undefined;
};

type JWTPayload = Readonly<{
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  iss?: string;
  aud?: string | readonly string[];
  exp?: number;
  [key: string]: unknown;
}>;

export type BFFAuthService = Readonly<{
  login: () => Promise<Result<Readonly<{ url: string; state: string }>, BFFAuthError>>;
  callback: (
    code: string,
    state: string,
  ) => Promise<
    Result<Readonly<{ sessionId: string; cookieValue: string }>, BFFAuthError>
  >;
  refresh: (
    sessionId: string,
  ) => Promise<Result<Session, BFFAuthError>>;
  logout: (
    sessionId: string,
  ) => Readonly<{ endSessionUrl: string | undefined }>;
  verifySessionCookie: (cookieValue: string) => Promise<string | undefined>;
}>;

// ---------------------------------------------------------------------------
// PKCE helpers (exported for testing)
// ---------------------------------------------------------------------------

export const base64urlEncode = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const generateVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array);
};

export const computeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(new Uint8Array(hash));
};

// ---------------------------------------------------------------------------
// HMAC signing helpers — used to sign session cookie values
// ---------------------------------------------------------------------------

const importHmacKey = async (secret: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
};

export const signSessionId = async (
  sessionId: string,
  key: CryptoKey,
): Promise<string> => {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(sessionId));
  const sig = base64urlEncode(new Uint8Array(signature));
  return `${sessionId}.${sig}`;
};

export const verifySignedSessionId = async (
  cookieValue: string,
  key: CryptoKey,
): Promise<string | undefined> => {
  const dotIndex = cookieValue.lastIndexOf(".");
  if (dotIndex === -1) return undefined;
  const sessionId = cookieValue.slice(0, dotIndex);
  const sig = cookieValue.slice(dotIndex + 1);
  const encoder = new TextEncoder();
  // Reconstruct expected signature
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(sessionId));
  const expectedSig = base64urlEncode(new Uint8Array(expected));
  if (sig !== expectedSig) return undefined;
  return sessionId;
};

// ---------------------------------------------------------------------------
// OIDC Discovery (cached in closure with TTL)
// ---------------------------------------------------------------------------

/** Discovery cache TTL — 1 hour. */
const DISCOVERY_CACHE_TTL = 3600_000;

const fetchDiscovery = async (
  issuer: string,
): Promise<Result<OIDCDiscovery, BFFAuthError>> => {
  try {
    const url = `${issuer}/.well-known/openid-configuration`;
    const res = await fetch(url);
    if (!res.ok) return err("OIDC_DISCOVERY_FAILED");
    const body = await res.json() as Record<string, unknown>;
    return ok({
      authorization_endpoint: body.authorization_endpoint as string,
      token_endpoint: body.token_endpoint as string,
      end_session_endpoint:
        (body.end_session_endpoint as string | undefined) ?? undefined,
      userinfo_endpoint:
        (body.userinfo_endpoint as string | undefined) ?? undefined,
    });
  } catch {
    return err("OIDC_DISCOVERY_FAILED");
  }
};

// ---------------------------------------------------------------------------
// JWT payload decode (no verification — token came over TLS from provider)
// ---------------------------------------------------------------------------

const decodeIdTokenPayload = (
  idToken: string,
): Result<JWTPayload, "ID_TOKEN_DECODE_FAILED"> => {
  try {
    const parts = idToken.split(".");
    const payload = parts[1] ?? "";
    // base64url -> base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return ok(JSON.parse(json) as JWTPayload);
  } catch {
    return err("ID_TOKEN_DECODE_FAILED");
  }
};

/**
 * Validates id_token claims: issuer must match config, audience must include
 * our client_id, and token must not be expired.
 */
const validateIdTokenClaims = (
  payload: JWTPayload,
  expectedIssuer: string,
  expectedClientId: string,
): Result<JWTPayload, "ID_TOKEN_DECODE_FAILED"> => {
  // Validate issuer claim
  if (payload.iss !== undefined && payload.iss !== expectedIssuer) {
    return err("ID_TOKEN_DECODE_FAILED");
  }

  // Validate audience claim — must include our client_id
  if (payload.aud !== undefined) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(expectedClientId)) {
      return err("ID_TOKEN_DECODE_FAILED");
    }
  }

  // Validate expiration claim
  if (payload.exp !== undefined) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSeconds) {
      return err("ID_TOKEN_DECODE_FAILED");
    }
  }

  return ok(payload);
};

// ---------------------------------------------------------------------------
// Cookie formatting
// ---------------------------------------------------------------------------

const formatSessionCookie = (
  sessionId: string,
  maxAgeSeconds: number,
  secure: boolean,
): string =>
  secure
    ? `__Host-session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`
    : `session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;

// ---------------------------------------------------------------------------
// PKCE store helpers
// ---------------------------------------------------------------------------

const PKCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PKCE_MAX_ENTRIES = 1000;

const sweepExpired = (store: Map<string, PKCEEntry>, now: number): void => {
  for (const [key, entry] of store) {
    if (now - entry.createdAt > PKCE_TTL_MS) {
      store.delete(key);
    }
  }
};

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** Derives the base URL (origin) from a full redirect URI, e.g.
 *  "http://localhost:8081/auth/callback" → "http://localhost:8081" */
const deriveBaseUrl = (redirectUri: string): string | undefined => {
  try {
    const url = new URL(redirectUri);
    return url.origin;
  } catch {
    return undefined;
  }
};

// ---------------------------------------------------------------------------
// UserInfo endpoint helper
// ---------------------------------------------------------------------------

type UserInfoResponse = Readonly<{
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
}>;

const fetchUserInfo = async (
  userinfoEndpoint: string,
  accessToken: string,
): Promise<Result<UserInfoResponse, "USERINFO_FAILED">> => {
  try {
    const res = await fetch(userinfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return err("USERINFO_FAILED");
    const body = (await res.json()) as UserInfoResponse;
    return ok(body);
  } catch {
    return err("USERINFO_FAILED");
  }
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const createBFFAuthService = (
  config: ServerConfig,
  sessionStore: SessionStore,
): BFFAuthService => {
  const pkceStore = new Map<string, PKCEEntry>();
  let discoveryCache: OIDCDiscovery | undefined;
  let discoveryExpiresAt = 0;

  // Import HMAC key from sessionSecret for cookie signing
  const hmacKeyPromise = importHmacKey(config.sessionSecret);

  const getDiscovery = async (): Promise<
    Result<OIDCDiscovery, BFFAuthError>
  > => {
    const now = Date.now();
    if (discoveryCache !== undefined && now < discoveryExpiresAt) {
      return ok(discoveryCache);
    }
    // Cache expired or missing — re-fetch
    discoveryCache = undefined;
    const result = await fetchDiscovery(config.oidc.issuer);
    if (result.ok) {
      discoveryCache = result.value;
      discoveryExpiresAt = now + DISCOVERY_CACHE_TTL;
    }
    return result;
  };

  const login = async (): Promise<
    Result<Readonly<{ url: string; state: string }>, BFFAuthError>
  > => {
    const now = Date.now();
    sweepExpired(pkceStore, now);

    // Enforce max entries
    if (pkceStore.size >= PKCE_MAX_ENTRIES) {
      sweepExpired(pkceStore, now);
      // If still over limit after sweep, remove oldest entries
      if (pkceStore.size >= PKCE_MAX_ENTRIES) {
        const entries = [...pkceStore.entries()].sort(
          (a, b) => a[1].createdAt - b[1].createdAt,
        );
        const toRemove = entries.slice(
          0,
          pkceStore.size - PKCE_MAX_ENTRIES + 1,
        );
        for (const [key] of toRemove) {
          pkceStore.delete(key);
        }
      }
    }

    const discoveryResult = await getDiscovery();
    if (!discoveryResult.ok) return discoveryResult;

    const discovery = discoveryResult.value;
    const state = crypto.randomUUID();
    const verifier = generateVerifier();
    const challenge = await computeChallenge(verifier);

    pkceStore.set(state, { verifier, createdAt: now });

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.oidc.clientId,
      redirect_uri: config.oidc.redirectUri,
      scope: "openid profile email offline_access urn:zitadel:iam:org:project:roles",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    const url = `${discovery.authorization_endpoint}?${params.toString()}`;
    return ok({ url, state });
  };

  const callback = async (
    code: string,
    state: string,
  ): Promise<
    Result<
      Readonly<{ sessionId: string; cookieValue: string }>,
      BFFAuthError
    >
  > => {
    const pkceEntry = pkceStore.get(state);
    if (pkceEntry === undefined) return err("INVALID_STATE");

    pkceStore.delete(state);

    const now = Date.now();
    if (now - pkceEntry.createdAt > PKCE_TTL_MS) return err("PKCE_EXPIRED");

    const discoveryResult = await getDiscovery();
    if (!discoveryResult.ok) return discoveryResult;

    const discovery = discoveryResult.value;

    // Exchange authorization code for tokens
    try {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.oidc.redirectUri,
        client_id: config.oidc.clientId,
        client_secret: config.oidc.clientSecret,
        code_verifier: pkceEntry.verifier,
      });

      const res = await fetch(discovery.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) return err("TOKEN_EXCHANGE_FAILED");

      const tokenData = (await res.json()) as TokenResponse;

      // Decode id_token for user info (or fall back to sub from access_token)
      let userSub = "unknown";
      let userName = "unknown";
      let roles: readonly string[] = [];
      if (tokenData.id_token !== undefined) {
        const decodeResult = decodeIdTokenPayload(tokenData.id_token);
        if (!decodeResult.ok) return decodeResult;

        // Validate id_token claims (iss, aud, exp)
        const claimsResult = validateIdTokenClaims(
          decodeResult.value,
          config.oidc.issuer,
          config.oidc.clientId,
        );
        if (!claimsResult.ok) return claimsResult;

        const payload = claimsResult.value;
        userSub = payload.sub;
        userName =
          payload.name ?? payload.preferred_username ?? payload.email ?? "unknown";

        // Extract roles from Zitadel claim
        const rolesClaim = findRolesClaim(payload as unknown as Readonly<Record<string, unknown>>);
        if (rolesClaim !== undefined) {
          roles = Object.keys(rolesClaim);
        }
      }

      // Fallback: if name not in id_token, try userinfo endpoint
      if (userName === "unknown" && tokenData.access_token && discovery.userinfo_endpoint) {
        const userinfoResult = await fetchUserInfo(
          discovery.userinfo_endpoint,
          tokenData.access_token,
        );
        if (userinfoResult.ok) {
          userSub = userinfoResult.value.sub;
          userName =
            userinfoResult.value.name ??
            userinfoResult.value.preferred_username ??
            userinfoResult.value.email ??
            "unknown";
        }
      }

      // Session TTL: minimum of token expiry and configured max
      const tokenExpiryMs = tokenData.expires_in * 1000;
      const configExpiryMs = config.sessionTtlMinutes * 60 * 1000;
      const expiresAt = now + Math.min(tokenExpiryMs, configExpiryMs);

      const session: Session = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? undefined,
        idToken: tokenData.id_token ?? undefined,
        expiresAt,
        userSub,
        userName,
        roles,
      };

      const sessionId = crypto.randomUUID();
      sessionStore.set(sessionId, session);

      const maxAgeSeconds = Math.floor(
        Math.min(tokenExpiryMs, configExpiryMs) / 1000,
      );
      // HMAC-sign the session ID before placing in cookie
      const hmacKey = await hmacKeyPromise;
      const signedId = await signSessionId(sessionId, hmacKey);
      const cookieValue = formatSessionCookie(signedId, maxAgeSeconds, config.secureCookies);

      return ok({ sessionId, cookieValue });
    } catch {
      return err("TOKEN_EXCHANGE_FAILED");
    }
  };

  const refresh = async (
    sessionId: string,
  ): Promise<Result<Session, BFFAuthError>> => {
    const currentSession = sessionStore.get(sessionId);
    if (currentSession === undefined) return err("INVALID_STATE");
    if (currentSession.refreshToken === undefined) return err("TOKEN_EXCHANGE_FAILED");

    const discoveryResult = await getDiscovery();
    if (!discoveryResult.ok) return discoveryResult;

    try {
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: currentSession.refreshToken,
        client_id: config.oidc.clientId,
        client_secret: config.oidc.clientSecret,
      });

      const res = await fetch(discoveryResult.value.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) return err("TOKEN_EXCHANGE_FAILED");

      const tokenData = (await res.json()) as TokenResponse;
      const now = Date.now();
      const tokenExpiryMs = tokenData.expires_in * 1000;
      const configExpiryMs = config.sessionTtlMinutes * 60 * 1000;
      const expiresAt = now + Math.min(tokenExpiryMs, configExpiryMs);

      // Extract updated roles from new id_token if present
      let newRoles = currentSession.roles;
      let newIdToken = currentSession.idToken;
      if (tokenData.id_token !== undefined) {
        newIdToken = tokenData.id_token;
        const decodeResult = decodeIdTokenPayload(tokenData.id_token);
        if (decodeResult.ok) {
          const rolesClaim = findRolesClaim(decodeResult.value as unknown as Readonly<Record<string, unknown>>);
          if (rolesClaim !== undefined) {
            newRoles = Object.keys(rolesClaim);
          }
        }
      }

      const newSession: Session = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? currentSession.refreshToken,
        idToken: newIdToken,
        expiresAt,
        userSub: currentSession.userSub,
        userName: currentSession.userName,
        roles: newRoles,
      };

      sessionStore.set(sessionId, newSession);
      return ok(newSession);
    } catch {
      return err("TOKEN_EXCHANGE_FAILED");
    }
  };

  const logout = (
    sessionId: string,
  ): Readonly<{ endSessionUrl: string | undefined }> => {
    const currentSession = sessionStore.get(sessionId);
    sessionStore.delete(sessionId);

    const endSessionEndpoint = discoveryCache?.end_session_endpoint;
    if (endSessionEndpoint === undefined) {
      return { endSessionUrl: undefined };
    }

    // Build end_session URL with id_token_hint and post_logout_redirect_uri
    const params = new URLSearchParams();
    if (currentSession?.idToken !== undefined) {
      params.set("id_token_hint", currentSession.idToken);
    }
    // Derive base URL from redirect_uri by stripping the path
    const postLogoutUri = deriveBaseUrl(config.oidc.redirectUri);
    if (postLogoutUri !== undefined) {
      params.set("post_logout_redirect_uri", postLogoutUri);
    }

    const qs = params.toString();
    const endSessionUrl = qs.length > 0
      ? `${endSessionEndpoint}?${qs}`
      : endSessionEndpoint;

    return { endSessionUrl };
  };

  const verifySessionCookie = async (cookieValue: string): Promise<string | undefined> => {
    const key = await hmacKeyPromise;
    return verifySignedSessionId(cookieValue, key);
  };

  return { login, callback, refresh, logout, verifySessionCookie };
};
