import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CHARACTER_GROUPS,
  planAlphabet,
  planPassword,
  unrankPassword,
  generatePassword,
} from "../src/password.ts";
import type { PasswordOptions } from "../src/password.ts";

function enumerate(alphabet: string, length: number): string[] {
  let values = [""];
  for (let position = 0; position < length; position++)
    values = values.flatMap((prefix) =>
      Array.from(alphabet, (char) => prefix + char),
    );
  return values;
}
function inclusionExclusion(sizes: readonly number[], length: number): bigint {
  let total = 0n;
  for (let mask = 0; mask < 2 ** sizes.length; mask++) {
    const excluded = sizes.filter((_, index) => (mask & (2 ** index)) !== 0);
    const remaining =
      sizes.reduce((sum, size) => sum + size, 0) -
      excluded.reduce((sum, size) => sum + size, 0);
    total +=
      (excluded.length % 2 === 0 ? 1n : -1n) *
      BigInt(remaining) ** BigInt(length);
  }
  return total;
}
void test("every rank maps bijectively onto an independently enumerated set of valid passwords", () => {
  for (const groups of [
    ["ab", "01"],
    ["a", "b", "01"],
    ["a", "b", "0", "1"],
  ]) {
    for (let length = groups.length; length <= 6; length++) {
      for (const requireEach of [false, true]) {
        const expected = enumerate(groups.join(""), length).filter(
          (value) =>
            !requireEach ||
            groups.every((group) =>
              Array.from(group).some((char) => value.includes(char)),
            ),
        );
        const plan = planAlphabet(groups, length, requireEach);
        assert.equal(plan.outcomes, BigInt(expected.length));
        const actual = Array.from({ length: expected.length }, (_, rank) =>
          unrankPassword(plan, BigInt(rank)),
        );
        assert.equal(new Set(actual).size, expected.length);
        assert.deepEqual(actual.sort(), expected.sort());
      }
    }
  }
});
void test("full production alphabet, all subsets and lengths agree with a separate inclusion-exclusion oracle", () => {
  const groups = Object.values(CHARACTER_GROUPS);
  assert.equal(new Set(groups.join("")).size, 94);
  assert.deepEqual(
    Array.from(groups.join("")).sort(),
    Array.from({ length: 94 }, (_, index) =>
      String.fromCharCode(33 + index),
    ).sort(),
  );
  for (let mask = 1; mask < 16; mask++) {
    const selected = groups.filter((_, index) => (mask & (1 << index)) !== 0);
    for (const length of [8, 15, 20, 64, 128]) {
      assert.equal(
        planAlphabet(selected, length, true).outcomes,
        inclusionExclusion(
          selected.map((group) => group.length),
          length,
        ),
      );
      assert.equal(
        planAlphabet(selected, length, false).outcomes,
        BigInt(selected.join("").length) ** BigInt(length),
      );
    }
  }
});
const base: PasswordOptions = {
  length: 20,
  groups: ["lower", "upper", "digits", "symbols"],
  requireEach: false,
  exclude: "",
  avoidAmbiguous: false,
};
void test("exclusions operate before sampling, requirements remain exact and repeated characters are allowed", () => {
  const plan = planPassword({ ...base, avoidAmbiguous: true, exclude: "xyz!" });
  for (const char of "Il1O0oxyz!")
    assert.ok(!plan.groups.join("").includes(char));
  assert.equal(plan.outcomes, BigInt(plan.alphabetSize) ** 20n);
  assert.equal(
    generatePassword(planPassword({ ...base, groups: ["lower"] }), (bytes) => {
      bytes.fill(0);
    }),
    "a".repeat(20),
  );
  const constrained = planPassword({ ...base, requireEach: true });
  for (const rank of [
    0n,
    constrained.outcomes / 2n,
    constrained.outcomes - 1n,
  ]) {
    const value = unrankPassword(constrained, rank);
    assert.equal(value.length, 20);
    assert.ok(
      Object.values(CHARACTER_GROUPS).every((group) =>
        Array.from(value).some((char) => group.includes(char)),
      ),
    );
  }
});
void test("malformed and impossible settings fail rather than weakening the policy or returning an old result", () => {
  for (const length of [-1, 0, 129, 1.5, Infinity, NaN])
    assert.throws(() => planPassword({ ...base, length }));
  for (const exclude of [
    " ",
    "\n",
    "é",
    "\u200b",
    "\u0000",
    "\ud800",
    "x".repeat(95),
  ])
    assert.throws(() => planPassword({ ...base, exclude }));
  assert.throws(() => planPassword({ ...base, groups: [] }));
  assert.throws(() => planPassword({ ...base, groups: ["lower", "lower"] }));
  assert.throws(() =>
    planPassword({
      ...base,
      groups: ["digits"],
      exclude: CHARACTER_GROUPS.digits,
    }),
  );
  assert.throws(() => planAlphabet(["ab", "bc"], 3, false));
  assert.throws(() => planAlphabet(["a", "0"], 1, true));
  const plan = planPassword(base);
  assert.throws(() => unrankPassword(plan, -1n));
  assert.throws(() => unrankPassword(plan, plan.outcomes));
  assert.throws(
    () =>
      generatePassword(plan, () => {
        throw new Error("failed CSPRNG");
      }),
    /failed CSPRNG/,
  );
});
void test("inserting required characters then shuffling can produce unequal outcome probabilities", () => {
  const frequencies = new Map<string, number>();
  const permute = (values: readonly string[]): string[][] =>
    values.length === 0
      ? [[]]
      : values.flatMap((value, index) =>
          permute(values.filter((_, other) => index !== other)).map((tail) => [
            value,
            ...tail,
          ]),
        );
  for (const a of "ab")
    for (const b of "01")
      for (const tail of enumerate("ab01", 2))
        for (const shuffled of permute([a, b, ...Array.from(tail)])) {
          const value = shuffled.join("");
          frequencies.set(value, (frequencies.get(value) ?? 0) + 1);
        }
  assert.equal(frequencies.size, 224);
  assert.equal(
    Array.from(frequencies.values()).reduce((sum, count) => sum + count, 0),
    1536,
  );
  assert.deepEqual(
    Array.from(new Set(frequencies.values())).sort((a, b) => a - b),
    [6, 8],
  );
  assert.equal(planAlphabet(["ab", "01"], 4, true).outcomes, 224n);
});
