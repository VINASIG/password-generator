import { navigateApp } from "./navigation.ts";
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

async function ready(
  page: Page,
  locale = "en",
  reducedMotion: "reduce" | "no-preference" = "reduce",
): Promise<void> {
  await page.emulateMedia({ reducedMotion });
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
  await page.evaluate(() => document.fonts.ready.then(() => {}));
}

async function pasteCopied(page: Page): Promise<string> {
  await page.evaluate(() => {
    const sink = document.createElement("textarea");
    sink.id = "synthetic-paste-fixture";
    document.body.append(sink);
    sink.focus();
  });
  await page.keyboard.press("ControlOrMeta+V");
  const text = await page.locator("#synthetic-paste-fixture").inputValue();
  await page.locator("#synthetic-paste-fixture").evaluate((node) => {
    node.remove();
  });
  return text;
}

test("native keyboard copy pastes the exact selected password or Unicode phrase, shown and hidden", async ({
  page,
}) => {
  await ready(page);
  for (const mode of [
    "password",
    "eff",
    "experimental-agent-vi",
    "experimental-agent-ascii",
  ]) {
    let expected = "a".repeat(20);
    if (mode !== "password") {
      await page.locator('input[name="mode"][value="phrase"]').check();
      await page.locator(`input[name="wordlist"][value="${mode}"]`).check();
      const name = mode === "eff" ? "eff-long" : mode;
      const first = readFileSync(`data/lists/${name}.txt`, "utf8").split(
        "\n",
      )[0];
      expected = Array<string>(7)
        .fill(first ?? "")
        .join("-");
    }
    if (
      (await page.locator("#reveal").getAttribute("aria-pressed")) === "false"
    )
      await page.locator("#reveal").click();
    await expect(page.locator("#secret")).toHaveValue(expected);
    for (const hidden of [false, true]) {
      if (hidden) await page.locator("#reveal").click();
      for (const [start, end] of [
        [0, expected.length],
        [1, Math.min(6, expected.length)],
      ]) {
        await page.locator("#secret").focus();
        await page.locator("#secret").evaluate(
          (node: HTMLTextAreaElement, range) => {
            node.setSelectionRange(range[0] ?? 0, range[1] ?? 0);
          },
          [start, end],
        );
        await page.keyboard.press("ControlOrMeta+C");
        await expect(page.locator("#secret")).toBeFocused();
        await expect(page.locator("body > textarea")).toHaveCount(0);
        await expect(page.locator(".native-copy")).toHaveCount(0);
        expect(
          await page
            .locator("#secret")
            .evaluate((node: HTMLTextAreaElement) => [
              node.selectionStart,
              node.selectionEnd,
            ]),
        ).toEqual([start, end]);
        expect(await pasteCopied(page)).toBe(expected.slice(start, end));
        await expect(page.locator("#pause")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await expect(page.locator("#status")).toContainText("Copied.");
      }
      await expect(page.locator("#secret")).toHaveValue(
        hidden ? "•".repeat(Array.from(expected).length) : expected,
      );
    }
  }
});

test("the browser Copy command uses the same trusted selection event and synthetic copy events cannot extract a secret", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#reveal").click();
  await page.locator("#secret").focus();
  await page.keyboard.press("ControlOrMeta+A");
  expect(
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- Test the native browser Copy command, not a production clipboard fallback.
      return document.execCommand("copy");
    }),
  ).toBe(true);
  expect(await pasteCopied(page)).toBe("a".repeat(20));
  const synthetic = await page.locator("#secret").evaluate((node) => {
    const data = new DataTransfer();
    node.dispatchEvent(
      new ClipboardEvent("copy", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
    return data.getData("text/plain");
  });
  expect(synthetic).toBe("");
});

