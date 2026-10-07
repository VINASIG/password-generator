import { navigateApp } from "./navigation.ts";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { inspectUiContract } from "../../.vinasig/standards/templates/web/ui-contract.mjs";

async function ready(page: Page, locale = "vi"): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "getRandomValues", {
      configurable: true,
      value: (view: Uint8Array | Uint32Array) => {
        view.fill(0);
        return view;
      },
    });
  });
  await navigateApp(page, locale === "vi" ? "/" : "/en/");
  await expect(page.locator("#copy")).toBeEnabled();
}

async function painted(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        }),
      ),
  );
}

function contract(desktop: boolean, phrase: boolean) {
  return {
    cards: [
      { selector: ".mode-choices", count: 2, singleRow: desktop },
      { selector: ".list-choices", count: 3 },
      { selector: ".separator-choices", count: 3, singleRow: desktop },
    ],
    icons: [
      {
        selector: ".mode-choices .choice-title",
        count: 2,
        label: "[data-icon-label]",
      },
    ],
    errors: ["#settings input[aria-invalid=true]"],
    outputs: [{ selector: ".secret-box", actions: ".result-actions" }],
    rows:
      desktop && phrase
        ? [
            {
              selector: ".bit-shortcuts",
              members: ":scope > span, :scope > .bit-buttons",
              count: 2,
            },
          ]
        : [],
    progress: ["#countdown"],
  };
}

test("cards keep native grouping, arrows and focus without duplicate circles", async ({
  page,
}) => {
  await ready(page);
  await page.locator('input[name="mode"][value="password"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.locator('input[name="mode"][value="phrase"]'),
  ).toBeChecked();
  await expect(
    page.locator('input[name="mode"][value="phrase"]'),
  ).toBeFocused();
  await expect(page.locator("#phrase-panel")).toBeVisible();
  await page.locator('input[name="wordlist"][value="eff"]').focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.locator('input[name="wordlist"][value="experimental-agent-vi"]'),
  ).toBeChecked();
  const focus = await page
    .locator('input[name="wordlist"]:checked')
    .evaluate((node) => {
      const card = node.closest("label");
      return card ? getComputedStyle(card).outlineWidth : "0px";
    });
  expect(parseFloat(focus)).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(inspectUiContract, contract(true, true))).toEqual(
    [],
  );
  await page.emulateMedia({ forcedColors: "active" });
  const selectedOutline = await page
    .locator('input[name="wordlist"]:checked')
    .evaluate((node) => {
      const card = node.closest("label");
      return card ? getComputedStyle(card).outlineStyle : "none";
    });
  expect(selectedOutline).toBe("solid");
});

