# VINASIG Password Generator

A static generator for passwords, English EFF passphrases and experimental Vietnamese Passphrase profiles. Generation runs on the device using Web Crypto. The application has no runtime package dependency, network API, tracking, storage, service worker or saved secret history.

This is a research preview. Uniform-selection mathematics and automated checks are inspectable. An independent security review, participant usability study and production validation have not been performed. The project does not claim to be the best generator, a Vietnamese vocabulary standard, or a replacement for a password manager or phishing-resistant authentication.

## Use

Open the built `dist/offline/vi.html` or `dist/offline/en.html` in a supported browser. Both files contain their code, fonts, icons and pinned lists. They work without a server or connection after opening. Generation stays disabled if secure context, Web Crypto, top-level browsing or wordlist integrity checks fail. Offline clipboard support depends on the browser. Reveal and manual copy remain available when clipboard access is denied.

Choose settings and explicitly generate. The result is masked until revealed, and the actual secret is absent from the DOM while masked. Copy is explicit. Settings changes, leaving the tab, page navigation and a five-minute timer clear the page's result. This is lifecycle cleanup, not guaranteed erasure of JavaScript memory, browser caches, clipboard history or receiving applications. Save a unique result for each account in a trusted password manager.

The root UI is Vietnamese. `/en/` is English. Both have light, dark, system preference, keyboard and responsive layouts. Theme preference is deliberately volatile.

| Mode                       | Selection                                                     | Default                                 | Evidence boundary                                                         |
| -------------------------- | ------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Password                   | 94 printable ASCII characters across four optional groups     | 20 characters, no mandatory composition | 131 whole bits of generation space under the uniform CSPRNG model         |
| English EFF                | Original 7,776-token long list                                | Seven draws, space separator            | 90 whole bits, no new participant study by this project                   |
| Vietnamese with accents    | `experimental-agent-vi`, 2,966 original tokens                | Seven draws when selected               | Experimental agent curation, 80 whole bits, no participant evidence       |
| Vietnamese without accents | `experimental-agent-ascii`, 2,389 already-deduplicated tokens | Seven draws when selected               | Experimental lossy representation, 78 whole bits, no participant evidence |

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
- [Technical decisions and standards specialization](docs/DECISIONS.md)
- [Disclosure policy](SECURITY.md)
- [License scopes](LICENSES.md) and [third-party credits](NOTICE.md)

`src/random.ts`, `src/password.ts` and `src/phrase.ts` are small source modules. The Vietnamese source is vendored unchanged with its original license. `data/lists/` exposes reusable text artifacts, and `data/source-lock.json` records source identities and hashes. Regenerate evidence with `npm run research`. Diagnostics are separately implemented within this project, not independent third-party review.

## Publication state

The canonical source repository is [VINASIG/password-generator](https://github.com/VINASIG/password-generator). Full publication at `password.vinasig.io.vn` was authorized on 7 October 2026. Repository details and private vulnerability reporting are configured. CI, release, hosting, DNS, discovery and related public information must be verified before being reported as complete. Current observations and deployment steps are in [the publication record](docs/PUBLICATION.md). Preparing a workflow does not prove it ran, and a checksum does not authenticate a publisher.
