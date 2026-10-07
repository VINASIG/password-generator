import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { navigateApp } from "./navigation.ts";

async function visibility(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

test("password animation obeys selected groups and character exclusions", async ({
  page,
}, testInfo) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#generate")).toBeEnabled();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator("#upper").uncheck();
  await page.locator("#digits").uncheck();
  await page.locator("#symbols").uncheck();
  await page.locator("#exclude").fill("abc");
  await expect(page.locator("#scramble")).toBeVisible();
  await testInfo.attach("configured-password-frame", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  expect(await page.locator("#scramble").textContent()).toMatch(/^[d-z]+$/);
  await page.clock.runFor(1_300);
  await expect(page.locator("#secret")).toHaveValue(/^[d-z]{20}$/);
});

test("passphrase animation contains lowercase vocabulary letters and preserves separators", async ({
  page,
}, testInfo) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#generate")).toBeEnabled();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator('input[name="mode"][value="phrase"]').check();
  for (const [profile, file] of [
    ["eff", "eff-long.txt"],
    ["experimental-agent-vi", "experimental-agent-vi.txt"],
    ["experimental-agent-ascii", "experimental-agent-ascii.txt"],
  ]) {
    const alphabet = new Set(
      Array.from(readFileSync(`data/lists/${file}`, "utf8")),
    );
    await page.locator(`input[name="wordlist"][value="${profile}"]`).check();
    for (const separator of ["-", " ", "."]) {
      await page
        .locator(`input[name="separator"][value="${separator}"]`)
        .check();
      await page.locator("#generate").click();
      const frames: string[] = [];
      for (const advance of [0, 180, 420, 500]) {
        await page.clock.runFor(advance);
        await expect(page.locator("#scramble")).toBeVisible();
        const value = (await page.locator("#scramble").textContent()) ?? "";
        expect(value).not.toMatch(/[0-9A-Z]/);
        expect(
          Array.from(value).every(
            (character) => alphabet.has(character) || character === separator,
          ),
        ).toBe(true);
        frames.push(value);
      }
      if (separator === "-")
        await testInfo.attach(`${profile}-configured-frame`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: "image/png",
        });
      await page.clock.runFor(200);
      const final = await page.locator("#secret").inputValue();
      const boundaries = (value: string) =>
        Array.from(value).flatMap((character, index) =>
          ("_-" + separator).includes(character) ? [index] : [],
        );
      for (const frame of frames) {
        expect(Array.from(frame)).toHaveLength(Array.from(final).length);
        expect(boundaries(frame)).toEqual(boundaries(final));
      }
    }
  }
});

for (const masks of [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
])
  test(`password frames obey group subsets ${masks.join(",")} and ambiguity exclusions`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await navigateApp(page, "/en/");
    await expect(page.locator("#generate")).toBeEnabled();
    await page.clock.pauseAt(new Date(Date.now() + 2_000));
    const groups = [
      ["lower", "abcdefghijklmnopqrstuvwxyz"],
      ["upper", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
      ["digits", "0123456789"],
      ["symbols", "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"],
    ] as const;
    await page.locator("#exclude").fill("aA0!");
    await page.locator("#require-each").check();
    for (const mask of masks) {
      for (const [index, [id]] of groups.entries())
        await page.locator(`#${id}`).setChecked((mask & (1 << index)) !== 0);
      for (const ambiguous of [false, true]) {
        await page.locator("#ambiguous").setChecked(ambiguous);
        await page.locator("#generate").click();
        const excluded = "aA0!" + (ambiguous ? "Il1O0o" : "");
        const alphabet = groups
          .filter((_, index) => (mask & (1 << index)) !== 0)
          .map(([, characters]) => characters)
          .join("");
        for (const advance of [0, 600]) {
          await page.clock.runFor(advance);
          const value = (await page.locator("#scramble").textContent()) ?? "";
          expect(value).toHaveLength(20);
          expect(
            Array.from(value).every(
              (character) =>
                alphabet.includes(character) && !excluded.includes(character),
            ),
          ).toBe(true);
        }
        await page.clock.runFor(700);
        await expect(page.locator("#secret")).toBeVisible();
      }
    }
  });

