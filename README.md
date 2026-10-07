# VINASIG Password Generator

A static generator for passwords, English EFF passphrases and Vietnamese Passphrase profiles. Generation runs on the device using Web Crypto. The application has no runtime package dependency, network API, tracking, service worker or saved secret history. Only the shared light/dark appearance preference is persisted.

This is a research preview. Uniform-selection mathematics and automated checks are inspectable. An independent security review, participant usability study and production validation have not been performed. The project does not claim to be the best generator, a Vietnamese vocabulary standard, or a replacement for a password manager or phishing-resistant authentication.

## Use

Use the website in [Vietnamese](https://password.vinasig.io.vn/) or [English](https://password.vinasig.io.vn/en/). Standalone offline files are also available from the page and as a ZIP in [research releases](https://github.com/VINASIG/password-generator/releases). Verify the release identity and artifact checksum before using a downloaded copy.

Open the built `dist/offline/vi.html` or `dist/offline/en.html` in a supported browser. Both files contain their code, fonts, icons and pinned lists. They work without a server or connection after opening. Generation stays disabled if secure context, Web Crypto, top-level browsing or wordlist integrity checks fail. Offline clipboard support depends on the browser. Reveal and manual copy remain available when clipboard access is denied.

A fresh result is generated on startup, whenever relevant settings change, and every 60 seconds while the page is active. Generate, Show/Hide and Copy sit together immediately below the result. Results are shown by default with a 1.2-second character scramble, including an initial 240 ms scrambling interval. Show/hide stays selected until reload. Masked mode displays one bullet per Unicode codepoint. The Copy button copies the complete result. Native keyboard/browser Copy copies exactly the selected portion, including while hidden. A trusted masked Copy briefly clips the readonly output out of view and selects that portion there for the native copy action. A mask overlay retains the visible presentation. The following task clears the transfer and restores the mask/selection only for the same active revision. Both copy paths are explicit clipboard actions and pause rotation. Focusing the result also pauses it until Resume. Hover alone does not pause, so Resume works while the pointer stays on its button. Leaving the tab, page navigation and five minutes without interaction clear the result. Automatic rotation does not reset the inactivity deadline. This is lifecycle cleanup, not guaranteed erasure of JavaScript memory, browser caches, clipboard history or receiving applications. Save a unique result for each account in a trusted password manager.

The root UI is Vietnamese. `/en/` is English. Both have light, dark, system preference, keyboard and responsive layouts. The appearance preference uses the same `vinasig-theme` key as the other VINASIG tools. Secret, settings, visibility and rotation preferences remain volatile.

| Mode                       | Selection                                                     | Default                                 | Evidence boundary                                                 |
| -------------------------- | ------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| Password                   | 94 printable ASCII characters across four optional groups     | 20 characters, no mandatory composition | 131 whole bits of generation space under the uniform CSPRNG model |
| English EFF                | Original 7,776-token long list                                | Seven draws, hyphen separator           | 90 whole bits under uniform token selection                       |
| Vietnamese with accents    | `experimental-agent-vi`, 2,966 original tokens                | Seven draws when selected               | Original agent-curated tokens, 80 whole bits                      |
| Vietnamese without accents | `experimental-agent-ascii`, 2,389 already-deduplicated tokens | Seven draws when selected               | Distinct accent-free tokens, 78 whole bits                        |

A fixed delimiter contributes no bits. Repeated characters and words are allowed. Optional required groups are sampled uniformly over the exact set of satisfying strings. There is no insertion/shuffle shortcut, post-generation filtering, accent folding or truncation. The UI reports whole bits rounded down, Unicode codepoints and UTF-8 bytes. Those numbers describe this generator's output space, not account security or a cracking time.

## Build and verify

Use Node **24.21.0** and npm **12.2.0**. Version files and exact dependencies are committed. The installed toolchain is recorded separately from deterministic artifacts.

```sh
npm ci --ignore-scripts
npm run verify
npm exec -- playwright install chromium firefox webkit
npm run test:browser
npm run research
npm run test:performance
npm run release
npm run dev
```

Open `http://127.0.0.1:4179/`. Localhost is needed for preview Web Crypto, not for the standalone HTML. On Linux, install browser system dependencies using `playwright install --with-deps`. If a shared browser cache cannot launch, install into a project-specific `PLAYWRIGHT_BROWSERS_PATH` and use that same environment variable for tests. Do not weaken browser checks to bypass a broken cache.

`npm run verify` builds the same four HTML artifacts, checks strict TypeScript, typed ESLint, CSS grammar, formatting and generated HTML, runs enumeration/counting/adversarial tests, and audits the locked development dependency graph. Browser, lab performance and package checks are separate gates. Browser traces, video and automatic failure screenshots are disabled so normal tests do not export random secrets. Deliberate UI screenshots use a synthetic all-zero test source, never account credentials.

## Evidence and reuse

- [Research and alternatives](docs/RESEARCH.md)
- [Algorithms and conditional distribution proof](docs/ALGORITHMS.md)
- [Threat model and privacy boundaries](docs/SECURITY.md)
- [Sources, versions and license provenance](docs/SOURCES.md)
- [Validation and gaps](docs/VALIDATION.md)
- [Reproducibility and release verification](docs/REPRODUCIBILITY.md)
- [Public deployment and publication evidence](docs/PUBLICATION.md)
- [Technical decisions and standards specialization](docs/DECISIONS.md)
- [Reported interface defects and acceptance evidence](docs/UI-ACCEPTANCE-v0.2.3.md)
- [Output interaction and copy follow-up](docs/UI-ACCEPTANCE-v0.2.4.md)
- [v0.2.4 local source, browser, opened-image and performance evidence](docs/UI-VALIDATION-v0.2.4.json)
- [v0.2.3 release and deployed execution receipt](docs/validation/publication-v0.2.3.json)
- [Disclosure policy](SECURITY.md)
- [License scopes](LICENSES.md) and [third-party credits](NOTICE.md)

`src/random.ts`, `src/password.ts` and `src/phrase.ts` are small source modules. The Vietnamese source is vendored unchanged with its original license. `data/lists/` exposes reusable text artifacts, and `data/source-lock.json` records source identities and hashes. Regenerate evidence with `npm run research`. Diagnostics are separately implemented within this project, not independent third-party review.

## Publication state

The public source repository is [VINASIG/password-generator](https://github.com/VINASIG/password-generator). The canonical website runs on Cloudflare Pages Direct Upload with checked static response headers. Repository details and private vulnerability reporting are configured. The published v0.2.3 revision `45f832779c6eadeb4c1c5fb0b14cfc1a2e07f05e` passed its own paired Ubuntu/Windows CI and release provenance checks. Its 21 public deployed files match the release bytes and all nine declared response headers; 36 delivery cases and 51 affected live regressions passed. The [execution receipt](docs/validation/publication-v0.2.3.json) and [publication record](docs/PUBLICATION.md) retain revision-specific observations and procedures. A website update requires uploading the verified site ZIP. Preparing a workflow does not prove it ran, and a checksum does not authenticate a publisher.
