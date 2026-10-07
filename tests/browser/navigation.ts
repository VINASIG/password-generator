import { expect, test, type Page, type Response } from "@playwright/test";

export async function navigateApp(page: Page, path: string): Promise<void> {
  const destination = new URL(path, String(test.info().project.use.baseURL))
    .href;
  expect(new URL(destination).protocol).toMatch(/^https?:$/);
  const responses: Response[] = [];
  const inspect = (response: Response): void => {
    if (
      response.url() === destination &&
      response.request().isNavigationRequest() &&
      response.frame() === page.mainFrame()
    )
      responses.push(response);
  };
  page.on("response", inspect);
  try {
    await page.evaluate((url) => {
      document.documentElement.setAttribute("data-test-navigation-pending", "");
      location.assign(url);
    }, destination);
    await page.waitForFunction(
      (url) =>
        location.href === url &&
        !document.documentElement.hasAttribute(
          "data-test-navigation-pending",
        ) &&
        document.readyState === "complete",
      destination,
    );
    if (destination.startsWith("http")) {
      await expect.poll(() => responses.length).toBeGreaterThan(0);
      expect(responses.at(-1)?.status()).toBe(200);
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (image) => image.decode()));
    });
  } finally {
    page.off("response", inspect);
  }
}
