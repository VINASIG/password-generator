import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  releaseIdentity,
  compareReleaseDirectories,
  verifyReleaseChecksums,
} from "../scripts/release-metadata.ts";

void test("future release tags cannot reuse another version's notes", () => {
  assert.equal(
    releaseIdentity("0.1.0", "v0.1.0", "# v0.1.0\nresearch preview").notes,
    "docs/releases/v0.1.0.md",
  );
  assert.throws(() =>
    releaseIdentity("0.1.1", "v0.1.0", "# v0.1.0\nresearch preview"),
  );
  assert.throws(() =>
    releaseIdentity("0.1.1", "v0.1.1", "# v0.1.0\nresearch preview"),
  );
  assert.throws(() =>
    releaseIdentity("0.1.0", "v0.1.0", "# v0.1.0\nproduction proven"),
  );
});
void test("release comparison refuses missing, changed and unchecksummed artifacts", () => {
  const root = resolve("output/release-fixtures");
  mkdirSync(root, { recursive: true });
  const first = mkdtempSync(join(root, "a-"));
  const second = mkdtempSync(join(root, "b-"));
  const names = [
    "preview-source.zip",
    "preview-offline.zip",
    "build-record.json",
  ];
  for (const name of names) writeFileSync(join(first, name), name);
  const hashes = names
    .map(
      (name) => `${createHash("sha256").update(name).digest("hex")}  ${name}`,
    )
    .join("\n");
  writeFileSync(join(first, "SHA256SUMS.txt"), `${hashes}\n`);
  cpSync(first, second, { recursive: true });
  compareReleaseDirectories(first, second);
  verifyReleaseChecksums(first);
  writeFileSync(join(second, names[0] ?? "bad.zip"), "corrupt");
  assert.throws(() => {
    compareReleaseDirectories(first, second);
  });
  assert.throws(() => {
    verifyReleaseChecksums(second);
  });
  writeFileSync(join(first, "extra.zip"), "not covered");
  assert.throws(() => {
    verifyReleaseChecksums(first);
  });
});