test("pagehide wipes an in-flight native masked Copy transfer and prevents stale focus restoration", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#reveal").click();
  await page.locator("#secret").evaluate((node: HTMLTextAreaElement) => {
    node.addEventListener(
      "copy",
      () => {
        document.body.dataset["copyTransferActive"] = String(
          node.classList.contains("native-copy") &&
            node.value === "a".repeat(20),
        );
        document.body.dataset["copyTransferClip"] =
          getComputedStyle(node).clipPath;
        document.body.dataset["copyTransferPosition"] =
          getComputedStyle(node).position;
        document.body.dataset["copyTransferMask"] = String(
          document.querySelector("#scramble")?.textContent === "•".repeat(20),
        );
        window.dispatchEvent(new Event("pagehide"));
      },
      { once: true },
    );
  });
  await page.locator("#secret").focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("ControlOrMeta+C");
  await expect(page.locator("body")).toHaveAttribute(
    "data-copy-transfer-active",
    "true",
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-copy-transfer-clip",
    "inset(50%)",
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-copy-transfer-position",
    "static",
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-copy-transfer-mask",
    "true",
  );
  await expect(page.locator("body > textarea")).toHaveCount(0);
  await expect(page.locator(".native-copy")).toHaveCount(0);
  await expect(page.locator("#scramble")).toHaveText("");
  await expect(page.locator("#secret")).toHaveValue("");
  await expect(page.locator("#copy")).toBeDisabled();
  await expect(page.locator("#secret")).not.toBeFocused();
  await expect(page.locator("#status")).toContainText("Result cleared");
});

test("password lines fill their available width without inserted newlines and masks match the selected length", async ({
  page,
}) => {
  await ready(page, "vi");
  await page.evaluate(() =>
    Object.defineProperty(crypto, "getRandomValues", {
      configurable: true,
      value: (view: Uint8Array | Uint32Array) => {
        view.fill(37);
        return view;
      },
    }),
  );
  for (const width of [320, 390, 759, 760, 761, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const length of [8, 20, 128]) {
      await page.locator("#length").fill(String(length));
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                resolve();
              }),
            ),
          ),
      );
      const geometry = await page
        .locator("#secret")
        .evaluate((node: HTMLTextAreaElement) => {
          const style = getComputedStyle(node);
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("MISSING_TEXT_METRICS");
          context.font = `${style.fontSize} ${style.fontFamily}`;
          const perLine = Math.floor(
            node.clientWidth / context.measureText("M").width,
          );
          return {
            hasNewline: node.value.includes("\n"),
            height: node.scrollHeight,
            expectedHeight: Math.max(
              parseFloat(style.minHeight),
              Math.ceil(node.value.length / perLine) *
                parseFloat(style.lineHeight),
            ),
            alignment: style.textAlign,
          };
        });
      expect(geometry.hasNewline).toBe(false);
      expect(geometry.alignment).toBe("start");
      expect(
        Math.abs(geometry.height - geometry.expectedHeight),
      ).toBeLessThanOrEqual(1);
      await page.locator("#reveal").click();
      await expect(page.locator("#secret")).toHaveValue("•".repeat(length));
      await expect
        .poll(() =>
          page.locator("#secret").evaluate((node) => ({
            horizontalOverflow: node.scrollWidth > node.clientWidth + 1,
            verticalOverflow: node.scrollHeight > node.clientHeight + 1,
          })),
        )
        .toEqual({ horizontalOverflow: false, verticalOverflow: false });
      await page.locator("#generate").click();
      await expect(page.locator("#secret")).toHaveValue("•".repeat(length));
      await page.locator("#reveal").click();
    }
  }
});

test("128-character animation holds an initial scramble, settles progressively and never changes the final secret", async ({
  page,
}) => {
  await ready(page, "en", "no-preference");
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 2000));
  await page.evaluate(() => {
    Object.defineProperty(crypto, "getRandomValues", {
      configurable: true,
      value: (view: Uint8Array | Uint32Array) => {
        view.fill(view instanceof Uint8Array && view.byteLength === 1 ? 1 : 0);
        return view;
      },
    });
  });
  await page.locator("#length").fill("128");
  await expect(page.locator("#copy")).toBeDisabled();
  await expect(page.locator("#scramble")).toHaveText("b".repeat(128));
  await page.clock.runFor(200);
  await expect(page.locator("#scramble")).toHaveText("b".repeat(128));
  await page.clock.runFor(400);
  const halfway = await page.locator("#scramble").innerText();
  expect(halfway).toMatch(/^a{40,48}b+$/);
  await expect(page.locator("#copy")).toBeDisabled();
  await page.clock.runFor(650);
  await expect(page.locator("#scramble")).toBeHidden();
  await expect(page.locator("#secret")).toHaveValue("a".repeat(128));
  await expect(page.locator("#copy")).toBeEnabled();
});

