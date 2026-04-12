// Security headers middleware using Hono's built-in secureHeaders.
// Uses NONCE constant for automatic CSP nonce generation.
// Nonce available via c.get("secureHeadersNonce") in routes.

import { secureHeaders as honoSecureHeaders, NONCE } from "@hono/hono/secure-headers";
import type { SecureHeadersVariables } from "@hono/hono/secure-headers";

// Re-export the Variables type for AppEnv integration
export type { SecureHeadersVariables };

/**
 * Security headers middleware using Hono's built-in implementation.
 *
 * CSP Style Strategy:
 * - style-src: NONCE + unsafe-inline — fallback for older browsers.
 * - style-src-elem: NONCE + unsafe-inline + font domains — SSR <Style nonce={...}>
 *   tags pass via NONCE. Client-side hono/css uses insertRule() on the same
 *   <style> element that was already approved by nonce, so insertRule() is
 *   NOT blocked (CSP controls element creation, not sheet manipulation).
 *   'unsafe-inline' is ignored by CSP2+ when NONCE is present but kept as
 *   fallback for CSP1 browsers. Font stylesheet domains are explicitly listed.
 * - style-src-attr: 'unsafe-inline' — allows inline style="..." attributes
 *   used by SSR loading placeholders.
 */
export const securityHeaders = () =>
  honoSecureHeaders({
    strictTransportSecurity: "max-age=63072000; includeSubDomains",
    xFrameOptions: "DENY",
    referrerPolicy: "strict-origin-when-cross-origin",
    crossOriginEmbedderPolicy: false,

    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: [NONCE, "'strict-dynamic'"],
      scriptSrcElem: [NONCE, "'strict-dynamic'"],
      styleSrc: [NONCE, "'unsafe-inline'", "'self'", "https://fonts.googleapis.com", "https://api.fontshare.com"],
      styleSrcElem: [NONCE, "'unsafe-inline'", "'self'", "https://fonts.googleapis.com", "https://api.fontshare.com"],
      styleSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https:", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://auth.acdgbrasil.com.br"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", "https://auth.acdgbrasil.com.br"],
      objectSrc: ["'none'"],
    },

    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  });
