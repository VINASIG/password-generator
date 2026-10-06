import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { build as esbuild } from "esbuild";
import { HtmlValidate } from "html-validate";
import { page } from "./page.ts";

export const sha256 = (bytes: string | Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");
type SourceLock = {
  schema?: number;
  hashes?: Record<string, string>;
  vietnameseCommit?: string;
  designCommit?: string;
  brandCommit?: string;
};
const lock = JSON.parse(
  readFileSync("data/source-lock.json", "utf8"),
) as SourceLock;
if (lock.schema !== 1 || !lock.hashes || Object.keys(lock.hashes).length < 15)
  throw new Error("INVALID_SOURCE_LOCK");
for (const commit of [
  lock.vietnameseCommit,
  lock.designCommit,
  lock.brandCommit,
])
  if (typeof commit !== "string" || !/^[a-f0-9]{40}$/.test(commit))
    throw new Error("INVALID_SOURCE_COMMIT");
for (const [path, expected] of Object.entries(lock.hashes)) {
  if (
    !/^[a-f0-9]{64}$/.test(expected) ||
    sha256(readFileSync(path)) !== expected
  )
    throw new Error(`SOURCE_INTEGRITY_FAILURE ${path}`);
}
const original = readFileSync("data/upstream/eff_large_wordlist.txt", "utf8");
const rows = original.trimEnd().split(/\r?\n/);
const keys = new Set<string>();
const words = rows.map((row) => {
  const match = /^([1-6]{5})\s+([a-z]+(?:-[a-z]+)*)$/.exec(row);
  if (!match?.[1] || !match[2] || keys.has(match[1]))
    throw new Error("INVALID_EFF_ROW");
  keys.add(match[1]);
  return match[2];
});
if (words.length !== 7776 || keys.size !== 7776 || new Set(words).size !== 7776)
  throw new Error("INVALID_EFF_COVERAGE");
const eff = `${words.join("\n")}\n`;
writeFileSync("data/lists/eff-long.txt", eff);
const sources = [
  { id: "eff", text: eff, sha256: sha256(eff), count: 7776 },
  {
    id: "experimental-agent-vi",
    text: readFileSync("data/lists/experimental-agent-vi.txt", "utf8"),
    sha256: lock.hashes["data/lists/experimental-agent-vi.txt"],
    count: 2966,
  },
  {
    id: "experimental-agent-ascii",
    text: readFileSync("data/lists/experimental-agent-ascii.txt", "utf8"),
    sha256: lock.hashes["data/lists/experimental-agent-ascii.txt"],
    count: 2389,
  },
];
mkdirSync("src/generated", { recursive: true });
writeFileSync(
  "src/generated/wordlists.ts",
  `import type { ListSource } from '../phrase.ts';\nexport const SOURCES = ${JSON.stringify(sources)} as const satisfies readonly ListSource[];\n`,
);
const bundle = await esbuild({
  entryPoints: ["src/app.ts"],
  bundle: true,
  write: false,
  format: "iife",
  target: "es2023",
  charset: "utf8",
  minify: false,
  legalComments: "inline",
});
const js = bundle.outputFiles[0]?.text.trimEnd();
if (!js || /<\/script/i.test(js))
  throw new Error("UNSAFE_SCRIPT_SERIALIZATION");
const css = `@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:300 700;font-display:swap;src:url(data:font/woff2;base64,${readFileSync("assets/fonts/SpaceGrotesk-VariableFont_wght.woff2").toString("base64")}) format('woff2');}\n${["tokens", "preferences", "site-chrome", "control-surfaces", "app"].map((name) => readFileSync(`src/styles/${name}.css`, "utf8").replace(/\r\n/g, "\n")).join("\n")}`;
const csp = `default-src 'none'; script-src 'sha256-${createHash("sha256").update(js).digest("base64")}'; style-src 'sha256-${createHash("sha256").update(css).digest("base64")}'; img-src data:; font-src data:; connect-src 'none'; worker-src 'none'; child-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
const dataImage = (path: string): string =>
  `data:image/svg+xml;base64,${readFileSync(path).toString("base64")}`;
const destination = resolve(process.env["BUILD_DIR"] ?? "dist");
mkdirSync(destination, { recursive: true });
const sourceCommit = process.env["SOURCE_COMMIT"];
if (sourceCommit && !/^[a-f0-9]{40}$/.test(sourceCommit))
  throw new Error("INVALID_SOURCE_COMMIT");
const publicOrigin = process.env["PUBLIC_ORIGIN"];
if (publicOrigin) {
  const url = new URL(publicOrigin);
  if (
    url.protocol !== "https:" ||
    url.origin !== publicOrigin ||
    url.username ||
    url.password ||
    url.port ||
    !/^[a-z0-9.-]+$/i.test(url.hostname)
  )
    throw new Error("INVALID_PUBLIC_ORIGIN");
}
const legalText = [
  "NOTICE.md",
  "LICENSE",
  "licenses/LGPL-3.0-or-later.txt",
  "licenses/GPL-3.0-or-later.txt",
  "assets/fonts/OFL.txt",
  "licenses/Lucide.txt",
  "licenses/vietphrase-NOTICE.md",
]
  .map((path) => `${path}\n\n${readFileSync(path, "utf8")}`)
  .join("\n\n");
const validator = new HtmlValidate({
  extends: ["html-validate:recommended"],
  rules: {
    "prefer-native-element": "off",
    "doctype-style": "off",
    "no-inline-style": "error",
    "wcag/h32": "error",
    "input-attributes": "error",
  },
});
const artifacts: Record<string, { sha256: string; bytes: number }> = {};
for (const locale of ["vi", "en"] as const) {
  for (const offline of [false, true]) {
    const html = page({
      locale,
      offline,
      legalText,
      ...(publicOrigin ? { publicOrigin } : {}),
      css,
      js,
      csp,
      lightLogo: dataImage("assets/brand/primary-color.svg"),
      darkLogo: dataImage("assets/brand/reversed.svg"),
      favicon: dataImage("assets/brand/mark.svg"),
      ...(sourceCommit ? { sourceCommit } : {}),
    });
    const validation = await validator.validateString(html);
    if (!validation.valid)
      throw new Error(
        JSON.stringify(validation.results.map((result) => result.messages)),
      );
    const path = offline
      ? `offline/${locale}.html`
      : locale === "vi"
        ? "index.html"
        : "en/index.html";
    mkdirSync(resolve(destination, path, ".."), { recursive: true });
    writeFileSync(resolve(destination, path), html);
    artifacts[path] = { sha256: sha256(html), bytes: Buffer.byteLength(html) };
  }
}
function artifact(path: string, bytes: string | Buffer): void {
  mkdirSync(resolve(destination, path, ".."), { recursive: true });
  writeFileSync(resolve(destination, path), bytes);
  artifacts[path] = { sha256: sha256(bytes), bytes: Buffer.byteLength(bytes) };
}
artifact(
  "_headers",
  `/*\n  Content-Security-Policy: ${csp}; frame-ancestors 'none'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Resource-Policy: same-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), clipboard-read=()\n  Cache-Control: no-cache\n`,
);
artifact(
  "robots.txt",
  `User-agent: *\nAllow: /\nDisallow: /offline/\n${publicOrigin ? `Sitemap: ${publicOrigin}/sitemap.xml\n` : ""}`,
);
if (publicOrigin)
  artifact(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${publicOrigin}/</loc></url><url><loc>${publicOrigin}/en/</loc></url></urlset>\n`,
  );
const legalFiles = new Map<string, string>();
for (const directory of ["public/licenses", "licenses"])
  for (const file of readdirSync(directory).sort())
    if (!legalFiles.has(file)) legalFiles.set(file, `${directory}/${file}`);
legalFiles.set("SpaceGrotesk-OFL.txt", "assets/fonts/OFL.txt");
for (const [file, path] of legalFiles)
  artifact(`licenses/${file}`, readFileSync(path));
const record = {
  schema: 1,
  version: JSON.parse(readFileSync("package.json", "utf8")) as unknown,
  csp,
  sourceCommit: sourceCommit ?? null,
  publicOrigin: publicOrigin ?? null,
  sourcePins: {
    vietnamese: lock.vietnameseCommit,
    design: lock.designCommit,
    brand: lock.brandCommit,
  },
  wordlists: sources.map(({ id, sha256, count }) => ({ id, sha256, count })),
  artifacts,
};
const { version: packageInfo, ...rest } = record;
writeFileSync(
  resolve(destination, "build-record.json"),
  `${JSON.stringify({ ...rest, version: (packageInfo as { version: string }).version }, null, 2)}\n`,
);
console.log(
  `PASS build and HTML validation, 4 self-contained artifacts, ${artifacts["index.html"]?.bytes ?? 0} bytes per Vietnamese online document`,
);