test("word-count errors are localized, linked and next to the field, then clear on correction", async ({
  page,
}) => {
  for (const locale of ["vi", "en"]) {
    await ready(page, locale);
    await page.locator('input[name="mode"][value="phrase"]').check();
    for (const value of ["-1", "", "4.5", "abc", "1e2"]) {
      await page.locator("#words").fill(value);
      await expect(page.locator("#words-error")).toBeVisible();
      await expect(page.locator("#words-error")).toHaveText(
        locale === "vi"
          ? "Nhập số nguyên từ 4 đến 20 từ."
          : "Enter a whole number from 4 to 20 words.",
      );
      await expect(page.locator("#words")).toHaveAttribute(
        "aria-describedby",
        "words-hint words-error words-warning",
      );
      await expect(page.locator("#words")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      await expect(page.locator("#copy")).toBeDisabled();
      await expect(page.locator("#secret")).toHaveValue("");
      await expect(page.locator("#status")).toBeEmpty();
      expect(
        await page.evaluate(inspectUiContract, contract(true, true)),
      ).toEqual([]);
    }
    await page.locator("#words").fill("22");
    await expect(page.locator("#words")).toHaveValue("20");
    await expect(page.locator("#words-range")).toHaveValue("20");
    await expect(page.locator("#words-error")).toBeHidden();
    await expect(page.locator("#copy")).toBeEnabled();
    await page.locator('input[name="mode"][value="password"]').check();
    await expect(page.locator("#words-error")).toBeHidden();
    await page.locator("#length").fill("-1");
    await expect(page.locator("#length-error")).toBeVisible();
    await expect(page.locator("#length-error")).toContainText("128");
  }
});

test("character options are always open and their errors belong to the affected settings", async ({
  page,
}) => {
  await ready(page);
  await expect(page.locator("#compatibility")).toHaveRole("group");
  await expect(page.locator("#compatibility legend")).toHaveText(
    "Tùy chỉnh ký tự",
  );
  await expect(page.locator("#exclude")).toBeVisible();
  await expect(page.locator("#require-each")).toBeVisible();
  await expect(page.locator("#ambiguous")).toBeVisible();
  for (const id of ["lower", "upper", "digits", "symbols"])
    await page.locator(`#${id}`).uncheck();
  await expect(page.locator("#groups-error")).toHaveText(
    "Chọn ít nhất một nhóm ký tự.",
  );
  expect(await page.evaluate(inspectUiContract, contract(true, false))).toEqual(
    [],
  );
  await page.locator("#lower").check();
  await expect(page.locator("#groups-error")).toBeHidden();
  await page.locator("#exclude").fill(" ");
  await expect(page.locator("#exclude-error")).toContainText(
    "Không thêm khoảng trắng",
  );
  await page.locator("#exclude").fill("abcdefghijklmnopqrstuvwxyz");
  await expect(page.locator("#exclude-error")).toContainText("không còn ký tự");
  await expect(page.locator("#copy")).toBeDisabled();
  await page.locator("#exclude").fill("");
  await expect(page.locator("#exclude-error")).toBeHidden();
  await expect(page.locator("#copy")).toBeEnabled();
});

test("result actions and visibility icons stay adjacent to compact fitted output", async ({
  page,
}) => {
  await ready(page);
  const shortHeight = await page
    .locator(".secret-box")
    .evaluate((node) => node.getBoundingClientRect().height);
  expect(shortHeight).toBeLessThanOrEqual(70);
  expect(await page.evaluate(inspectUiContract, contract(true, false))).toEqual(
    [],
  );
  await expect(page.locator("#hide-icon svg")).toBeVisible();
  await expect(page.locator("#show-icon")).toBeHidden();
  await page.locator("#reveal").click();
  await expect(page.locator("#show-icon svg")).toBeVisible();
  await expect(page.locator("#hide-icon")).toBeHidden();
  await expect(page.locator("#reveal")).toHaveAccessibleName("Hiện kết quả");
  await page.locator("#generate").click();
  await expect(page.locator("#secret")).toHaveValue("••••••••••••••••••••");
  await page.locator("#reveal").click();
  await expect(page.locator("#reveal")).toHaveAccessibleName("Ẩn kết quả");
  await expect(page.locator("#status")).toHaveText("Đã tạo kết quả mới.");
});

test("short and maximum phrases fit every pinned vocabulary at narrow and desktop widths", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await ready(page);
  await page.locator('input[name="mode"][value="phrase"]').check();
  for (const id of [
    "eff",
    "experimental-agent-vi",
    "experimental-agent-ascii",
  ]) {
    const file = id === "eff" ? "eff-long" : id;
    const tokens = readFileSync(`data/lists/${file}.txt`, "utf8")
      .trimEnd()
      .split("\n");
    const longest = tokens.reduce(
      (best, token, index) =>
        token.length > (tokens[best]?.length ?? 0) ? index : best,
      0,
    );
    await page.evaluate((index) => {
      Object.defineProperty(crypto, "getRandomValues", {
        configurable: true,
        value: (view: Uint8Array | Uint32Array) => {
          view.fill(view instanceof Uint32Array ? index : 0);
          return view;
        },
      });
    }, longest);
    await page.locator(`input[name="wordlist"][value="${id}"]`).check();
    for (const width of [320, 390, 759, 760, 761, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator("#words").fill("4");
      const short = await page
        .locator("#secret")
        .evaluate((node) => node.getBoundingClientRect().height);
      await page.locator("#words").fill("20");
      await expect(page.locator("#secret")).toHaveValue(
        Array<string>(20)
          .fill(tokens[longest] ?? "")
          .join("-"),
      );
      const long = await page
        .locator("#secret")
        .evaluate((node) => node.getBoundingClientRect().height);
      expect(long).toBeGreaterThan(short);
      expect(
        await page.evaluate(inspectUiContract, contract(width > 760, true)),
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (info.project.name === "chromium" && [320, 1440].includes(width)) {
        mkdirSync("output/ui-acceptance", { recursive: true });
        await page.screenshot({
          path: `output/ui-acceptance/${id}-${width}-maximum.png`,
          fullPage: true,
        });
      }
    }
  }
});

test("midpoint track is visible and the timer label, icon and action agree under the pointer", async ({
  page,
}) => {
  await page.clock.install();
  await ready(page);
  await page.clock.pauseAt(new Date(Date.now() + 2000));
  await page.locator("#generate").click();
  await page.locator("#pause").hover();
  await page.clock.fastForward(30_000);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 30);
  for (const theme of ["light", "dark"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme)
      await page.locator("#theme").click();
    expect(
      await page.evaluate(inspectUiContract, contract(true, false)),
    ).toEqual([]);
  }
  await page.locator("#pause").click();
  await expect(page.locator("#pause-label")).toHaveText("Tiếp tục tự tạo");
  await expect(page.locator("#resume-icon svg")).toBeVisible();
  await expect(page.locator("#countdown-text")).toHaveText(
    "Đếm ngược đang tạm dừng",
  );
  await page.clock.fastForward(15_000);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 30);
  await page.locator("#pause").click();
  await expect(page.locator("#pause-label")).toHaveText("Tạm dừng tự tạo");
  await expect(page.locator("#pause-icon svg")).toBeVisible();
  await page.clock.fastForward(1_000);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 29);
  await expect(page.locator("#countdown-text")).toHaveText(
    "Tạo mới sau 29 giây",
  );
  await page.locator("#secret").focus();
  await expect(page.locator("#pause")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#pause").click();
  await page.clock.fastForward(1_000);
  await expect(page.locator("#countdown")).toHaveJSProperty("value", 28);
});

