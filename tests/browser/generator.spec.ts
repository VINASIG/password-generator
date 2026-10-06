import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  inspectInterface,
  inspectHeaderBrand,
  inspectControlSurfaces,
  inspectControlIndicators,
} from "../../.vinasig/standards/templates/web/interface.mjs";
import { inspectSiteChrome } from "../../.vinasig/standards/templates/web/site-chrome.mjs";
import type { Page } from "@playwright/test";

async function ready(page: Page, path = "/en/"): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await expect(page.locator("#generate")).toBeEnabled();
}
async function zeroRandom(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(crypto, "getRandomValues", {
      configurable: true,
      value: (view: Uint8Array | Uint32Array) => {
        view.fill(0);
        return view;
      },
    });
  });
}
async function phrase(page: Page, id = "eff"): Promise<void> {
  await page.locator('input[name="mode"][value="phrase"]').check();
  await page.locator(`input[name="wordlist"][value="${id}"]`).check();
}
async function reveal(page: Page): Promise<string> {
  await page.locator("#generate").click();
  if ((await page.locator("#reveal").getAttribute("aria-pressed")) === "false")
    await page.locator("#reveal").click();
  return page.locator("#secret").inputValue();
}
test("initial generation, persistent visibility, masked DOM, readonly result and invalid settings", async ({
  page,
}) => {
  await ready(page);
  await zeroRandom(page);
  await expect(page.locator("#secret")).toBeVisible();
  await expect(page.locator("#secret")).not.toBeEmpty();
  await page.locator("#reveal").click();
  await page.locator("#generate").click();
  await expect(page.locator("#secret")).toHaveValue("••••••••••••••••••••");
  expect(await page.locator("body").innerHTML()).not.toContain("a".repeat(20));
  await expect(page.locator("#bit-count")).toHaveText("131");
  await expect(page.locator("#character-count")).toHaveText("20");
  await expect(page.locator("#byte-count")).toHaveText("20");
  await page.locator("#reveal").click();
  await expect(page.locator("#secret")).toHaveValue("a".repeat(20));
  expect(
    await page
      .locator("#secret")
      .evaluate((node: HTMLTextAreaElement) => node.readOnly),
  ).toBe(true);
  await page.locator("#reveal").click();
  await expect(page.locator("#secret")).toHaveValue("••••••••••••••••••••");
  await page.locator("#length").fill("");
  await expect(page.locator("#secret")).toBeHidden();
  await page.locator("#generate").click();
  await expect(page.locator("#status")).toHaveAttribute("data-state", "error");
  await expect(page.locator("#copy")).toBeDisabled();
  await expect(page.locator("#secret")).toHaveValue("");
  await page.locator("#length").fill("20");
  await page.locator("#compatibility summary").click();
  await page.locator("#exclude").fill(" ");
  await page.locator("#generate").click();
  await expect(page.locator("#status")).toHaveAttribute("data-state", "error");
});
test("all phrases preserve pinned tokens, repetition, hyphen default and byte counts", async ({
  page,
}) => {
  await ready(page);
  await zeroRandom(page);
  for (const [id, file, bits] of [
    ["eff", "eff-long.txt", 90],
    ["experimental-agent-vi", "experimental-agent-vi.txt", 80],
    ["experimental-agent-ascii", "experimental-agent-ascii.txt", 78],
  ] as const) {
    await phrase(page, id);
    const first = readFileSync(`data/lists/${file}`, "utf8").split("\n")[0];
    expect(first).toBeTruthy();
    const value = await reveal(page);
    expect(value).toBe(
      Array<string>(7)
        .fill(first ?? "")
        .join("-"),
    );
    await expect(page.locator("#bit-count")).toHaveText(String(bits));
    await expect(page.locator("#character-count")).toHaveText(
      String(Array.from(value).length),
    );
    await expect(page.locator("#byte-count")).toHaveText(
      String(Buffer.byteLength(value)),
    );
    await expect(page.locator("#experimental-note")).toHaveCount(0);
    await page.locator('input[name="separator"][value="."]').check();
    expect(await reveal(page)).toBe(
      Array<string>(7)
        .fill(first ?? "")
        .join("."),
    );
    await page.locator('input[name="separator"][value="-"]').check();
  }
  await page.locator('[data-bits="128"]').click();
  await expect(page.locator("#words")).toHaveValue("12");
  await expect(page.locator("#secret")).toBeVisible();
  await expect(page.locator("#bit-count")).toHaveText("134");
});
test("failed CSPRNG clears an earlier result and has no weak fallback", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#generate").click();
  await page.evaluate(() => {
    Object.defineProperty(crypto, "getRandomValues", {
      configurable: true,
      value: () => {
        throw new Error("synthetic failure");
      },
    });
  });
  await page.locator("#generate").click();
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#secret")).toBeHidden();
  await expect(page.locator("#status")).toContainText("Safe generation failed");
  await expect(page.locator("#copy")).toBeDisabled();
  await phrase(page);
  await page.locator("#generate").click();
  await expect(page.locator("#status")).toContainText("Safe generation failed");
});
test("no network, secret storage, history, service worker or weak randomness is used by generation", async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    requests.push(request.url());
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  await page.addInitScript(() => {
    const events: string[] = [];
    Object.defineProperty(globalThis, "__blocked", { value: events });
    const deny = (name: string) => () => {
      events.push(name);
      throw new Error(`forbidden ${name}`);
    };
    for (const name of [
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
      "Worker",
    ])
      Object.defineProperty(globalThis, name, {
        configurable: true,
        value: deny(name),
      });
    const setItem = Storage.prototype.setItem.bind(localStorage);
    Storage.prototype.setItem = function (key: string, value: string): void {
      if (key !== "vinasig-theme" || !["light", "dark"].includes(value)) {
        deny("secret storage")();
        return;
      }
      setItem(key, value);
    };
    Math.random = deny("Math.random");
    history.pushState = deny("pushState");
    history.replaceState = deny("replaceState");
    navigator.sendBeacon = deny("beacon");
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register = deny("serviceWorker");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  await ready(page);
  for (const id of [
    "password",
    "eff",
    "experimental-agent-vi",
    "experimental-agent-ascii",
  ]) {
    if (id !== "password") await phrase(page, id);
    await page.locator("#generate").click();
    await page.locator("#reveal").click();
    await page.locator("#copy").click();
    await page.locator("#clear").click();
  }
  await page.locator("#theme").click();
  expect(requests).toEqual(["http://127.0.0.1:4179/en/"]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => (globalThis as { __blocked?: string[] }).__blocked,
    ),
  ).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  const snapshot = await context.storageState();
  expect(snapshot.origins).toEqual([
    {
      origin: "http://127.0.0.1:4179",
      localStorage: [{ name: "vinasig-theme", value: "dark" }],
    },
  ]);
  expect(page.url()).toBe("http://127.0.0.1:4179/en/");
});
test("clipboard is explicit, denied writes explain manual copy, and late completion cannot resurrect cleared state", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await ready(page);
  await zeroRandom(page);
  await page.locator("#generate").click();
  await page.locator("#copy").click();
  await expect(page.locator("#status")).toContainText("denied");
  await expect(page.locator("#copy")).toBeEnabled();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolveWrite) => {
            Object.defineProperty(globalThis, "__completeWrite", {
              configurable: true,
              value: resolveWrite,
            });
          }),
      },
    });
  });
  await page.locator("#copy").click();
  await page.locator("#clear").click();
  await page.evaluate(() => {
    (globalThis as { __completeWrite?: () => void }).__completeWrite?.();
  });
  await expect(page.locator("#status")).toContainText("Result cleared");
  await expect(page.locator("#copy")).toBeDisabled();
  await expect(page.locator("#secret")).toHaveValue("");
});
test("five minute expiry, page lifecycle and leaving the tab wipe DOM and invalidate clipboard state", async ({
  page,
}) => {
  await page.clock.install();
  await ready(page);
  await zeroRandom(page);
  await reveal(page);
  await page.clock.fastForward(300001);
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#copy")).toBeDisabled();
  await reveal(page);
  await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent("pagehide"));
  });
  await expect(page.locator("#secret")).toHaveValue("");
  await reveal(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#secret")).toHaveValue("");
});
for (const capability of [
  "random",
  "digest",
  "integrity",
  "insecure",
  "embedded",
] as const) {
  test(`generation fails closed on ${capability}`, async ({ page }) => {
    await page.addInitScript((which) => {
      if (which === "random")
        Object.defineProperty(crypto, "getRandomValues", {
          configurable: true,
          value: undefined,
        });
      if (which === "digest")
        Object.defineProperty(crypto, "subtle", {
          configurable: true,
          value: undefined,
        });
      if (which === "integrity")
        Object.defineProperty(crypto.subtle, "digest", {
          configurable: true,
          value: () => Promise.resolve(new ArrayBuffer(32)),
        });
      if (which === "insecure")
        Object.defineProperty(globalThis, "isSecureContext", {
          configurable: true,
          value: false,
        });
      if (which === "embedded")
        Object.defineProperty(globalThis, "self", {
          configurable: true,
          value: {},
        });
    }, capability);
    await page.goto("/en/");
    await expect(page.locator("#status")).toHaveAttribute(
      "data-state",
      "error",
    );
    await expect(page.locator("#generate")).toBeDisabled();
    await expect(page.locator("#settings")).toHaveJSProperty("disabled", true);
    await expect(page.locator("#secret")).toHaveValue("");
    await page.locator("#generate").evaluate((button) => {
      button.dispatchEvent(new Event("click"));
    });
    await expect(page.locator("#secret")).toHaveValue("");
    await expect(page.locator("#status")).toHaveAttribute(
      "data-state",
      "error",
    );
  });
}
test("CSP denies arbitrary scripts, fetch connections, forms and foreign framing", async ({
  page,
}) => {
  await ready(page);
  const result = await page.evaluate(async () => {
    const violations: string[] = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      violations.push(event.effectiveDirective);
    });
    const script = document.createElement("script");
    script.textContent = "globalThis.__injected = true";
    document.body.append(script);
    let connected = true;
    try {
      await fetch("/robots.txt");
    } catch {
      connected = false;
    }
    const form = document.createElement("form");
    form.action = "/robots.txt";
    form.target = "synthetic-form-target";
    const frame = document.createElement("iframe");
    frame.name = form.target;
    document.body.append(frame);
    document.body.append(form);
    try {
      form.submit();
    } catch {
      // Firefox may throw synchronously. The policy event is asserted independently below.
    }
    await new Promise<void>((resolveEvent) => {
      setTimeout(resolveEvent, 100);
    });
    return {
      injected: (globalThis as { __injected?: boolean }).__injected ?? false,
      connected,
      violations,
    };
  });
  expect(result.injected).toBe(false);
  expect(result.connected).toBe(false);
  expect(result.violations).toContain("form-action");
  expect(result.violations).toContain("connect-src");
  await expect(page).toHaveURL(/\/en\/$/);
  const response = await page.request.get("/en/");
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["strict-transport-security"]).toBe(
    "max-age=31536000",
  );
});
test("response policy blocks an actual foreign ancestor", async ({
  page,
}, info) => {
  const policyErrors: string[] = [];
  page.on("console", (message) => {
    if (/frame-ancestors|X-Frame-Options/i.test(message.text()))
      policyErrors.push(message.text());
  });
  const frameRequestFinished = new Promise<void>((resolveRequest) => {
    const inspect = (request: import("@playwright/test").Request): void => {
      if (
        request.url() === "http://127.0.0.1:4179/en/" &&
        request.resourceType() === "document"
      )
        resolveRequest();
    };
    page.on("requestfinished", inspect);
    page.on("requestfailed", inspect);
  });
  await page.route("http://127.0.0.2:4179/embed", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<iframe src="http://127.0.0.1:4179/en/"></iframe>',
    }),
  );
  await page.goto("http://127.0.0.2:4179/embed", {
    waitUntil: "domcontentloaded",
  });
  await frameRequestFinished;
  // A denied Gecko frame has no execution context. Its native policy report is the observable rejection.
  if (info.project.name === "firefox")
    await expect.poll(() => policyErrors.length).toBeGreaterThan(0);
  else
    await expect(page.frameLocator("iframe").locator("#generate")).toHaveCount(
      0,
    );
  expect(page.frames().length).toBe(2);
});
test("copy writes the exact generated secret only on an explicit action", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const writes: string[] = [];
    Object.defineProperty(globalThis, "__writes", { value: writes });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (value: string) => {
          writes.push(value);
          return Promise.resolve();
        },
      },
    });
  });
  await ready(page);
  await zeroRandom(page);
  await page.locator("#generate").click();
  expect(
    await page.evaluate(() => (globalThis as { __writes?: string[] }).__writes),
  ).toEqual([]);
  await page.locator("#copy").click();
  expect(
    await page.evaluate(() => (globalThis as { __writes?: string[] }).__writes),
  ).toEqual(["a".repeat(20)]);
});
test("no JavaScript leaves all secret generation locked with a readable explanation", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4179/en/");
  await expect(page.locator("#generate")).toBeDisabled();
  await expect(page.locator("noscript p")).toBeVisible();
  await expect(page.locator("noscript p")).toHaveText(
    /JavaScript and Web Crypto/,
  );
  await expect(page.locator("#secret")).toBeHidden();
  await context.close();
});
test("offline standalone file uses the same verified lists and generation without network", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("file:")) requests.push(request.url());
  });
  await ready(page, pathToFileURL(resolve("dist/offline/en.html")).href);
  await zeroRandom(page);
  await phrase(page, "experimental-agent-vi");
  await reveal(page);
  await expect(page.locator("#bit-count")).toHaveText("80");
  expect(requests).toEqual([]);
  await expect(page.locator("a[download]")).toHaveCount(0);
  await page.locator("#licenses summary").click();
  const legal = page.locator(".legal-text");
  await expect(legal).toContainText("GNU AFFERO GENERAL PUBLIC LICENSE");
  await expect(legal).toContainText("SIL OPEN FONT LICENSE");
  await expect(legal).toContainText("Permission to use, copy, modify");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await legal.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  expect(await page.evaluate(inspectControlSurfaces)).toEqual([]);
});

