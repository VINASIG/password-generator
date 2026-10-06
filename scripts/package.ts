import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { zip } from "./zip.ts";
import type { ZipEntry } from "./zip.ts";

const metadata = JSON.parse(readFileSync("package.json", "utf8")) as {
  version?: string;
};
if (!metadata.version || !/^0\.\d+\.\d+$/.test(metadata.version))
  throw new Error("INVALID_PREVIEW_VERSION");
const version = metadata.version;
const record = JSON.parse(readFileSync("dist/build-record.json", "utf8")) as {
  version?: string;
  artifacts: Record<string, { sha256: string }>;
};
if (record.version !== version) throw new Error("BUILD_VERSION_MISMATCH");
const hash = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");
for (const [path, expected] of Object.entries(record.artifacts))
  if (hash(readFileSync(join("dist", path))) !== expected.sha256)
    throw new Error("ARTIFACT_INTEGRITY_FAILURE");
function collect(root: string, prefix = ""): ZipEntry[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile()))
      throw new Error("UNSUPPORTED_PACKAGE_ENTRY");
    return entry.isDirectory()
      ? collect(join(root, entry.name), `${prefix}${entry.name}/`)
      : [
          {
            name: `${prefix}${entry.name}`,
            bytes: readFileSync(join(root, entry.name)),
          },
        ];
  });
}
const required = [
  "AGENTS.md",
  "CONTRIBUTING.md",
  "README.md",
  "SECURITY.md",
  "NOTICE.md",
  "LICENSE",
  "LICENSES.md",
  "BRAND_POLICY.md",
  ".gitignore",
  ".gitattributes",
  ".prettierignore",
  ".node-version",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "eslint.config.mjs",
  "playwright.config.ts",
];
const source: ZipEntry[] = required.map((name) => ({
  name,
  bytes: readFileSync(name),
}));
for (const directory of [
  "src",
  "scripts",
  "tests",
  "docs",
  "data",
  "assets",
  "public",
  "licenses",
  ".github",
  ".agents",
  ".vinasig/standards",
])
  source.push(...collect(directory, `${directory}/`));
source.push({
  name: ".vinasig/manifest.json",
  bytes: readFileSync(".vinasig/manifest.json"),
});
const licenses = collect("licenses", "licenses/");
const offline = [
  { name: "vi.html", bytes: readFileSync("dist/offline/vi.html") },
  { name: "en.html", bytes: readFileSync("dist/offline/en.html") },
  { name: "build-record.json", bytes: readFileSync("dist/build-record.json") },
  { name: "fonts/OFL.txt", bytes: readFileSync("assets/fonts/OFL.txt") },
  ...["LICENSE", "NOTICE.md", "LICENSES.md", "BRAND_POLICY.md"].map((name) => ({
    name,
    bytes: readFileSync(name),
  })),
  ...licenses,
  {
    name: "VERIFY.md",
    bytes: Buffer.from(
      `Open vi.html or en.html in a supported browser. These files need no server or runtime dependencies.\n\nCorresponding source is password-generator-v${version}-source.zip. Compare SHA256SUMS.txt through a trusted channel. A hash proves byte equality, not publisher authenticity. Published release attestations, when available, can be checked with gh attestation verify against VINASIG/password-generator. See docs/REPRODUCIBILITY.md in the corresponding source.\n\nThis is a research preview. No independent security review, participant usability validation or production assurance is implied.\n`,
    ),
  },
];
const destination = resolve(process.env["PACKAGE_DIR"] ?? "output/release");
mkdirSync(destination, { recursive: true });
const files = {
  [`password-generator-v${version}-source.zip`]: zip(source),
  [`password-generator-v${version}-offline.zip`]: zip(offline),
  [`password-generator-v${version}-site.zip`]: zip(collect("dist")),
  "build-record.json": readFileSync("dist/build-record.json"),
};
for (const [name, bytes] of Object.entries(files))
  writeFileSync(join(destination, name), bytes);
writeFileSync(
  join(destination, "SHA256SUMS.txt"),
  `${Object.entries(files)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, bytes]) => `${hash(bytes)}  ${name}`)
    .join("\n")}\n`,
);
console.log(
  "PASS built deterministic source, offline and site ZIPs with checksums",
);
