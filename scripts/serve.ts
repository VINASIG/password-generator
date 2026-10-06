import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.env["BUILD_DIR"] ?? "dist");
const record = JSON.parse(
  readFileSync(resolve(root, "build-record.json"), "utf8"),
) as { csp: string };
if (
  typeof record.csp !== "string" ||
  !record.csp.startsWith("default-src 'none'")
)
  throw new Error("BUILD_FIRST");
const routes: Record<string, string> = {
  "/": "index.html",
  "/en/": "en/index.html",
  "/offline/vi.html": "offline/vi.html",
  "/offline/en.html": "offline/en.html",
  "/build-record.json": "build-record.json",
  "/robots.txt": "robots.txt",
};
const distribution = JSON.parse(
  readFileSync(resolve(root, "build-record.json"), "utf8"),
) as { artifacts: Record<string, unknown> };
for (const path of Object.keys(distribution.artifacts))
  if (
    (path.startsWith("licenses/") && /^[\w.-]+$/.test(path.slice(9))) ||
    path === "sitemap.xml"
  )
    routes[`/${path}`] = path;
const server = createServer((request, response) => {
  const headers = {
    "Content-Security-Policy": `${record.csp}; frame-ancestors 'none'`,
    "Strict-Transport-Security": "max-age=31536000",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), clipboard-read=()",
    "Cache-Control": "no-store",
  };
  let pathname: string;
  try {
    pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  } catch {
    response.writeHead(400, headers).end("Bad request");
    return;
  }
  const path = routes[pathname];
  if (!path || !["GET", "HEAD"].includes(request.method ?? "")) {
    response.writeHead(404, headers).end("Not found");
    return;
  }
  const content = readFileSync(resolve(root, path));
  const type = path.startsWith("licenses/")
    ? "text/plain; charset=utf-8"
    : path.endsWith(".xml")
      ? "application/xml; charset=utf-8"
      : path.endsWith(".html")
        ? "text/html; charset=utf-8"
        : path.endsWith(".json")
          ? "application/json"
          : "text/plain; charset=utf-8";
  response.writeHead(200, {
    ...headers,
    "Content-Type": type,
    "Content-Length": content.length,
  });
  response.end(request.method === "HEAD" ? undefined : content);
});
const port = Number(process.env["PORT"] ?? "4179");
if (!Number.isInteger(port) || port < 0 || port > 65535)
  throw new Error("INVALID_PORT");
server.listen(port, "127.0.0.1", () => {
  const address = server.address();
  if (address && typeof address !== "string")
    console.log(`Preview http://127.0.0.1:${address.port}`);
});
process.on("SIGINT", () => {
  server.close();
});
process.on("SIGTERM", () => {
  server.close();
});