test("a first background load generates once when first shown and repeated visibility events do not reset it", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
  });
  await navigateApp(page, "/en/");
  await expect(page.locator("#generate")).toBeEnabled();
  await expect(page.locator("#secret")).toHaveValue("");
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await visibility(page, false);
  await expect(page.locator("#secret")).toBeVisible();
  const initial = await page.locator("#secret").inputValue();
  await page.clock.runFor(10_000);
  await visibility(page, false);
  await expect(page.locator("#secret")).toHaveValue(initial);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 50);
  await visibility(page, true);
  await page.clock.runFor(5_000);
  await visibility(page, false);
  await expect(page.locator("#secret")).toHaveValue(initial);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 50);
});

test("manual pause, masked output and invalid input survive a tab switch", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator("#generate").click();
  const initial = await page.locator("#secret").inputValue();
  await page.locator("#pause").click();
  await page.locator("#reveal").click();
  await visibility(page, true);
  await page.clock.runFor(15_000);
  await visibility(page, false);
  await expect(page.locator("#secret")).toHaveValue("•".repeat(20));
  await expect(page.locator("#reveal")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.locator("#pause")).toHaveAttribute("aria-pressed", "true");
  await page.clock.runFor(61_000);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 60);
  await page.locator("#reveal").click();
  await expect(page.locator("#secret")).toHaveValue(initial);
  await page.locator("#length").fill("");
  await visibility(page, true);
  await page.clock.runFor(2_000);
  await visibility(page, false);
  await expect(page.locator("#length-error")).toBeVisible();
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#copy")).toBeDisabled();
});

test("a late clipboard callback after hiding cannot alter the restored result", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  const initial = await page.locator("#secret").inputValue();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            Object.defineProperty(globalThis, "__finishHiddenCopy", {
              value: resolve,
            });
          }),
      },
    });
  });
  await page.locator("#copy").click();
  await expect(page.locator("#copy")).toBeDisabled();
  await visibility(page, true);
  await visibility(page, false);
  await expect(page.locator("#secret")).toHaveValue(initial);
  await expect(page.locator("#copy")).toBeEnabled();
  await page.evaluate(() => {
    (globalThis as { __finishHiddenCopy?: () => void }).__finishHiddenCopy?.();
  });
  await expect(page.locator("#status")).toHaveText("New result generated.");
  await expect(page.locator("#secret")).toHaveValue(initial);
  await expect(page.locator("#pause")).toHaveAttribute("aria-pressed", "true");
});

test("hidden inactivity expiry stays cleared and does not manufacture a new startup result", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator("#generate").click();
  await visibility(page, true);
  await page.clock.runFor(300_001);
  await visibility(page, false);
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#copy")).toBeDisabled();
  await expect(page.locator("#rotation")).toBeHidden();
  await expect(page.locator("#status")).toContainText("5 minutes");
  await page.locator("#generate").click();
  await expect(page.locator("#secret")).toBeVisible();
  await expect(page.locator("#copy")).toBeEnabled();
});

test("an interrupted scramble restores its completed result without restarting animation", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await navigateApp(page, "/en/");
  await expect(page.locator("#generate")).toBeEnabled();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator("#generate").click();
  await page.clock.runFor(180);
  await expect(page.locator("#scramble")).toBeVisible();
  await visibility(page, true);
  await expect(page.locator("#scramble")).toHaveText("");
  await page.clock.runFor(2_000);
  await visibility(page, false);
  await expect(page.locator("#secret")).toBeVisible();
  await expect(page.locator("#scramble")).toBeHidden();
  await expect(page.locator("#copy")).toBeEnabled();
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 59.82);
});

test("returning from another tab preserves the result and the remaining countdown", async ({
  page,
}, testInfo) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    let draws = 0;
    Object.defineProperty(crypto, "getRandomValues", {
      value: (view: Uint8Array | Uint32Array) => {
        view.fill(draws++ % 8);
        return view;
      },
    });
  });
  await navigateApp(page, "/en/");
  await expect(page.locator("#secret")).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 2_000));
  await page.locator("#generate").click();
  const initial = await page.locator("#secret").inputValue();
  await page.clock.runFor(10_000);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 50);
  await visibility(page, true);
  await expect(page.locator("#secret")).toHaveValue("");
  await page.clock.runFor(2_000);
  await visibility(page, false);
  await testInfo.attach("returned-tab", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  await expect(page.locator("#secret")).toHaveValue(initial);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 50);
  await expect(page.locator("#scramble")).toBeHidden();
  await page.clock.runFor(49_000);
  await expect(page.locator("#secret")).toHaveValue(initial);
  await page.clock.runFor(1_000);
  await expect(page.locator("#secret")).not.toHaveValue(initial);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 60);
});