test("both locales and themes fit declared viewports, preserve shared chrome and original brand bytes", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  for (const locale of ["vi", "en"] as const) {
    for (const theme of ["light", "dark"] as const) {
      for (const width of [
        320, 360, 390, 419, 420, 421, 759, 760, 761, 768, 1024, 1440,
      ]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({
          colorScheme: theme,
          reducedMotion: "reduce",
        });
        await ready(page, locale === "vi" ? "/" : "/en/");
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect(await page.evaluate(inspectSiteChrome)).toEqual([]);
        const brandFindings = await page.evaluate(inspectHeaderBrand);
        // The unchanged checker recognizes filename-based assets only. Inline data URLs use the byte check below.
        expect(brandFindings.map((finding) => finding.kind)).toEqual([
          "header-logo-variant",
        ]);
        const src = await page
          .locator("[data-brand-logo] img")
          .evaluate((image: HTMLImageElement) => image.currentSrc);
        const actual = createHash("sha256")
          .update(Buffer.from(src.split(",")[1] ?? "", "base64"))
          .digest("hex");
        const expected = createHash("sha256")
          .update(
            readFileSync(
              `assets/brand/${theme === "dark" ? "reversed" : "primary-color"}.svg`,
            ),
          )
          .digest("hex");
        expect(actual).toBe(expected);
        expect(await page.evaluate(inspectInterface)).toEqual([]);
        expect(await page.evaluate(inspectControlSurfaces)).toEqual([]);
        expect(await page.evaluate(inspectControlIndicators)).toEqual([]);
        await expect(page.locator('input[type="radio"]')).toHaveCount(8);
        await expect(page.locator("progress")).toHaveCount(1);
        await expect(page.locator('input[type="checkbox"]')).toHaveCount(6);
        await expect(page.locator('input[type="range"]')).toHaveCount(2);
        await expect(page.locator("details")).toHaveCount(7);
        await page.locator("details").first().locator("summary").click();
        expect(await page.evaluate(inspectControlSurfaces)).toEqual([]);
        if (
          info.project.name === "chromium" &&
          [320, 390, 1440].includes(width)
        ) {
          mkdirSync("output/screenshots", { recursive: true });
          await zeroRandom(page);
          await page.locator("#generate").click();
          await page.locator("details").first().locator("summary").click();
          await page.evaluate(() => {
            window.scrollTo(0, 0);
          });
          await page.screenshot({
            path: `output/screenshots/${locale}-${theme}-${width}-initial.png`,
            fullPage: true,
          });
          await page.screenshot({
            path: `output/screenshots/${locale}-${theme}-${width}-top.png`,
          });
          await page.locator("[data-site-footer]").scrollIntoViewIfNeeded();
          await page.screenshot({
            path: `output/screenshots/${locale}-${theme}-${width}-footer.png`,
          });
        }
      }
    }
  }
});
test("long results, 200 percent text, forced colors and keyboard controls remain usable", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await ready(page);
  await zeroRandom(page);
  await phrase(page, "experimental-agent-vi");
  await page.locator("#words").fill("20");
  await reveal(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.locator("#words-range").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#words")).toHaveValue("19");
  await expect(page.locator("#secret")).toBeVisible();
  await page.locator("#theme").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page
    .locator('input[name="wordlist"][value="experimental-agent-ascii"]')
    .check();
  await page.locator("#words").fill("7");
  await reveal(page);
  await expect(page.locator("#warning")).not.toBeEmpty();
  const darkAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(darkAxe.violations).toEqual([]);
  await page
    .locator('input[name="wordlist"][value="experimental-agent-vi"]')
    .check();
  await page.locator("#words").fill("19");
  await reveal(page);
  await page.emulateMedia({ forcedColors: "active" });
  expect(await page.evaluate(inspectControlSurfaces)).toEqual([]);
  if (info.project.name === "chromium") {
    expect(
      await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
    ).toBe("rgb(255, 255, 255)");
    const expectedLogo = `data:image/svg+xml;base64,${readFileSync("assets/brand/primary-color.svg").toString("base64")}`;
    await expect
      .poll(() =>
        page
          .locator("[data-brand-logo] img")
          .evaluate((image: HTMLImageElement) => image.currentSrc),
      )
      .toBe(expectedLogo);
  }
  if (info.project.name === "chromium")
    await page.screenshot({
      path: "output/screenshots/en-forced-colors-360.png",
      fullPage: true,
    });
  await page.emulateMedia({ forcedColors: "none" });
  await reveal(page);
  if (info.project.name === "chromium")
    await page.screenshot({
      path: "output/screenshots/en-dark-360-long-result.png",
      fullPage: true,
    });
});
test("logo link opens VINASIG and language switch clears rather than carrying a secret", async ({
  page,
}) => {
  await ready(page);
  await zeroRandom(page);
  await reveal(page);
  await page.locator(".language-switch").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.locator("#secret")).toBeVisible();
  await expect(page.locator("#secret")).not.toHaveValue("a".repeat(20));
  await page.route("https://vinasig.io.vn/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>VINASIG test destination</title>",
    }),
  );
  await page.locator("[data-brand-logo]").click();
  await expect(page).toHaveURL("https://vinasig.io.vn/");
});
