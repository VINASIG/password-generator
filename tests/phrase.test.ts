import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { prepareList, phrasePlan } from "../src/phrase.ts";
import type { ListSource } from "../src/phrase.ts";
import {
  parseWordlist,
  verifyWordlist,
} from "../src/vendor/vietphrase/index.ts";

const digest = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
const paths = {
  eff: "eff-long.txt",
  "experimental-agent-vi": "experimental-agent-vi.txt",
  "experimental-agent-ascii": "experimental-agent-ascii.txt",
} as const;
void test("pinned lists have exactly the reviewed sizes, unique NFC tokens and unambiguous rendering", async () => {
  for (const [id, path] of Object.entries(paths)) {
    const text = readFileSync(`data/lists/${path}`, "utf8");
    const count = id === "eff" ? 7776 : id.endsWith("-vi") ? 2966 : 2389;
    const list = await prepareList({
      id: id as ListSource["id"],
      text,
      sha256: digest(text),
      count,
    });
    assert.equal(list.tokens.length, count);
    assert.equal(new Set(list.tokens).size, count);
    assert.ok(list.tokens.every((token) => token === token.normalize("NFC")));
    for (const separator of ["-", " ", "."])
      for (const words of [4, 7, 20]) {
        const plan = phrasePlan(list, words, separator);
        const exact = BigInt(count) ** BigInt(words);
        const maximumCodepoints = id === "eff" ? 9 : 13;
        const maximumBytes = id === "eff" ? 9 : id.endsWith("-vi") ? 18 : 13;
        assert.equal(plan.maxCodepoints, words * maximumCodepoints + words - 1);
        assert.equal(plan.maxBytes, words * maximumBytes + words - 1);
        assert.equal(plan.outcomes, exact);
        assert.ok(
          1n << BigInt(plan.bits) <= exact &&
            exact < 1n << BigInt(plan.bits + 1),
        );
        const example = [
          list.tokens[0],
          list.tokens[0],
          list.tokens[count - 1],
        ].join(separator);
        assert.deepEqual(example.split(separator), [
          list.tokens[0],
          list.tokens[0],
          list.tokens[count - 1],
        ]);
      }
    assert.throws(() => phrasePlan(list, 7, "_"));
    assert.throws(() => phrasePlan(list, 21, " "));
    if (id === "eff")
      assert.deepEqual(
        list.tokens.filter((token) => token.includes("-")),
        ["drop-down", "felt-tip", "t-shirt", "yo-yo"],
      );
  }
});
void test("hyphen codewords decode uniquely, and ambiguous prefix vocabularies fail closed", async () => {
  const text = readFileSync("data/lists/eff-long.txt", "utf8");
  const list = await prepareList({
    id: "eff",
    text,
    sha256: digest(text),
    count: 7776,
  });
  const dictionary = new Set(list.tokens);
  const decode = (value: string): string[] => {
    const output: string[] = [];
    let accumulated = "";
    for (const part of value.split("-")) {
      accumulated += (accumulated ? "-" : "") + part;
      if (dictionary.has(accumulated)) {
        output.push(accumulated);
        accumulated = "";
      }
    }
    assert.equal(accumulated, "");
    return output;
  };
  for (const compound of ["drop-down", "felt-tip", "t-shirt", "yo-yo"])
    for (const other of list.tokens) {
      const tokens = [other, compound, other, compound];
      assert.deepEqual(decode(tokens.join("-")), tokens);
    }
  const fixture = "a\na-b\nb-a\n";
  const ambiguous = await prepareList({
    id: "eff",
    text: fixture,
    sha256: digest(fixture),
    count: 3,
  });
  assert.equal(["a-b", "a"].join("-"), ["a", "b-a"].join("-"));
  assert.throws(
    () => phrasePlan(ambiguous, 2, "-"),
    /INVALID_PHRASE_PARAMETERS/,
  );
  assert.equal(phrasePlan(ambiguous, 2, " ").outcomes, 9n);
});
void test("list verification snapshots source text before an asynchronous digest completes", async () => {
  const original = "apple\nbanana\n";
  const source = {
    id: "eff" as const,
    text: original,
    sha256: digest(original),
    count: 2,
  };
  const pending = prepareList(source);
  source.text = "cherry\norange\n";
  const verified = await pending;
  assert.deepEqual(verified.tokens, ["apple", "banana"]);
  assert.equal(verified.sha256, digest(original));
});
void test("corrupted bytes, incorrect pins and count mismatch lock list loading", async () => {
  const text = "apple\nbanana\n";
  const source: ListSource = {
    id: "eff",
    text,
    sha256: digest(text),
    count: 2,
  };
  await assert.rejects(prepareList({ ...source, text: "appla\nbanana\n" }));
  await assert.rejects(prepareList({ ...source, sha256: "0".repeat(64) }));
  await assert.rejects(prepareList({ ...source, count: 3 }));
  for (const malformed of [
    "apple\nbanana",
    "apple\r\nbanana\r\n",
    "\ufeffapple\nbanana\n",
    "apple\napple\n",
    "Apple\nbanana\n",
    "apple\nban ana\n",
    "apple\n<script>\n",
  ])
    await assert.rejects(
      prepareList({ ...source, text: malformed, sha256: digest(malformed) }),
    );
});
void test("Vietnamese Unicode adversarial fixtures reject invisible, mixed-script, decomposed and ill-formed content", async () => {
  for (const token of [
    "\ufeffbàn",
    "ba\u200bn",
    "ba\u200dn",
    "bàn\u2066",
    "bàn\u202e",
    "bàn",
    "bаn",
    "ban\u0000",
    "_bàn",
    "bàn_",
    "bàn__ăn",
    "Bàn",
    "\ud800",
  ]) {
    assert.throws(() => parseWordlist(`${token}\nhoa\n`), token);
  }
  const malformed = Uint8Array.from([0xc3, 0x28, 0x0a, 0x61, 0x0a]);
  await assert.rejects(
    verifyWordlist(malformed, digest(malformed)),
    /encoded data/,
  );
  const bytes = new TextEncoder().encode("bàn\nhoa\n");
  const pending = verifyWordlist(bytes, digest(bytes));
  bytes.fill(0);
  assert.equal((await pending).at(0), "bàn");
});
void test("ASCII profile deduplicates before sampling and is not a post-generation transformation", () => {
  const ascii = readFileSync("data/lists/experimental-agent-ascii.txt", "utf8")
    .trimEnd()
    .split("\n");
  assert.equal(new Set(ascii).size, 2389);
  assert.ok(ascii.every((token) => /^[a-z]+(?:_[a-z]+)*$/.test(token)));
  const unicode = readFileSync("data/lists/experimental-agent-vi.txt", "utf8")
    .trimEnd()
    .split("\n");
  const fold = (value: string): string =>
    value.normalize("NFD").replace(/\p{M}/gu, "").replaceAll("đ", "d");
  assert.ok(new Set(unicode.map(fold)).size < unicode.length);
  assert.equal(ascii.length, new Set(unicode.map(fold)).size);
});
