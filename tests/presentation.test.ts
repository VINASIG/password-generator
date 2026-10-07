import { test } from "node:test";
import assert from "node:assert/strict";
import {
  boundedCount,
  scrambleFrame,
  maskSecret,
  selectedSecret,
} from "../src/presentation.ts";

void test("mask lengths and copied selections preserve Unicode codepoints without copying bullets", () => {
  for (const secret of [
    "12345678",
    "x".repeat(128),
    "bánh_mì-🌙-mặt_trời",
    "a\u0301",
  ])
    assert.equal(maskSecret(secret).length, Array.from(secret).length);
  const secret = "a🌙bánh_mì";
  assert.equal(selectedSecret(secret, 1, 2, true), "🌙");
  assert.equal(selectedSecret(secret, 1, 3, false), "🌙");
  assert.equal(selectedSecret(secret, 2, 6, true), "bánh");
  assert.equal(
    selectedSecret(secret, 0, maskSecret(secret).length, true),
    secret,
  );
  assert.equal(selectedSecret(secret, 3, 3, true), "");
});

void test("count bounds reject malformed and incomplete input instead of choosing another policy", () => {
  for (const text of [
    "",
    " ",
    "7.5",
    "1e1",
    "-8",
    "NaN",
    "Infinity",
    "７",
    "2000",
    "3",
    "21",
  ])
    assert.equal(boundedCount(text, 4, 20), null, text);
  for (const count of [4, 7, 20])
    assert.equal(boundedCount(String(count), 4, 20), count);
});

void test("scramble preserves Unicode codepoints and delimiters, while the finished frame is exact", () => {
  const secret = "bánh_mì-công_viên.mặt trời";
  const first = scrambleFrame(secret, 0);
  assert.equal(Array.from(first).length, Array.from(secret).length);
  assert.match(first, /^[A-HJ-NP-Z2-9_ .-]+$/);
  const source = Array.from(secret);
  const halfway = Array.from(scrambleFrame(secret, 0.5));
  assert.deepEqual(
    halfway.slice(0, Math.floor(source.length / 2)),
    source.slice(0, Math.floor(source.length / 2)),
  );
  assert.equal(scrambleFrame(secret, 1), secret);
});
