import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  // Serve everything inside dist/public as static files
  app.use("*", serveStatic({ root: "./dist/public" }));

  // Fallback for SPA routing: serve index.html for all other GET requests
  app.get("*", (c) => {
    const accept = c.req.header("accept") ?? "";
    if (accept.includes("text/html")) {
      try {
        const indexPath = path.join(process.cwd(), "dist/public/index.html");
        const content = fs.readFileSync(indexPath, "utf-8");
        return c.html(content);
      } catch (err) {
        console.error("Failed to serve index.html:", err);
      }
    }
    return c.json({ error: "Not Found" }, 404);
  });
}
