import { test } from "@playwright/test";
import { checkSharedPreferences } from "../../.vinasig/standards/templates/web/shared-preferences.mjs";
test("shared ecosystem preferences preserve local work", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(120000);
  if (!baseURL) throw new Error("Missing built-site URL");
  await checkSharedPreferences(browser, baseURL);
});
