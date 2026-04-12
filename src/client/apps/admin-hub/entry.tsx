import { render } from "hono/jsx/dom";
import { AdminHubPage } from "../../views/pages/admin-hub-page.tsx";

const root = document.getElementById("admin-hub-app");
if (root) render(<AdminHubPage />, root);