test("Generate, visibility and Copy form one adjacent action group with no redundant Clear button", async ({
  page,
}) => {
  for (const locale of ["vi", "en"]) {
    await ready(page, locale);
    await expect(page.locator("#clear")).toHaveCount(0);
    const ids = await page
      .locator(".result-actions button")
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(ids).toEqual(["generate", "reveal", "copy"]);
    const top = await page
      .locator(".result-actions")
      .evaluate((node) => node.getBoundingClientRect().top);
    const bottom = await page
      .locator(".secret-box")
      .evaluate((node) => node.getBoundingClientRect().bottom);
    expect(top - bottom).toBe(12);
  }
});

test("countdown numbers are emphasized and low-bit guidance belongs to the corresponding settings", async ({
  page,
}) => {
  for (const locale of ["vi", "en"]) {
    await ready(page, locale);
    await expect(page.locator("#countdown-text strong")).toHaveText(
      /^(5[0-9]|60)$/,
    );
    expect(
      await page
        .locator("#countdown-text strong")
        .evaluate((node) => Number(getComputedStyle(node).fontWeight)),
    ).toBeGreaterThanOrEqual(600);
    await page.locator("#length").fill("8");
    await expect(page.locator("#length-warning")).toBeVisible();
    expect(
      await page
        .locator("#length-warning")
        .evaluate((node) =>
          Boolean(node.previousElementSibling?.querySelector("#length")),
        ),
    ).toBe(true);
    await page.locator('input[name="mode"][value="phrase"]').check();
    await page.locator("#words").fill("4");
    await expect(page.locator("#words-warning")).toBeVisible();
    expect(
      await page
        .locator("#words-warning")
        .evaluate((node) => node.previousElementSibling?.className),
    ).toBe("bit-shortcuts");
    await expect(page.locator(".result-surface .warning")).toHaveCount(0);
    await page.locator('[data-bits="80"]').click();
    await expect(page.locator("#words-warning")).toBeHidden();
    await page.locator('input[name="mode"][value="password"]').check();
    await page.locator("#length").fill("20");
    await expect(page.locator("#length-warning")).toBeHidden();
  }
});

test("translated metric values share a row even when labels wrap, and Vietnamese instructions state concrete actions", async ({
  page,
}) => {
  for (const locale of ["vi", "en"]) {
    await ready(page, locale);
    for (const theme of ["light", "dark"]) {
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await page.locator("#theme").click();
      for (const size of ["100%", "200%"]) {
        await page.evaluate((value) => {
          document.documentElement.style.fontSize = value;
        }, size);
        for (const width of [421, 437, 759, 761, 1024, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => {
                    resolve();
                  }),
                ),
              ),
          );
          const layout = await page.locator("#metrics").evaluate((node) => ({
            narrow: matchMedia("(width <= 420px)").matches,
            columns:
              getComputedStyle(node).gridTemplateColumns.split(" ").length,
            values: Array.from(node.querySelectorAll("dd"), (value) => {
              const rect = value.getBoundingClientRect();
              return { top: rect.top, right: rect.right };
            }),
          }));
          expect(layout.columns).toBe(layout.narrow ? 1 : 3);
          if (layout.narrow) {
            const rights = layout.values.map((value) => value.right);
            expect(
              Math.max(...rights) - Math.min(...rights),
            ).toBeLessThanOrEqual(1);
            expect(layout.values[1]?.top).toBeGreaterThan(
              layout.values[0]?.top ?? 0,
            );
            expect(layout.values[2]?.top).toBeGreaterThan(
              layout.values[1]?.top ?? 0,
            );
          } else {
            const ys = layout.values.map((value) => value.top);
            expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  }
  await ready(page, "vi");
  await page
    .locator("details")
    .filter({
      has: page.locator("summary", {
        hasText: "Dùng passphrase tiếng Việt thế nào?",
      }),
    })
    .locator("summary")
    .click();
  await expect(page.locator(".methods")).toContainText(
    "Sau khi đặt mật khẩu cho tài khoản, hãy thử đăng nhập bằng mật khẩu đó.",
  );
  await expect(page.locator(".methods")).not.toContainText(
    "khả năng nhập lại của dịch vụ",
  );
});
