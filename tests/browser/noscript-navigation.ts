import type { Browser } from "@playwright/test";
import { navigateNoScript } from "./navigation.ts";

export async function withNoScriptNavigation(
  browser: Browser,
  inspect: () => Promise<void>,
): Promise<void> {
  const original = browser.newContext.bind(browser);
  browser.newContext = async (options) => {
    const context = await original(options);
    if (options?.javaScriptEnabled === false) {
      const createPage = context.newPage.bind(context);
      context.newPage = async () => {
        const page = await createPage();
        page.goto = async (url, navigationOptions) => {
          if (navigationOptions !== undefined)
            throw new Error("Unsupported no-script navigation options");
          return navigateNoScript(page, url);
        };
        return page;
      };
    }
    return context;
  };
  try {
    await inspect();
  } finally {
    browser.newContext = original;
  }
}
