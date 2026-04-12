// Admin Hub page — requires auth + admin role.
// The admin-hub client app hydrates into #admin-hub-app.

import type { FC } from "@hono/hono/jsx";

export const AdminView: FC = () => (
  <div id="admin-hub-app" style="min-height:100vh;background:#F5F2EB;">
    <div
      style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:'Inter',sans-serif;color:rgba(38,29,17,0.5);"
    >
      Carregando painel administrativo...
    </div>
  </div>
);
