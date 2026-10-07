import { expect, test } from "@playwright/test";
import { navigateApp } from "./navigation.ts";

test("navigation readiness refuses unsuccessful HTTP responses and undecodable images", async ({
  page,
}) => {
  await page.route("**/navigation-error-fixture", (route) =>
    route.fulfill({
      status: 404,
      contentType: "text/html",
      body: "<!doctype html><title>Synthetic failed response</title>",
    }),
  );
  await expect(
    navigateApp(page, "/navigation-error-fixture"),
  ).rejects.toThrow();
  await page.route("**/navigation-image-fixture", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: '<!doctype html><title>Synthetic broken image</title><img src="data:image/png;base64,aW52YWxpZA==" alt="Synthetic invalid image">',
    }),
  );
  await expect(
    navigateApp(page, "/navigation-image-fixture"),
  ).rejects.toThrow();
  await navigateApp(page, "/en/");
  await expect(page.locator("#generate")).toBeEnabled();
  expect(
    await page.evaluate(() =>
      document.documentElement.hasAttribute("data-test-navigation-pending"),
    ),
  ).toBe(false);
});
