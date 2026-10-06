import { test } from "node:test";
import assert from "node:assert/strict";
import { validateCss } from "../scripts/check-css.ts";

void test("CSS gate checks syntax and property grammar, with custom variables left to browser computed-style checks", () => {
  validateCss(
    "a { color: #21497b; padding: 1rem; --tone: red; border: 1px solid var(--tone); }",
  );
  for (const css of [
    "a { color: banana; }",
    "a { paddding: 1rem; }",
    "a { padding: red; }",
    "a { color: #12x; }",
    "a { padding: 1rem; } }",
  ])
    assert.throws(() => {
      validateCss(css);
    }, css);
});
