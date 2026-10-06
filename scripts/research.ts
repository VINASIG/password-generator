import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";

function strings(alphabet: string, length: number): string[] {
  let values = [""];
  for (let index = 0; index < length; index++)
    values = values.flatMap((prefix) =>
      Array.from(alphabet, (char) => prefix + char),
    );
  return values;
}
function permutations(values: readonly string[]): string[][] {
  return values.length === 0
    ? [[]]
    : values.flatMap((value, index) =>
        permutations(values.filter((_, other) => index !== other)).map(
          (tail) => [value, ...tail],
        ),
      );
}
const frequency = new Map<string, number>();
for (const lower of "ab")
  for (const digit of "01")
    for (const tail of strings("ab01", 2))
      for (const order of permutations([lower, digit, ...Array.from(tail)])) {
        const value = order.join("");
        frequency.set(value, (frequency.get(value) ?? 0) + 1);
      }
const histogram: Record<string, number> = {};
for (const count of frequency.values())
  histogram[String(count)] = (histogram[String(count)] ?? 0) + 1;
const wordlists = [
  "eff-long",
  "experimental-agent-vi",
  "experimental-agent-ascii",
].map((name) => {
  const bytes = readFileSync(`data/lists/${name}.txt`);
  const tokens = bytes.toString("utf8").slice(0, -1).split("\n");
  return {
    name,
    count: tokens.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    defaultSevenWordBitsRoundedDown:
      (BigInt(tokens.length) ** 7n).toString(2).length - 1,
    wordsFor80: Math.ceil(80 / Math.log2(tokens.length)),
    wordsFor128: Math.ceil(128 / Math.log2(tokens.length)),
    maxCodepoints: tokens.reduce(
      (maximum, token) => Math.max(maximum, Array.from(token).length),
      0,
    ),
    maxUtf8Bytes: tokens.reduce(
      (maximum, token) => Math.max(maximum, Buffer.byteLength(token)),
      0,
    ),
    containsSpace: tokens.some((token) => token.includes(" ")),
    containsPeriod: tokens.some((token) => token.includes(".")),
    hyphenatedTokens: tokens.filter((token) => token.includes("-")),
  };
});
const report = {
  schema: 1,
  evidenceClass:
    "implementation-independent automated enumeration authored within this project",
  naiveInsertThenShuffle: {
    alphabet: ["ab", "01"],
    length: 4,
    equallyLikelyDecisionPaths: Array.from(frequency.values()).reduce(
      (sum, count) => sum + count,
      0,
    ),
    validOutcomes: frequency.size,
    pathMultiplicityHistogram: histogram,
    maxProbabilityOverMin:
      Math.max(...frequency.values()) / Math.min(...frequency.values()),
  },
  uniformSelectionOracle: {
    validStrings: strings("ab01", 4).filter(
      (value) => /[ab]/.test(value) && /[01]/.test(value),
    ).length,
    multiplicityPerRank: 1,
  },
  wordlists,
  humanRecall: "NOT_RUN",
  humanTypingError: "NOT_RUN",
  thirdPartySecurityReview: "NOT_RUN",
  productionValidation: "NOT_RUN",
};
mkdirSync("docs/research", { recursive: true });
writeFileSync(
  "docs/research/measurements.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  "PASS recomputed separately implemented enumerations and source measurements",
);
