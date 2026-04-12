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
 * CSP Style Strategy (style-src-elem + style-src fallback):
 * - style-src: NONCE + unsafe-inline — fallback for older browsers that
 *   don't support style-src-elem. NONCE causes unsafe-inline to be ignored
 *   in CSP2+ browsers, so this only affects legacy browsers.
 * - style-src-elem: 'self' + 'unsafe-inline' (NO NONCE) — controls <style>
 *   elements and CSSStyleSheet.insertRule(). Without NONCE, 'unsafe-inline'
 *   is NOT ignored, allowing hono/css client-side runtime injection via
 *   insertRule(). SSR <Style nonce={...}> tags still work because the nonce
 *   is checked against style-src in browsers that don't support style-src-elem.
 * - style-src-attr: 'unsafe-inline' — allows inline style="..." attributes
 *   used by SSR loading placeholders.
 *
 * This follows MDN's recommended backwards-compatible pattern:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-elem
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
      styleSrc: [NONCE, "'unsafe-inline'"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://api.fontshare.com"],
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
