import { test } from "@playwright/test";
import { checkSharedPreferences } from "../../.vinasig/standards/templates/web/shared-preferences.mjs";
import { withNoScriptNavigation } from "./noscript-navigation.ts";
test("shared ecosystem preferences preserve local work", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(120000);
  if (!baseURL) throw new Error("Missing built-site URL");
  await withNoScriptNavigation(browser, () =>
    checkSharedPreferences(browser, baseURL),
  );
});
