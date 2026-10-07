import { test, expect, type Page } from "@playwright/test";
import { navigateApp } from "./navigation.ts";

async function visibility(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, "hidden", { configurable: true, value });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

test("background controls, reduced-motion changes and resize cannot expose or copy the retained secret", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  const initial = await page.locator("#secret").inputValue();
  await page.evaluate(() => {
    const writes: string[] = [];
    Object.defineProperty(globalThis, "__backgroundWrites", { value: writes });
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
  await visibility(page, true);
  for (const id of ["generate", "copy", "reveal", "pause"])
    await page.locator(`#${id}`).dispatchEvent("click");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.clock.runFor(1_300);
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#scramble")).toHaveText("");
  await expect(page.locator("#copy")).toBeDisabled();
  expect(
    await page.evaluate(
      () =>
        (globalThis as { __backgroundWrites?: string[] }).__backgroundWrites
          ?.length,
    ),
  ).toBe(0);
  await visibility(page, false);
  await expect(page.locator("#secret")).toHaveValue(initial);
  await expect(page.locator("#reveal")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#pause")).toHaveAttribute("aria-pressed", "false");
  await page.locator("#copy").click();
  await expect(page.locator("#status")).toContainText("Copied.");
  expect(
    await page.evaluate(
      () =>
        (globalThis as { __backgroundWrites?: string[] }).__backgroundWrites,
    ),
  ).toEqual([initial]);
});

test("return checks the inactivity deadline even if background timers never ran", async ({
  page,
}) => {
  const initialTime = new Date("2026-10-07T00:00:00Z");
  await page.clock.install({ time: initialTime });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await visibility(page, true);
  await page.clock.setSystemTime(new Date("2026-10-07T00:06:00Z"));
  await visibility(page, false);
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#copy")).toBeDisabled();
  await expect(page.locator("#rotation")).toBeHidden();
  await expect(page.locator("#status")).toContainText("5 minutes");
});

test("a settings change while hidden clears the old policy and defers generation until return", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await visibility(page, true);
  await page.locator("#length").evaluate((field: HTMLInputElement) => {
    field.value = "32";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#copy")).toBeDisabled();
  await visibility(page, false);
  await expect(page.locator("#secret")).toHaveValue(/^[!-~]{32}$/);
  await expect(page.locator("#length-range")).toHaveValue("32");
  await expect(page.locator("#character-count")).toHaveText("32");
});
