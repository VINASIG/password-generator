import {
  Wordlist,
  generate,
  verifyWordlist,
} from "./vendor/vietphrase/index.ts";
import { uniformIndex, secureUint32 } from "./vendor/vietphrase/internal.ts";
import { floorBits } from "./random.ts";

export type ListSource = {
  readonly id: "eff" | "experimental-agent-vi" | "experimental-agent-ascii";
  readonly text: string;
  readonly sha256: string;
  readonly count: number;
};
export type VerifiedList = {
  readonly id: ListSource["id"];
  readonly tokens: readonly string[];
  readonly native: Wordlist | null;
  readonly sha256: string;
  readonly maxCodepoints: number;
  readonly maxBytes: number;
};

export async function prepareList(input: ListSource): Promise<VerifiedList> {
  const source = Object.freeze({ ...input });
  if (
    !["eff", "experimental-agent-vi", "experimental-agent-ascii"].includes(
      source.id,
    ) ||
    !/^[a-f0-9]{64}$/.test(source.sha256) ||
    source.text.length > 1024 * 1024
  )
    throw new Error("INVALID_LIST_SOURCE");
  const encoder = new TextEncoder();
  const bytes = encoder.encode(source.text);
  let native: Wordlist | null = null;
  let tokens: readonly string[];
  if (source.id !== "eff") {
    native = await verifyWordlist(bytes, source.sha256);
    tokens = native.tokens;
  } else {
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    const actual = Array.from(new Uint8Array(hash), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    if (
      actual !== source.sha256 ||
      !source.text.endsWith("\n") ||
      source.text.includes("\r")
    )
      throw new Error("LIST_INTEGRITY_FAILURE");
    tokens = Object.freeze(source.text.slice(0, -1).split("\n"));
    if (
      tokens.some(
        (word) => !/^[a-z]+(?:-[a-z]+)*$/.test(word) || word.length > 128,
      ) ||
      new Set(tokens).size !== tokens.length
    )
      throw new Error("INVALID_ENGLISH_LIST");
  }
  if (
    tokens.length !== source.count ||
    tokens.length < 2 ||
    tokens.length > 65536
  )
    throw new Error("INVALID_LIST_COUNT");
  let maxCodepoints = 0;
  let maxBytes = 0;
  for (const token of tokens) {
    maxCodepoints = Math.max(maxCodepoints, Array.from(token).length);
    maxBytes = Math.max(maxBytes, encoder.encode(token).length);
  }
  return Object.freeze({
    id: source.id,
    tokens,
    native,
    sha256: source.sha256,
    maxCodepoints,
    maxBytes,
  });
}

export function phrasePlan(
  list: VerifiedList,
  words: number,
  separator: string,
): { outcomes: bigint; bits: number; maxCodepoints: number; maxBytes: number } {
  if (
    !Number.isSafeInteger(words) ||
    words < 1 ||
    words > 20 ||
    !["-", " ", "."].includes(separator) ||
    list.tokens.length < 2 ||
    !hasUniqueBoundaries(list.tokens, separator)
  )
    throw new RangeError("INVALID_PHRASE_PARAMETERS");
  const outcomes = BigInt(list.tokens.length) ** BigInt(words);
  return {
    outcomes,
    bits: floorBits(outcomes),
    maxCodepoints: words * list.maxCodepoints + words - 1,
    maxBytes: words * list.maxBytes + words - 1,
  };
}

function hasUniqueBoundaries(
  tokens: readonly string[],
  separator: string,
): boolean {
  if (separator !== "-")
    return tokens.every((token) => !token.includes(separator));
  // The codewords token + delimiter must be prefix-free, including compound spellings.
  const vocabulary = new Set(tokens);
  return tokens.every((token) => {
    for (
      let index = token.indexOf("-");
      index >= 0;
      index = token.indexOf("-", index + 1)
    )
      if (vocabulary.has(token.slice(0, index))) return false;
    return true;
  });
}

export function generatePhrase(
  list: VerifiedList,
  words: number,
  separator: string,
): string {
  phrasePlan(list, words, separator);
  if (list.native !== null)
    return generate(list.native, { words, separator }).passphrase;
  return Array.from({ length: words }, () => {
    const token = list.tokens[uniformIndex(list.tokens.length, secureUint32)];
    if (token === undefined) throw new Error("INVALID_WORD_INDEX");
    return token;
  }).join(separator);
}
