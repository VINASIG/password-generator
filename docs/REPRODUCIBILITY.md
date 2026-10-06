# Rebuilding and verifying

Deterministic output is narrower than source authenticity, independent review or a hermetic build. Exact runner image versions are recorded. Stable OS-family labels still receive updates. Rebuilding years later is not guaranteed by a runner label or a hash.

## Toolchain and inputs

Use Node 24.21.0 and npm 12.2.0 with `npm ci --ignore-scripts`. The lockfile has exact versions and registry integrity fields. Development tools execute during verification, not in the application. esbuild bundles readable JavaScript without minification or source maps. The generated script contains no absolute source paths. There are zero runtime npm dependencies.

`data/source-lock.json` pins the original Vietnamese source, lists, source evidence, fonts, identity SVGs and shared CSS. The build verifies those bytes before generating code. A pin protects against accidental replacement relative to that reviewed metadata. An attacker controlling both source bytes and pins can replace both. The trusted release identity, review and provenance remain separate requirements.

The EFF transformation removes only the dice column and preserves token spelling and order. Its complete 7,776 lookup keys and unique tokens are checked. Unicode lists retain original UTF-8 bytes. Browser initialization verifies expected SHA-256 hashes and rejects unexpected decoding, NFC, token syntax or duplicates before enabling generation.

## Artifact identity

```sh
npm run verify
npm run research
npm run release
python scripts/verify-package.py
npm run environment
```

Build output contains two online documents, two self-contained offline documents, security headers, robots and license files. `dist/build-record.json` records hashes of those output files, exact source pins, list counts and optionally `SOURCE_COMMIT` and `PUBLIC_ORIGIN`. It cannot hash itself. Environment records are separate from deterministic content and record actual OS release/version, Node components, npm user agent, lockfile digest, runner image OS/version, and source commit/tree when available.

`SOURCE_COMMIT` must be an actual 40-character lowercase Git commit. Local pre-publication builds have a null source identity. This is disclosed, not an invented commit. `PUBLIC_ORIGIN` is optional and must be an HTTPS origin. It enables canonical/hreflang links, the two-URL sitemap and its robots declaration. Offline documents remain noindex and have no canonical origin. A deployment build with a different origin or source revision is a different artifact. Compare its own build record, not a mismatched local preview.

ZIP packages use stored entries, lexical ordering, fixed DOS timestamps of 1 January 1980 and no host filesystem metadata. This trades archive size for a small, inspectable packaging path. The independent Python standard-library reader checks CRCs, paths, ordering, timestamps, contents and delivered checksums. It does not import the ZIP writer.

The `-site.zip` contains the complete static `dist/` inventory at its archive root, including `_headers` and the build record. CI builds it with the canonical `PUBLIC_ORIGIN=https://password.vinasig.io.vn` and actual `SOURCE_COMMIT`. Release verification compares this ZIP between operating systems alongside the source/offline ZIPs. Its entries are independently checked against every recorded artifact digest. Upload only this checked site artifact to Cloudflare Pages Direct Upload, then compare served bytes and headers. Cloudflare does not build or alter the source repository through a GitHub App.

The local automated rebuild check runs the same pinned toolchain in two separate directories, compares every output byte, and confirms corrupted source pins fail. The prepared CI workflow builds on Ubuntu 24.04 and Windows Server 2025 with Visual Studio 2026, records the actual image and compares both complete release directories before publication. Until those jobs actually run, cross-OS CI is NOT_RUN. Neither check is hermetic reproducibility.

## Published release verification

Future authorized research tags must exactly match the package version and `docs/releases/<tag>.md` heading. A tag cannot silently fall back to another version's notes. Release metadata fixtures check that failure mode and reject changed, missing or unchecksummed assets. Publication requires successful verification jobs, identical paired source/offline ZIPs and checksums, followed by GitHub build-provenance attestations for those exact files and the separate environment records.

After downloading an actually published asset, use a trusted channel to compare its SHA-256 and verify its attestation:

```sh
gh attestation verify password-generator-v0.1.0-offline.zip --repo VINASIG/password-generator
gh attestation verify password-generator-v0.1.0-source.zip --repo VINASIG/password-generator
```

These commands are instructions, not claims that an attestation currently exists. Inspect the attested repository, workflow and revision, rebuild the corresponding source and compare the output. Matching bytes and provenance do not prove the specification is correct or the hosted publisher cannot serve a malicious future revision.

Verify deployed `_headers` behavior over HTTP. Meta CSP cannot implement `frame-ancestors`, while an offline file cannot receive host security response headers. The top-level browsing check is an additional guard with that limitation explicitly preserved.