test("all visible modes pass localized structural acceptance in both themes and at 200 percent text", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  for (const locale of ["vi", "en"])
    for (const theme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await ready(page, locale);
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await page.locator("#theme").click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await painted(page);
        for (const mode of [
          "password",
          "eff",
          "experimental-agent-vi",
          "experimental-agent-ascii",
        ]) {
          await page
            .locator(
              `input[name="mode"][value="${mode === "password" ? "password" : "phrase"}"]`,
            )
            .check();
          if (mode !== "password")
            await page
              .locator(`input[name="wordlist"][value="${mode}"]`)
              .check();
          expect(
            await page.evaluate(
              inspectUiContract,
              contract(width > 760, mode !== "password"),
            ),
            `${locale}/${theme}/${mode}/${width}px after resize paint`,
          ).toEqual([]);
          if (info.project.name === "chromium" && [390, 1440].includes(width)) {
            mkdirSync("output/ui-acceptance", { recursive: true });
            await page.screenshot({
              path: `output/ui-acceptance/${locale}-${theme}-${mode}-${width}.png`,
              fullPage: true,
            });
          }
        }
      }
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await painted(page);
        for (const mode of [
          "password",
          "eff",
          "experimental-agent-vi",
          "experimental-agent-ascii",
        ]) {
          await page
            .locator(
              `input[name="mode"][value="${mode === "password" ? "password" : "phrase"}"]`,
            )
            .check();
          if (mode !== "password")
            await page
              .locator(`input[name="wordlist"][value="${mode}"]`)
              .check();
          await expect
            .poll(async () =>
              page.evaluate(inspectUiContract, contract(false, false)),
            )
            .toEqual([]);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `${locale}/${theme}/${mode}/${width}px at 200% text`,
          ).toBe(true);
          if (info.project.name === "chromium" && width === 320) {
            await page.locator(".workspace").screenshot({
              path: `output/ui-acceptance/${locale}-${theme}-${mode}-320-zoom.png`,
            });
          }
        }
      }
    }
});

test("shared chrome and control styles retain the reviewed original source bytes", () => {
  const expected: Record<string, string> = {
    "site-chrome":
      "0443593d2b4e9dbd5e9341e444a52d823900fd534e9b80edcbcddb6b54d0f2a3",
    preferences:
      "a68b18001fc54dd6b5b11cb2a659cccced92797103317e62cfe5bc627a0665e5",
    "control-surfaces":
      "3114cc613a3dfaabfb0c9458ca9384ae43da6ea1a9e9be0e502a07d3ed3a8808",
  };
  for (const [name, digest] of Object.entries(expected))
    expect(
      createHash("sha256")
        .update(readFileSync(`src/styles/${name}.css`))
        .digest("hex"),
    ).toBe(digest);
});
