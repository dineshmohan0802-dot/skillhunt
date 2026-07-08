import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";
import fs from "fs";
import path from "path";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// ── API routes ──────────────────────────────────────────────
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

// ── Static files (CSS/JS assets) ────────────────────────────
app.use("*", serveStatic({ root: "./dist/public" }));

// ── SPA fallback — serve index.html for ALL other routes ────
// This is what makes /leaderboard, /dashboard, /projects work
app.get("*", (c) => {
  try {
    const indexPath = path.join(process.cwd(), "dist", "public", "index.html");
    const html = fs.readFileSync(indexPath, "utf-8");
    return c.html(html, 200);
  } catch (err) {
    console.error("Could not read index.html:", err);
    return c.text("App not found. Build may be incomplete.", 500);
  }
});

export default app;

// ── Vercel Serverless handler ────────────────────────────────
import { handle } from "hono/vercel";
const handler = handle(app);
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

// ── Start Node server on Render / local ─────────────────────
if (!process.env.VERCEL) {
  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
