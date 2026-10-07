import { navigateApp } from "./navigation.ts";
import { test, expect } from "@playwright/test";

test("the first settings edit after an elapsed inactivity deadline generates a fresh valid result", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-07T00:00:00Z") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await page.clock.setSystemTime(new Date("2026-10-07T00:05:01Z"));
  await page.locator("#length").fill("22");
  await expect(page.locator("#secret")).toHaveValue(/^[\s\S]{22}$/);
  await expect(page.locator("#copy")).toBeEnabled();
  await expect(page.locator("#rotation")).toBeVisible();
});

test("returning to a visible page creates a fresh result while preserving the session visibility choice", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await page.locator("#reveal").click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#rotation")).toBeHidden();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#secret")).toHaveValue("••••••••••••••••••••");
  await expect(page.locator("#reveal")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent("pagehide"));
  });
  await expect(page.locator("#secret")).toHaveValue("");
  await page.evaluate(() => {
    dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await expect(page.locator("#secret")).toHaveValue("••••••••••••••••••••");
  await expect(page.locator("#copy")).toBeEnabled();
});

test("an animation random-source failure clears the completed secret and never restarts rotation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const draw = crypto.getRandomValues.bind(crypto);
    Object.defineProperty(crypto, "getRandomValues", {
      value: (view: Uint8Array<ArrayBuffer> | Uint32Array<ArrayBuffer>) => {
        if (view instanceof Uint8Array && view.byteLength === 20)
          throw new Error("synthetic animation provider failure");
        return draw(view);
      },
    });
  });
  await navigateApp(page, "/en/");
  await expect(page.locator("#generate")).toBeEnabled();
  await expect(page.locator("#status")).toContainText("Safe generation failed");
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#scramble")).toHaveText("");
  await expect(page.locator("#rotation")).toBeHidden();
  await expect(page.locator("#copy")).toBeDisabled();
});
