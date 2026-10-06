import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";
import type { Browser } from "@playwright/test";
import { cpus, totalmem, platform, release } from "node:os";
import { createHash } from "node:crypto";

mkdirSync("output/performance", { recursive: true });
const server = spawn(process.execPath, ["scripts/serve.ts"], {
  stdio: "ignore",
  env: { ...process.env, PORT: "4182" },
});
const url = "http://127.0.0.1:4182/en/";
const median = (values: readonly number[]): number => {
  const ordered = Array.from(values).sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)] ?? 0;
};
const summarize = (values: readonly number[]) => ({
  samples: values,
  median: median(values),
  min: Math.min(...values),
  max: Math.max(...values),
});
let browser: Browser | undefined;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      ready = (await fetch(url)).ok;
    } catch {
      /* Local preview may still be starting. */
    }
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error("PREVIEW_UNAVAILABLE");
  const robots = await fetch(new URL("/robots.txt", url));
  const robotsText = await robots.text();
  if (
    !robots.ok ||
    !robotsText.startsWith("User-agent: *\nAllow: /\nDisallow: /offline/\n")
  )
    throw new Error("INVALID_ROBOTS_RESPONSE");
  const runs: {
    mode: string;
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    fcp: number;
    lcp: number;
    tbt: number;
    cls: number;
  }[] = [];
  for (const mode of ["mobile", "desktop"])
    for (let index = 1; index <= 3; index++) {
      const output = resolve(
        `output/performance/${mode}-${String(index)}.json`,
      );
      const args = [
        "node_modules/lighthouse/cli/index.js",
        url,
        "--chrome-flags=--headless --no-sandbox",
        "--only-categories=performance,accessibility,best-practices,seo",
        "--output=json",
        `--output-path=${output}`,
        "--quiet",
        ...(mode === "desktop" ? ["--preset=desktop"] : []),
      ];
      const run = spawnSync(process.execPath, args, {
        encoding: "utf8",
        timeout: 60000,
        env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      });
      if (run.status !== 0) throw new Error(`LIGHTHOUSE_FAILED ${run.stderr}`);
      const report = JSON.parse(readFileSync(output, "utf8")) as {
        categories: Record<string, { score: number }>;
        audits: Record<string, { numericValue: number }>;
        runtimeError?: unknown;
      };
      if (report.runtimeError) throw new Error("LIGHTHOUSE_RUNTIME_ERROR");
      const score = (id: string): number => {
        const value = report.categories[id]?.score;
        if (typeof value !== "number") throw new Error("MISSING_SCORE");
        return value * 100;
      };
      const measurement = (id: string): number => {
        const value = report.audits[id]?.numericValue;
        if (typeof value !== "number") throw new Error("MISSING_METRIC");
        return value;
      };
      runs.push({
        mode,
        performance: score("performance"),
        accessibility: score("accessibility"),
        bestPractices: score("best-practices"),
        seo: score("seo"),
        fcp: measurement("first-contentful-paint"),
        lcp: measurement("largest-contentful-paint"),
        tbt: measurement("total-blocking-time"),
        cls: measurement("cumulative-layout-shift"),
      });
      console.log(`Measured ${mode} cold run ${String(index)}`);
    }
  browser = await chromium.launch();
  const startup: number[] = [];
  const repeat: number[] = [];
  const interaction: Record<string, number[]> = {};
  const context = await browser.newContext();
  const page = await context.newPage();
  for (let index = 0; index < 3; index++) {
    const fresh = await browser.newContext();
    const freshPage = await fresh.newPage();
    await freshPage.goto(url);
    await freshPage.locator("#generate").waitFor({ state: "visible" });
    await freshPage.waitForFunction(() => {
      const button = document.getElementById("generate");
      return button instanceof HTMLButtonElement && !button.disabled;
    });
    startup.push(await freshPage.evaluate(() => performance.now()));
    await freshPage.reload();
    await freshPage.waitForFunction(() => {
      const button = document.getElementById("generate");
      return button instanceof HTMLButtonElement && !button.disabled;
    });
    repeat.push(await freshPage.evaluate(() => performance.now()));
    await fresh.close();
  }
  await page.goto(url);
  await page.waitForFunction(() => {
    const button = document.getElementById("generate");
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  for (const mode of [
    "default-password",
    "128-required-password",
    "eff",
    "experimental-agent-vi",
    "experimental-agent-ascii",
  ]) {
    if (mode.endsWith("password")) {
      await page.locator('input[name="mode"][value="password"]').check();
      if (mode.startsWith("128")) {
        await page.locator("#compatibility summary").click();
        await page.locator("#length").fill("128");
        await page.locator("#require-each").check();
      }
    } else {
      await page.locator('input[name="mode"][value="phrase"]').check();
      await page.locator(`input[name="wordlist"][value="${mode}"]`).check();
      await page.locator("#words").fill("20");
    }
    interaction[mode] = await page.evaluate(() => {
      const button = document.getElementById("generate");
      if (!(button instanceof HTMLButtonElement))
        throw new Error("MISSING_BUTTON");
      return Array.from({ length: 31 }, () => {
        const start = performance.now();
        button.click();
        return performance.now() - start;
      }).slice(1);
    });
  }
  const browserVersion = browser.version();
  const summary = {
    schema: 1,
    evidenceClass:
      "local lab measurements, not field or human usability evidence",
    lighthouse: "13.5.0",
    browserVersion,
    testedHtmlSha256: createHash("sha256")
      .update(readFileSync("dist/en/index.html"))
      .digest("hex"),
    host: {
      platform: platform(),
      osRelease: release(),
      cpuModel: cpus()[0]?.model ?? null,
      logicalCpus: cpus().length,
      memoryBytes: totalmem(),
    },
    robotsHttp: {
      status: robots.status,
      sha256: createHash("sha256").update(robotsText).digest("hex"),
      content: robotsText,
    },
    coldRuns: runs,
    modes: ["mobile", "desktop"].map((mode) => ({
      mode,
      performance: summarize(
        runs.filter((run) => run.mode === mode).map((run) => run.performance),
      ),
      lcpMilliseconds: summarize(
        runs.filter((run) => run.mode === mode).map((run) => run.lcp),
      ),
      tbtMilliseconds: summarize(
        runs.filter((run) => run.mode === mode).map((run) => run.tbt),
      ),
    })),
    readyMilliseconds: summarize(startup),
    repeatReadyMilliseconds: summarize(repeat),
    synchronousGenerateMilliseconds: Object.fromEntries(
      Object.entries(interaction).map(([mode, values]) => [
        mode,
        summarize(values),
      ]),
    ),
  };
  writeFileSync(
    "output/performance/summary.json",
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log("PASS recorded raw cold, repeat and generation timings");
} finally {
  try {
    await browser?.close();
  } finally {
    server.kill();
  }
}
