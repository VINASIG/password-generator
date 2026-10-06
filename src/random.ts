export type RandomFill = (bytes: Uint8Array<ArrayBuffer>) => void;

export const systemRandom: RandomFill = (bytes) => {
  const provider = (globalThis as { crypto?: Crypto }).crypto;
  if (typeof provider?.getRandomValues !== "function") {
    throw new Error("SECURE_RANDOM_UNAVAILABLE");
  }
  provider.getRandomValues(bytes);
};

export function uniformBelow(
  bound: bigint,
  fill: RandomFill = systemRandom,
): bigint {
  if (bound < 1n || bound.toString(2).length > 2048) {
    throw new RangeError("INVALID_RANDOM_BOUND");
  }
  if (bound === 1n) return 0n;
  const bits = (bound - 1n).toString(2).length;
  const bytes = new Uint8Array(Math.ceil(bits / 8));
  const mask = 0xff >>> (bytes.length * 8 - bits);
  try {
    for (let attempt = 0; attempt < 128; attempt++) {
      fill(bytes);
      bytes[0] = (bytes[0] ?? 0) & mask;
      let value = 0n;
      for (const byte of bytes) value = (value << 8n) | BigInt(byte);
      if (value < bound) return value;
    }
    throw new Error("RANDOM_REJECTION_LIMIT");
  } finally {
    bytes.fill(0);
  }
}

export function floorBits(count: bigint): number {
  if (count < 1n) throw new RangeError("EMPTY_SAMPLE_SPACE");
  return count.toString(2).length - 1;
}
