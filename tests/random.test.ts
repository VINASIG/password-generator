import { test } from "node:test";
import assert from "node:assert/strict";
import { uniformBelow, floorBits } from "../src/random.ts";
import {
  uniformIndex,
  UINT32_RANGE,
} from "../src/vendor/vietphrase/internal.ts";

void test("exhaustive one-byte inputs give equal accepted multiplicities for every bound 2 through 256", () => {
  for (let bound = 2; bound <= 256; bound++) {
    const counts = Array<number>(bound).fill(0);
    for (let value = 0; value < 256; value++) {
      try {
        const result = Number(
          uniformBelow(BigInt(bound), (bytes) => {
            bytes.fill(value);
          }),
        );
        counts[result] = (counts[result] ?? 0) + 1;
      } catch (error) {
        assert.match(String(error), /REJECTION_LIMIT/);
      }
    }
    assert.ok((counts[0] ?? 0) > 0);
    assert.equal(new Set(counts).size, 1, `bound ${bound}`);
  }
});
void test("large ranks, power boundaries, rejection followed by acceptance and one-outcome plan", () => {
  for (const exponent of [8, 32, 53, 128, 512, 1024]) {
    const power = 1n << BigInt(exponent);
    assert.equal(
      uniformBelow(power, (bytes) => {
        bytes.fill(255);
      }),
      power - 1n,
    );
    let calls = 0;
    assert.equal(
      uniformBelow(power - 1n, (bytes) => {
        bytes.fill(calls++ === 0 ? 255 : 0);
      }),
      0n,
    );
    assert.equal(calls, 2);
  }
  assert.equal(
    uniformBelow(1n, () => {
      throw new Error("must not draw");
    }),
    0n,
  );
});
void test("invalid bounds and failing or pathological sources fail with bounded work and zero temporary bytes", () => {
  for (const bound of [0n, -1n, 1n << 2048n])
    assert.throws(() => uniformBelow(bound));
  let buffer: Uint8Array | undefined;
  let calls = 0;
  assert.throws(
    () =>
      uniformBelow(129n, (bytes) => {
        buffer = bytes;
        calls++;
        bytes.fill(255);
      }),
    /REJECTION_LIMIT/,
  );
  assert.equal(calls, 128);
  assert.deepEqual(Array.from(buffer ?? []), [0]);
  assert.throws(
    () =>
      uniformBelow(1000n, (bytes) => {
        buffer = bytes;
        bytes.fill(170);
        throw new Error("provider failed");
      }),
    /provider failed/,
  );
  assert.deepEqual(Array.from(buffer ?? []), [0, 0]);
});
void test("whole bit count is an exact lower bound, without floating point around huge powers", () => {
  for (let exponent = 1; exponent < 2048; exponent += 17) {
    const power = 1n << BigInt(exponent);
    assert.equal(floorBits(power), exponent);
    assert.equal(floorBits(power - 1n), exponent - 1);
    assert.equal(floorBits(power + 1n), exponent);
  }
  assert.throws(() => floorBits(0n));
});
void test("vendored 32-bit index sampler accepts equal-size buckets and rejects remainder and malformed draws", () => {
  for (const size of [2, 3, 2966, 2389, 7776, 65536]) {
    const limit = UINT32_RANGE - (UINT32_RANGE % size);
    for (const bucket of [0, 1, Math.floor(limit / size) - 1]) {
      for (const index of [0, size - 1])
        assert.equal(
          uniformIndex(size, () => bucket * size + index),
          index,
        );
    }
    if (limit < UINT32_RANGE) {
      let draws = 0;
      assert.equal(
        uniformIndex(size, () => (draws++ === 0 ? limit : size - 1)),
        size - 1,
      );
      assert.equal(draws, 2);
      assert.throws(
        () => uniformIndex(size, () => UINT32_RANGE - 1),
        /rejection limit/,
      );
    }
  }
  for (const value of [-1, 0.5, NaN, Infinity, UINT32_RANGE])
    assert.throws(() => uniformIndex(7776, () => value));
});
