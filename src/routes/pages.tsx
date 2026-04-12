import { Hono } from "@hono/hono";
import type { AppEnv } from "../types.ts";
import { AppLayout } from "../views/layouts/app_layout.tsx";
import { SocialCareView } from "../views/pages/social-care-view.tsx";
import { RegistrationView } from "../views/pages/registration-view.tsx";
import { FamilyView } from "../views/pages/family-view.tsx";
import { LoginView } from "../views/pages/login-view.tsx";
import { LandingView } from "../views/pages/landing-view.tsx";
import { HubView } from "../views/pages/hub-view.tsx";
import { AdminView } from "../views/pages/admin-view.tsx";

export const pageRoutes = new Hono<AppEnv>();

// Landing — public. If already logged in, redirect to hub.
pageRoutes.get("/", (c) => {
  const session = c.get("session");
  if (session) return c.redirect("/hub");
  const nonce = c.get("secureHeadersNonce");
  return c.html(
    <AppLayout title="ACDG" nonce={nonce} scripts={["/static/js/auth-hub.js"]}>
      <LandingView />
    </AppLayout>
  );
});

// Hub — requires auth, app selector
pageRoutes.get("/hub", (c) => {
  const nonce = c.get("secureHeadersNonce");
  return c.html(
    <AppLayout title="Hub" nonce={nonce} scripts={["/static/js/auth-hub.js"]}>
      <HubView />
    </AppLayout>
  );
});

// Login page (SSR-only, no client JS, public route)
pageRoutes.get("/login", (c) => {
  const nonce = c.get("secureHeadersNonce");
  return c.html(
    <AppLayout title="Login" nonce={nonce}>
      <LoginView />
    </AppLayout>
  );
});

// Home — Social Care families list
pageRoutes.get("/social-care", (c) => {
  const nonce = c.get("secureHeadersNonce");
  return c.html(
    <AppLayout title="Familias" nonce={nonce} scripts={["/static/js/social-care.js"]}>
      <SocialCareView />
    </AppLayout>
  );
});

// Patient Registration — 7-step wizard
pageRoutes.get("/patient-registration", (c) => {
  const nonce = c.get("secureHeadersNonce");
  return c.html(
    <AppLayout title="Cadastro" nonce={nonce} scripts={["/static/js/registration.js"]}>
      <RegistrationView />
    </AppLayout>
  );
});

// Family Composition
pageRoutes.get("/family-composition/:patientId", (c) => {
  const patientId = c.req.param("patientId");
  const nonce = c.get("secureHeadersNonce");
  return c.html(
    <AppLayout title="Composicao Familiar" nonce={nonce} scripts={["/static/js/family-composition.js"]}>
      <FamilyView patientId={patientId} />
    </AppLayout>
  );
});

// Admin Hub — requires admin role (enforced by adminGuard in server.ts)
pageRoutes.get("/admin", (c) => {
  const nonce = c.get("secureHeadersNonce");
  return c.html(
    <AppLayout title="Admin Hub" nonce={nonce} scripts={["/static/js/admin-hub.js"]}>
      <AdminView />
    </AppLayout>
  );
});
