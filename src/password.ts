import { floorBits, systemRandom, uniformBelow } from "./random.ts";
import type { RandomFill } from "./random.ts";

export const CHARACTER_GROUPS = Object.freeze({
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
});
export type CharacterGroup = keyof typeof CHARACTER_GROUPS;
export type PasswordOptions = {
  readonly length: number;
  readonly groups: readonly CharacterGroup[];
  readonly requireEach: boolean;
  readonly exclude: string;
  readonly avoidAmbiguous: boolean;
};
export type PasswordPlan = {
  readonly length: number;
  readonly groups: readonly string[];
  readonly requiredMask: number;
  readonly ways: readonly (readonly bigint[])[];
  readonly outcomes: bigint;
  readonly bits: number;
  readonly alphabetSize: number;
};

export function planAlphabet(
  groups: readonly string[],
  length: number,
  requireEach: boolean,
): PasswordPlan {
  if (
    !Number.isSafeInteger(length) ||
    length < 1 ||
    length > 128 ||
    groups.length < 1 ||
    groups.length > 4 ||
    typeof requireEach !== "boolean"
  ) {
    throw new RangeError("INVALID_PASSWORD_PARAMETERS");
  }
  const snapshot = Array.from(groups);
  const alphabet = snapshot.join("");
  if (
    snapshot.some((group) => group.length < 1) ||
    alphabet.length > 94 ||
    !/^[!-~]+$/.test(alphabet) ||
    new Set(alphabet).size !== alphabet.length
  ) {
    throw new RangeError("INVALID_ALPHABET");
  }
  const states = 1 << snapshot.length;
  const ways: bigint[][] = [
    Array.from({ length: states }, (_, mask) => (mask === 0 ? 1n : 0n)),
  ];
  for (let remaining = 1; remaining <= length; remaining++) {
    const previous = ways[remaining - 1];
    if (previous === undefined) throw new Error("INVALID_COUNT_TABLE");
    ways.push(
      Array.from({ length: states }, (_, mask) =>
        snapshot.reduce(
          (total, group, index) =>
            total +
            BigInt(group.length) * (previous[mask & ~(1 << index)] ?? 0n),
          0n,
        ),
      ),
    );
  }
  const requiredMask = requireEach ? states - 1 : 0;
  const outcomes = ways[length]?.[requiredMask];
  if (outcomes === undefined || outcomes === 0n)
    throw new RangeError("IMPOSSIBLE_PASSWORD_POLICY");
  return Object.freeze({
    length,
    groups: Object.freeze(snapshot),
    requiredMask,
    ways: Object.freeze(ways.map((row) => Object.freeze(row))),
    outcomes,
    bits: floorBits(outcomes),
    alphabetSize: alphabet.length,
  });
}

export function planPassword(options: PasswordOptions): PasswordPlan {
  if (
    typeof options.exclude !== "string" ||
    options.exclude.length > 94 ||
    !/^[!-~]*$/.test(options.exclude) ||
    typeof options.avoidAmbiguous !== "boolean" ||
    options.groups.length === 0 ||
    new Set(options.groups).size !== options.groups.length
  ) {
    throw new RangeError("INVALID_PASSWORD_OPTIONS");
  }
  const excluded = new Set(
    options.exclude + (options.avoidAmbiguous ? "Il1O0o" : ""),
  );
  const groups = options.groups.map((name) => {
    if (!Object.hasOwn(CHARACTER_GROUPS, name))
      throw new RangeError("INVALID_CHARACTER_GROUP");
    const chars = Array.from(CHARACTER_GROUPS[name])
      .filter((char) => !excluded.has(char))
      .join("");
    if (chars.length === 0) throw new RangeError("EMPTY_CHARACTER_GROUP");
    return chars;
  });
  return planAlphabet(groups, options.length, options.requireEach);
}

export function unrankPassword(plan: PasswordPlan, rank: bigint): string {
  if (rank < 0n || rank >= plan.outcomes)
    throw new RangeError("INVALID_PASSWORD_RANK");
  let mask = plan.requiredMask;
  let result = "";
  for (let remaining = plan.length; remaining > 0; remaining--) {
    let selected = false;
    for (
      let groupIndex = 0;
      groupIndex < plan.groups.length && !selected;
      groupIndex++
    ) {
      const nextMask = mask & ~(1 << groupIndex);
      const weight = plan.ways[remaining - 1]?.[nextMask];
      const group = plan.groups[groupIndex];
      if (weight === undefined || group === undefined)
        throw new Error("INVALID_COUNT_TABLE");
      for (const char of group) {
        if (rank < weight) {
          result += char;
          mask = nextMask;
          selected = true;
          break;
        }
        rank -= weight;
      }
    }
    if (!selected) throw new Error("INVALID_PASSWORD_RANK");
  }
  return result;
}

export function generatePassword(
  plan: PasswordPlan,
  fill: RandomFill = systemRandom,
): string {
  return unrankPassword(plan, uniformBelow(plan.outcomes, fill));
}
