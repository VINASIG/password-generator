import { arch, platform, release, version } from "node:os";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

const destination = resolve(
  process.env["ENVIRONMENT_RECORD"] ?? "output/environment/local.json",
);
const npm = process.env["npm_config_user_agent"] ?? "not recorded by npm";
const command = (args: readonly string[]): string | null => {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};
const report = {
  schema: 1,
  platform: platform(),
  arch: arch(),
  osRelease: release(),
  osVersion: version(),
  node: process.version,
  nodeComponents: process.versions,
  npmUserAgent: npm,
  runnerLabel: process.env["BUILD_RUNNER_LABEL"] ?? null,
  runnerImageOS: process.env["ImageOS"] ?? null,
  runnerImageVersion: process.env["ImageVersion"] ?? null,
  runnerEnvironment: process.env["RUNNER_ENVIRONMENT"] ?? null,
  gitCommit: command(["rev-parse", "HEAD"]),
  gitTree: command(["rev-parse", "HEAD^{tree}"]),
  packageLockSha256: createHash("sha256")
    .update(readFileSync("package-lock.json"))
    .digest("hex"),
  deterministicBuildRecord: JSON.parse(
    readFileSync("dist/build-record.json", "utf8"),
  ) as unknown,
};
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  "PASS recorded actual OS, toolchain, source identity and artifact digests",
);
