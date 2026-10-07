# Publication record and deployment procedure

The owner authorized full publication on 7 October 2026 at `VINASIG/password-generator` and `password.vinasig.io.vn`, including Repo details, private vulnerability reporting, CI, release provenance, Cloudflare/DNS, Search Console and related public inventories. Executed observations below remain bound to their actual revision. Later release gates must run against the tag being published.

## Published output-interaction correction: v0.2.6

The [v0.2.6 research release](https://github.com/VINASIG/password-generator/releases/tag/v0.2.6) is deployed from signed revision `3a9c9146b24fda5af547f675658f8bce74526bc6`. Both [main verification](https://github.com/VINASIG/password-generator/actions/runs/37587761197) and [tagged release verification/publication](https://github.com/VINASIG/password-generator/actions/runs/37587766143) succeeded. Each Ubuntu and Windows job passed 135 browser cases with zero retries, skips or unexpected outcomes. Five deterministic assets matched across both environments in both workflows and the downloaded public release. All seven assets passed provenance verification against the exact tag, source digest, workflow identity, GitHub OIDC issuer, hosted runner and transparency-log timestamp. The separate Python standard-library reader passed inventories of 174 source, 19 offline and 22 site entries.

Cloudflare reported Production deployment `780bf195-bbd0-4c43-9ca8-8f2b58dd8140` successful at 14:46 on 7 October 2026, with `password.vinasig.io.vn` as its alias. The verified public site ZIP was uploaded with all 22 entries; `_headers` is configuration rather than a served document. A hostname-scoped Custom Purge was received successfully. All 21 public files subsequently matched release bytes on ordinary canonical URLs. All nine declared security/cache headers matched on every file, with `NEL` and `Report-To` absent.

The deployed matrix passed 36 delivery cases and 75 affected interaction regressions across Chromium, Firefox and WebKit. The latter covers native selected-text Copy while masked, length-matched masking, maximum password wrapping, scramble timing, adjacent actions, countdown state, contextual field guidance, translated metric alignment, malformed settings, all pinned vocabularies, both themes/locales and enlarged text. Twelve synthetic UI images and the deployment confirmation were opened. They cover the 128-character workspace, 8-bullet mask, English statistics and low-bit guidance, initial animation, mobile/enlarged text, 20-word output, pause under the pointer and local word-count error. The [execution receipt](validation/publication-v0.2.6.json) binds these observations to the release, CI results, artifact digests and opened-image digests. The [acceptance review](UI-ACCEPTANCE-v0.2.4.md) maps the nine reported defects and preserves the unsuccessful v0.2.4/v0.2.5 navigation investigations. Neither held tag published a release; the precise driver cause remains undetermined.

This post-deployment documentation update does not replace the tagged artifacts or change their deployed source identity. The earlier records below remain historical evidence for their named revisions.

## Historical interface correction: v0.2.3

The [v0.2.3 research release](https://github.com/VINASIG/password-generator/releases/tag/v0.2.3) was deployed from signed revision `45f832779c6eadeb4c1c5fb0b14cfc1a2e07f05e`. Both [main verification](https://github.com/VINASIG/password-generator/actions/runs/37572891237) and [tagged release verification/publication](https://github.com/VINASIG/password-generator/actions/runs/37572895292) succeeded. Each Ubuntu and Windows job passed 108 browser cases with zero retries, skips or unexpected outcomes. Five deterministic assets matched both main CI environments and the downloaded public release. All seven assets, including the two environment records, passed provenance verification against the exact tag, source digest, GitHub workflow identity, OIDC issuer and transparency-log timestamp.

The independently read public ZIP has 22 site entries. Cloudflare reported Production deployment `bea6b482-849d-4c5d-899b-2bc3d64404e4` successful, with `password.vinasig.io.vn` as its alias. A Custom Purge was submitted for that hostname. The 21 served documents then matched release bytes on ordinary canonical URLs. All nine declared security/cache headers matched on every document; `NEL` and `Report-To` were absent. `_headers` is consumed as configuration and is not counted as a public document.

The deployed browser matrix passed 36 delivery cases and a separate set of 51 affected UI/automatic-generation/lifecycle regressions across Chromium, Firefox and WebKit. The latter retains the full mode, language, theme, short/maximum-output, malformed-input and enlarged-text acceptance matrix. Deployed synthetic images were opened for both themes, countdown midpoint, pause under the pointer, word-count error, always-open password options, narrow settings/results and maximum Vietnamese output. The [machine-readable execution receipt](validation/publication-v0.2.3.json) records the exact revision, artifacts, paired CI results, provenance, per-route headers/digests, browser results and opened-image digests. [The interface review](UI-ACCEPTANCE-v0.2.3.md) explains the original failures and their acceptance mapping.

This post-deployment record is a documentation follow-up. It does not change or replace the tagged release assets or the deployed source identity. Earlier observations below remain historical evidence for their named revisions.

## Executed GitHub setup

- The public [VINASIG/password-generator](https://github.com/VINASIG/password-generator) repository uses default branch `main`. Its description is `Static local password and passphrase generator with uniform sampling, offline builds and inspectable evidence`.
- The verified homepage is `https://password.vinasig.io.vn/`. All nine topics were saved and read back: `password-generator`, `passphrase`, `web-crypto`, `privacy`, `security`, `offline`, `vietnamese`, `typescript` and `reproducible-builds`.
- Private vulnerability reporting is enabled. GitHub's read API returned `enabled: true`; [SECURITY.md](../SECURITY.md) describes the real private advisory form and disclosure process.
- Initial commit `ade7ef9866680aab09f40205d2de2b0624ed7362` and canonical site-artifact commit `72d458e8edab660d6e7837f7352848b32e6c0ac1` were pushed and read back. GitHub verified their signatures. [Initial verification](https://github.com/VINASIG/password-generator/actions/runs/37503365291) and [site-artifact verification](https://github.com/VINASIG/password-generator/actions/runs/37504825103) both succeeded on Ubuntu and Windows.
- Downloaded artifacts for `72d458e8` were compared independently. The source/offline/site ZIPs, SHA256SUMS and build record were byte-identical across the two environments. The separate Python standard-library reader passed inventory, path, ordering, timestamp, CRC, content and checksum checks. Exact runner/toolchain manifests remain separate from deterministic content.

CI configuration alone is not successful CI. A signed source commit is not an independent security review. A checksum is not source authenticity. The tagged release must pass its own verification/comparison and provenance jobs; initial CI is not substituted for that result.

## Executed hosting and DNS

Cloudflare Pages **Direct Upload** project `password-generator` was created. Its actual project hostname is `password-generator-60g.pages.dev`. The checked CI site ZIP was uploaded with 22 files, including `_headers` and `build-record.json`. The custom domain was associated through Pages before activation. Pages reported `password.vinasig.io.vn` **Active**, with SSL enabled.

DNS was read back as type `CNAME`, name `password.vinasig.io.vn`, content `password-generator-60g.pages.dev`, proxy `Proxied` and TTL `Auto`. There was no prior exact-name record. Existing unrelated zone records were preserved. The [Pages custom-domain procedure](https://developers.cloudflare.com/pages/configuration/custom-domains/) requires project association before a manually configured CNAME.

No Pages Function, Worker, database or client API is needed. [Pages header rules](https://developers.cloudflare.com/pages/configuration/headers/) apply to static responses. Actual HTTP behavior was tested, including `frame-ancestors 'none'`, rather than inferred from `_headers` alone.

Initial live verification compared all **21 publicly served files** with the checked CI build, including both locales, both offline files, robots/sitemap, build record and original licenses. Every digest matched and all eight declared security/cache header values matched. The [retained evidence JSON](validation/publication-initial.json) records each route, digest and header against revision `72d458e8edab660d6e7837f7352848b32e6c0ac1`. `_headers` is hosting configuration rather than a public document; its behavior was checked through real responses.

A final transport check observed a 301 redirect from HTTP to the canonical HTTPS origin but no HSTS in the initial deployment. The release artifact adds the ninth required header, `Strict-Transport-Security: max-age=31536000`, restricted to the responding host with no subdomain/preload directive. Its actual HTTPS delivery must be verified after uploading the release. The earlier eight-header evidence remains unchanged and is not relabeled as proof of this addition.

The live matrix passed **36 browser cases**: Chromium, Firefox and WebKit, Vietnamese/English, actual light/dark surfaces, and widths 320, 390 and 1440. Each case generated the password and all three passphrase profiles, checked masked/revealed/cleared state, output-space counts, list membership, canonical metadata, zero page errors, no application requests after delivery, no cookies/storage, and no horizontal overflow. Shared chrome/control probes passed. The unchanged brand inspector's data-URL filename limitation is recorded rather than hidden; decoded original SVG digests and remaining geometry checks compensate. On this Windows Firefox build, media emulation did not apply dark preference, so dark cases used the real theme button and asserted the rendered theme. These are engine tests, not physical-device or participant validation.

## Scoped delivery rules

All rules match only `(http.host eq "password.vinasig.io.vn")`:

| Rule                                                    | Executed setting and observation                                                                                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password Generator: respect origin cache headers        | Cache eligibility enabled, edge TTL respects the origin header, browser TTL respects origin TTL. Actual `Cache-Control: no-cache` matches the artifact policy.                         |
| Password Generator: preserve artifact bytes and privacy | Disable RUM and Zaraz, Email Obfuscation off, Rocket Loader off. An initially rewritten Creative Commons license email was corrected; delivered legal HTML now matches original bytes. |
| Password Generator: suppress network telemetry headers  | Remove `NEL` and `Report-To`. Checks of `/`, `/en/`, `/robots.txt` and `/sitemap.xml` returned 200 with both headers absent.                                                           |

These rules preserve unrelated DNS, WAF and zone settings. They do not hide the initial HTTPS request from Cloudflare or guarantee removal of a reporting policy previously cached by a browser. Generated secrets are not part of requests. See the provider's [configuration-rule settings](https://developers.cloudflare.com/rules/configuration-rules/settings/), [cache-rule settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/) and [response-header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/). Repeat byte/header checks after deployment rather than trusting a dashboard label alone.

## Search Console and public inventories

Access to the existing Domain property `sc-domain:vinasig.io.vn` was verified, with the owner shown as verified. [Domain properties cover subdomains](https://support.google.com/webmasters/answer/34592), so no duplicate DNS ownership record was created.

`https://password.vinasig.io.vn/sitemap.xml` was submitted on 7 October 2026. Initial status was temporarily unable to fetch. The detail subsequently showed **processed successfully**, last read 7 October, and **two discovered pages**. Google's live inspections of `/` and `/en/` showed successful smartphone fetch, crawl/index permission and their correct canonical URLs. Both indexing requests were accepted into the priority queue. Submission, successful fetch and actual indexing are separate states. The last inspections did not show indexed pages; [Google does not guarantee indexing from sitemap submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

The VINASIG website inventory was committed and pushed as `c87353d450de30ea355669bb4939d8008a9fc6dc`. Local gates passed 51 unit tests, 312 shared-chrome cases, 306 browser tests and twelve Lighthouse measurements at unchanged budgets. See [the durable catalog audit](https://github.com/VINASIG/vinasig/blob/c87353d450de30ea355669bb4939d8008a9fc6dc/docs/audits/password-generator-catalog-2026-10-07.md). [Run 37509215751](https://github.com/VINASIG/vinasig/actions/runs/37509215751) then passed all six Linux/Windows browser jobs and deployed that revision. The live English and Vietnamese catalogs showed the new entry with correct locale/source links. Searching `cụm từ` returned the generator, and the real generator header logo navigated to the canonical homepage.

Both organization-profile languages were committed and pushed as `2783a4bd66d2f86c02f5d43698be2422f58793e4` in `VINASIG/.github`, and their rendered public Markdown was inspected in Chrome. The entry preserves tool order and states local generation, English/experimental Vietnamese passphrases, offline files and research-preview status. Vietnamese Passphrase remains separately under Data and libraries.

## Release and future deployment

The GitHub App installation screen requested persistent read/write administration, checks, code, deployments and pull-request access. No App installation or deployment API credential was created. Builds run in pinned GitHub CI with the canonical `PUBLIC_ORIGIN` and actual `SOURCE_COMMIT`. Cloudflare does not build the source repository.

[Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) accepts the prebuilt ZIP through the dashboard. Each website update requires explicit artifact upload. Source pushes are verified but do not automatically deploy. A Direct Upload project cannot switch in place to Git integration. Review future automation and credential scope separately.

For an authorized release:

1. Verify the actual main revision and inspect its changes. Sign the exact-version tag after checks pass.
2. Let the tag workflow verify both environments, require identical source/offline/site assets and checksums, require the matching `docs/releases/<tag>.md` heading, and attest artifacts/environment manifests before publishing a research prerelease with `latest=false`.
3. Download public assets, verify checksums/package contents and run `gh attestation verify` against `VINASIG/password-generator`. Inspect the attested workflow and source commit, not merely command success.
4. Upload the verified public site ZIP as a new production deployment in this existing project. Do not rebuild through an unrecorded toolchain or replace a released asset.
5. Compare every public file with that release's own build record. Check actual headers, absence of added scripts/telemetry, generation, lifecycle cleanup, shared chrome and original home-logo navigation.

Preview origins are not the canonical service. Offline documents remain noindex. Initial evidence does not certify future deployments. Field metrics, participant familiarity/recall/typing, independent linguistic/security review and manual screen-reader tests remain NOT_RUN.
