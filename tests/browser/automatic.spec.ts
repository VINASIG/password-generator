import { navigateApp } from "./navigation.ts";
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("counts synchronize, clamp the shared upper bound and reject incomplete input", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#generate")).toBeEnabled();
  await page.locator('input[name="mode"][value="phrase"]').check();
  await page.locator("#words").fill("22");
  await expect(page.locator("#words")).toHaveValue("20");
  await expect(page.locator("#words-range")).toHaveValue("20");
  await expect(page.locator("#secret")).toBeVisible();
  expect(
    (await page.locator("#secret").inputValue()).split("-").length,
  ).toBeGreaterThanOrEqual(20);
  await page.locator("#words").fill("");
  await expect(page.locator("#words")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#copy")).toBeDisabled();
  await expect(page.locator("#secret")).toHaveValue("");
  await page.locator("#words").fill("7");
  await expect(page.locator("#words-range")).toHaveValue("7");
  await expect(page.locator("#bit-count")).toHaveText("90");
  await page
    .locator('input[name="wordlist"][value="experimental-agent-vi"]')
    .check();
  await expect(page.locator("#bit-count")).toHaveText("80");
  await page.locator('input[name="separator"][value="."]').check();
  expect((await page.locator("#secret").inputValue()).split(".")).toHaveLength(
    7,
  );
  await page.locator('input[name="mode"][value="password"]').check();
  await page.locator("#length").fill("129");
  await expect(page.locator("#length")).toHaveValue("128");
  await expect(page.locator("#length-range")).toHaveValue("128");
  await expect(page.locator("#character-count")).toHaveText("128");
  await page.locator("#length").fill("1");
  await expect(page.locator("#copy")).toBeDisabled();
  await page.locator("#length").blur();
  await expect(page.locator("#length")).toHaveValue("8");
  await expect(page.locator("#length-range")).toHaveValue("8");
  await expect(page.locator("#character-count")).toHaveText("8");
});

test("rotation has a countdown, preserves show/hide and never extends inactivity", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    let draw = 0;
    Object.defineProperty(crypto, "getRandomValues", {
      value: (array: Uint8Array | Uint32Array) => {
        array.fill(draw++ % 8);
        return array;
      },
    });
  });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator("#generate").click();
  await page.mouse.move(0, 0);
  const initial = await page.locator("#secret").inputValue();
  await page.clock.fastForward(30_000);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 30);
  await page.clock.fastForward(30_000);
  await expect(page.locator("#secret")).not.toHaveValue(initial);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 60);
  await page.locator("#reveal").click();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(60_000);
  await expect(page.locator("#secret")).toHaveValue("••••••••••••••••••••");
  await expect(page.locator("#reveal")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator("#length").fill("24");
  await expect(page.locator("#secret")).toHaveValue("•".repeat(24));
  await page.clock.fastForward(300_001);
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#rotation")).toBeHidden();
  await page.locator("#generate").click();
  await expect(page.locator("#reveal")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.reload();
  await expect(page.locator("#reveal")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#secret")).not.toHaveValue("••••••••••••••••••••");
});

test("selection and explicit pause share one state, Resume works under the pointer and invalid input stays cleared", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator("#generate").click();
  await page.mouse.move(0, 0);
  const initial = await page.locator("#secret").inputValue();
  await page.locator("#secret").focus();
  await page.clock.fastForward(61_000);
  await expect(page.locator("#secret")).toHaveValue(initial);
  await expect(page.locator("#countdown-text")).toHaveText("Countdown paused");
  await expect(page.locator("#pause")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#pause-label")).toHaveText(
    "Resume automatic generation",
  );
  await page.locator("#pause").click();
  await expect(page.locator("#pause")).toHaveAttribute("aria-pressed", "false");
  await page.clock.fastForward(1_000);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 59);
  await expect(page.locator("#countdown-text")).toHaveText(
    "New result in 59 seconds",
  );
  await page.locator("#secret").hover();
  await page.clock.fastForward(61_000);
  await expect(page.locator("#secret")).not.toHaveValue(initial);
  await page.locator("#length").fill("");
  await page.clock.fastForward(61_000);
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#rotation")).toBeHidden();
});

test("scramble is decorative, noncopyable, cancellable and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await navigateApp(page, "/en/");
  await expect(page.locator("#generate")).toBeEnabled();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator("#generate").click();
  await expect(page.locator("#scramble")).toBeVisible();
  await expect(page.locator("#secret")).toBeHidden();
  await expect(page.locator("#copy")).toBeDisabled();
  await expect(page.locator("#scramble")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await page.clock.runFor(200);
  await page.locator("#length").fill("32");
  await page.clock.runFor(1_300);
  await expect(page.locator("#secret")).toBeVisible();
  expect(await page.locator("#secret").inputValue()).toHaveLength(32);
  await page.locator("#generate").click();
  await page.locator("#reveal").click();
  await page.clock.runFor(1_300);
  await expect(page.locator("#scramble")).toHaveText("");
  await expect(page.locator("#secret")).toHaveValue("•".repeat(32));
  await page.locator("#reveal").click();
  await page.locator("#generate").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#scramble")).toBeHidden();
  await expect(page.locator("#copy")).toBeEnabled();
  await page.locator("#generate").click();
  await expect(page.locator("#secret")).toBeVisible();
});

