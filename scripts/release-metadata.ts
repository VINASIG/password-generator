import assert from "node:assert/strict";
import { readFileSync, readdirSync, appendFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

export function releaseIdentity(
  version: string,
  tag: string,
  notes: string,
): { tag: string; title: string; notes: string } {
  assert.match(version, /^0\.\d+\.\d+$/);
  assert.equal(tag, `v${version}`, "Tag must match the exact package version");
  assert.equal(
    notes.split(/\r?\n/)[0],
    `# ${tag}`,
    "Release notes must match this exact tag",
  );
  assert.ok(
    notes.includes("research preview"),
    "Evidence level is required in release notes",
  );
  return {
    tag,
    title: `${tag} research preview`,
    notes: `docs/releases/${tag}.md`,
  };
}
export function compareReleaseDirectories(first: string, second: string): void {
  const files = (directory: string): string[] => readdirSync(directory).sort();
  const names = files(first);
  assert.ok(names.some((name) => name.endsWith("-source.zip")));
  assert.ok(names.some((name) => name.endsWith("-offline.zip")));
  assert.ok(names.some((name) => name.endsWith("-site.zip")));
  assert.ok(
    names.includes("SHA256SUMS.txt") && names.includes("build-record.json"),
  );
  assert.deepEqual(names, files(second), "Release file inventories differ");
  for (const name of names)
    assert.deepEqual(
      readFileSync(join(first, name)),
      readFileSync(join(second, name)),
      name,
    );
}
export function verifyReleaseChecksums(directory: string): void {
  const lines = readFileSync(join(directory, "SHA256SUMS.txt"), "utf8")
    .trimEnd()
    .split("\n");
  const covered = new Set<string>();
  for (const line of lines) {
    const match = /^([a-f0-9]{64}) {2}([\w.-]+)$/.exec(line);
    assert.ok(
      match?.[1] && match[2] && !covered.has(match[2]),
      "Invalid or duplicate checksum entry",
    );
    const file = match[2];
    covered.add(file);
    assert.equal(
      createHash("sha256")
        .update(readFileSync(join(directory, file)))
        .digest("hex"),
      match[1],
      file,
    );
  }
  assert.deepEqual(
    Array.from(covered).sort(),
    readdirSync(directory)
      .filter((name) => name !== "SHA256SUMS.txt")
      .sort(),
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const metadata = JSON.parse(readFileSync("package.json", "utf8")) as {
    version: string;
  };
  const tag = process.env["RELEASE_TAG"] ?? `v${metadata.version}`;
  const identity = releaseIdentity(
    metadata.version,
    tag,
    readFileSync(`docs/releases/${tag}.md`, "utf8"),
  );
  const first = process.argv[2];
  const second = process.argv[3];
  if (first) verifyReleaseChecksums(first);
  if (first && second) {
    verifyReleaseChecksums(second);
    compareReleaseDirectories(first, second);
  }
  if (process.env["GITHUB_OUTPUT"])
    appendFileSync(
      process.env["GITHUB_OUTPUT"],
      `tag=${identity.tag}\ntitle=${identity.title}\nnotes=${identity.notes}\n`,
    );
  console.log(
    "PASS exact release identity, notes and supplied asset comparison",
  );
}
