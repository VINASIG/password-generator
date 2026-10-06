import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32, zip } from "../scripts/zip.ts";

void test("CRC matches the standard vector, ZIP entries are ordered and container metadata is deterministic", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
  const a = { name: "a.txt", bytes: Buffer.from("a") };
  const b = { name: "b.txt", bytes: Buffer.from("b") };
  assert.deepEqual(zip([a, b]), zip([b, a]));
  const archive = zip([a]);
  assert.equal(archive.readUInt32LE(0), 0x04034b50);
  assert.equal(archive.readUInt32LE(archive.length - 22), 0x06054b50);
  assert.equal(archive.readUInt16LE(archive.length - 14), 1);
  assert.equal(archive.readUInt32LE(14), crc32(a.bytes));
  assert.throws(() => zip([{ name: "../secret", bytes: Buffer.alloc(0) }]));
  assert.throws(() => zip([a, a]));
});