test("a maximum-length phrase scramble stays inside the output surface on a narrow screen", async ({
  page,
}, testInfo) => {
  const tokens = readFileSync("data/lists/eff-long.txt", "utf8")
    .trimEnd()
    .split("\n");
  const longest = tokens.reduce(
    (best, token, index) =>
      token.length > (tokens[best]?.length ?? 0) ? index : best,
    0,
  );
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript((index) => {
    Object.defineProperty(crypto, "getRandomValues", {
      value: (view: Uint8Array | Uint32Array) => {
        view.fill(view instanceof Uint32Array ? index : 0);
        return view;
      },
    });
  }, longest);
  await page.clock.install();
  await navigateApp(page, "/en/");
  await expect(page.locator("#generate")).toBeEnabled();
  await page.evaluate(() => document.fonts.ready.then(() => {}));
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator('input[name="mode"][value="phrase"]').check();
  await page.locator("#words").fill("20");
  await expect(page.locator("#scramble")).toBeVisible();
  const geometry = () =>
    page.evaluate(() => {
      const boxElement = document.querySelector(".secret-box");
      const animationElement = document.querySelector("#scramble");
      const buttonElement = document.querySelector("#generate");
      if (!boxElement || !animationElement || !buttonElement)
        throw new Error("MISSING_TEST_ELEMENT");
      const box = boxElement.getBoundingClientRect();
      const animation = animationElement.getBoundingClientRect();
      const button = buttonElement.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        boxTop: box.top + window.scrollY,
        boxBottom: box.bottom + window.scrollY,
        animationTop: animation.top + window.scrollY,
        animationBottom: animation.bottom + window.scrollY,
        buttonTop: button.top + window.scrollY,
      };
    });
  const before = await geometry();
  expect(before.animationTop).toBeGreaterThanOrEqual(before.boxTop);
  expect(before.animationBottom).toBeLessThanOrEqual(before.boxBottom);
  expect(before.buttonTop - before.boxBottom).toBeGreaterThanOrEqual(12 - 0.01);
  expect(before.buttonTop - before.boxBottom).toBeLessThanOrEqual(16);
  await page.clock.runFor(1_300);
  await expect(page.locator("#secret")).toHaveValue(
    Array.from({ length: 20 }, () => tokens[longest]).join("-"),
  );
  const after = await geometry();
  await testInfo.attach("maximum-phrase-geometry", {
    body: JSON.stringify({ before, after }),
    contentType: "application/json",
  });
  expect(Math.abs(after.boxTop - before.boxTop)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.boxBottom - before.boxBottom)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.buttonTop - before.buttonTop)).toBeLessThanOrEqual(1);
});

test("theme icons, target names, persistence, system changes and footer follow shared chrome", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#theme")).toHaveAccessibleName(
    "Switch to dark theme",
  );
  await expect(page.locator(".theme-moon")).toBeVisible();
  await expect(page.locator(".theme-sun")).toBeHidden();
  await page.locator("#theme").click();
  await expect(page.locator("#theme")).toHaveAccessibleName(
    "Switch to light theme",
  );
  await expect(page.locator("#theme")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".theme-sun")).toBeVisible();
  await expect(page.locator(".theme-moon")).toBeHidden();
  const gap = await page.evaluate(() => {
    const previous = document.querySelector(".secret-box");
    const button = document.getElementById("generate");
    return previous && button
      ? button.getBoundingClientRect().top -
          previous.getBoundingClientRect().bottom
      : 0;
  });
  expect(gap).toBeGreaterThanOrEqual(12 - 0.01);
  expect(gap).toBeLessThanOrEqual(16);
  const surfaceColors = await page.evaluate(() => {
    const box = document.querySelector(".secret-box");
    const surface = document.getElementById("result-surface");
    return box && surface
      ? [
          getComputedStyle(box).backgroundColor,
          getComputedStyle(surface).backgroundColor,
          getComputedStyle(box).borderTopWidth,
        ]
      : [];
  });
  expect(surfaceColors[0]).not.toBe(surfaceColors[1]);
  expect(surfaceColors[2]).toBe("1px");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("[data-site-footer] nav")).toHaveAccessibleName(
    "Website information",
  );
  await expect(
    page.locator("[data-site-footer] a").first(),
  ).toHaveAccessibleName("VINASIG home");
  await page.locator("#theme").click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
