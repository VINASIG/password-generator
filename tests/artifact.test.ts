import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  cpSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

void test("standalone CSP hashes cover exactly the embedded code and style, with no runtime imports or external assets", () => {
  const html = readFileSync("dist/index.html", "utf8");
  const digest = (source: string): string =>
    createHash("sha256").update(source).digest("base64");
  const js = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];
  const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1];
  assert.ok(js && css);
  assert.ok(
    html.includes(`sha256-${digest(js)}`) &&
      html.includes(`sha256-${digest(css)}`),
  );
  assert.ok(html.includes("connect-src &#39;none&#39;"));
  assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+rel="stylesheet"/);
  assert.doesNotMatch(
    js,
    /Math\.random|sessionStorage|sendBeacon|XMLHttpRequest|WebSocket|EventSource|serviceWorker|fetch\(|console\.|innerHTML|eval\(|new Function/,
  );
  assert.equal((js.match(/localStorage\.setItem\(/g) ?? []).length, 1);
  assert.match(js, /localStorage\.setItem\("vinasig-theme", savedTheme\)/);
  assert.doesNotMatch(html, /name="secret"|<form\b/);
  assert.ok(
    readFileSync("dist/_headers", "utf8").includes("frame-ancestors 'none'"),
  );
  assert.match(
    readFileSync("dist/_headers", "utf8"),
    /^ {2}Strict-Transport-Security: max-age=31536000$/m,
  );
});
void test("canonical discovery is enabled only for a validated production origin, and offline remains noindex", () => {
  const destination = resolve("output/discovery-fixture");
  const build = spawnSync(process.execPath, [resolve("scripts/build.ts")], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      BUILD_DIR: destination,
      PUBLIC_ORIGIN: "https://generator.invalid",
    },
  });
  assert.equal(build.status, 0, build.stderr);
  const english = readFileSync(join(destination, "en/index.html"), "utf8");
  assert.ok(
    english.includes('rel="canonical" href="https://generator.invalid/en/"'),
  );
  assert.ok(
    english.includes('hreflang="vi" href="https://generator.invalid/"'),
  );
  assert.ok(
    english.includes('hreflang="en" href="https://generator.invalid/en/"'),
  );
  assert.equal(
    (
      readFileSync(join(destination, "sitemap.xml"), "utf8").match(/<loc>/g) ??
      []
    ).length,
    2,
  );
  assert.ok(
    readFileSync(join(destination, "robots.txt"), "utf8").includes(
      "Sitemap: https://generator.invalid/sitemap.xml",
    ),
  );
  const offline = readFileSync(join(destination, "offline/en.html"), "utf8");
  assert.ok(offline.includes('name="robots" content="noindex"'));
  assert.ok(!offline.includes('rel="canonical"'));
  const refused = spawnSync(process.execPath, [resolve("scripts/build.ts")], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      BUILD_DIR: destination,
      PUBLIC_ORIGIN: "http://generator.invalid",
    },
  });
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /INVALID_PUBLIC_ORIGIN/);
});
void test("source and generated artifacts rebuild byte-identically in separate working directories, and corrupted pins fail", () => {
  const root = resolve("output/rebuild");
  mkdirSync(root, { recursive: true });
  const temporary = mkdtempSync(join(root, "case-"));
  const builds: string[] = [];
  for (const directory of ["a", "b"]) {
    const workspace = join(temporary, directory);
    mkdirSync(workspace);
    for (const path of [
      "src",
      "data",
      "assets",
      "licenses",
      "public",
      "NOTICE.md",
      "LICENSE",
      "package.json",
    ])
      cpSync(resolve(path), join(workspace, path), { recursive: true });
    const build = spawnSync(process.execPath, [resolve("scripts/build.ts")], {
      cwd: workspace,
      encoding: "utf8",
      env: { ...process.env, BUILD_DIR: "dist" },
    });
    assert.equal(build.status, 0, build.stderr);
    builds.push(join(workspace, "dist"));
  }
  function files(directory: string, prefix = ""): string[] {
    return readdirSync(directory, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory()
          ? files(join(directory, entry.name), `${prefix}${entry.name}/`)
          : [`${prefix}${entry.name}`],
      )
      .sort();
  }
  const first = builds[0];
  const second = builds[1];
  assert.ok(first && second);
  assert.deepEqual(files(first), files(second));
  for (const path of files(first))
    assert.deepEqual(
      readFileSync(join(first, path)),
      readFileSync(join(second, path)),
      path,
    );
  writeFileSync(
    join(temporary, "b", "src/vendor/vietphrase/index.ts"),
    "corrupted fixture",
  );
  const failed = spawnSync(process.execPath, [resolve("scripts/build.ts")], {
    cwd: join(temporary, "b"),
    encoding: "utf8",
    env: { ...process.env, BUILD_DIR: "dist" },
  });
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /SOURCE_INTEGRITY_FAILURE/);
});
