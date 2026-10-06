# Sources and dependency record

## Immutable inputs

[data/source-lock.json](../data/source-lock.json) pins exact input bytes. The build is offline and rejects mismatches. Upstream acquisition is a review step, not a hidden runtime download or mutable `latest` dependency.

| Material                                                                                                                | Reviewed identity                                                                                                                                          | Treatment                                                                                |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Vietnamese Passphrase](https://github.com/VINASIG/vietnamese-passphrase/tree/147c3791dd686b4eda5893b0eedb2d9b5f8f95e7) | Commit `147c3791dd686b4eda5893b0eedb2d9b5f8f95e7`, experimental data `2026-10-06.agent-1`                                                                  | Two source files and accented/ASCII display lists copied byte-for-byte                   |
| [EFF long list](https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt)                                            | Raw SHA-256 `addd35536511597a02fa0a9ff1e5284677b8883b83e986e43f15a3db996b903e`                                                                             | Remove lookup column only, preserve token order/spelling, serialize LF and final newline |
| [VINASIG web design system](https://github.com/VINASIG/web-design-system/tree/f0fc7e5d04bbc2d70499a2aece59d6992b36d03e) | Commit `f0fc7e5d04bbc2d70499a2aece59d6992b36d03e`                                                                                                          | Shared site-chrome/control-surfaces CSS copied unchanged                                 |
| VINASIG tokens/preferences                                                                                              | Reviewed existing TOTP generator bytes                                                                                                                     | Original local hashes recorded, no redesign of shared color anchors                      |
| VINASIG brand                                                                                                           | Source commit `83ed7515c81c3b2a28888a75c754e44562d5b107`                                                                                                   | Original transparent SVGs, preserved aspect and bytes, separate brand rights             |
| Space Grotesk                                                                                                           | Original full-glyph TTF and WOFF2 in the existing approved font set                                                                                        | Preserve original font bytes and OFL notice, embed WOFF2 without remote requests         |
| VINASIG agent standards                                                                                                 | Reviewed snapshot from commit `bc72ee25ac18e7847eb2c7f8cdd8a57e3164e92e`, bundle digest `b559621eb453eee3e2728901d1dd9bd0dd89d0451e6243ce40182e1c9bdb31d7` | Installed through the official bundle CLI, managed files unchanged                       |

EFF's four hyphenated entries are `drop-down`, `felt-tip`, `t-shirt` and `yo-yo`. Removing hyphens would change published spellings. Allowing a hyphen delimiter would make token boundaries ambiguous, so only space or period is supported.

The Vietnamese lists are not a new linguistic curation by this generator. Their original experimental labels, limits and provenance remain attached. Source corpus counts, diagnostics and participant gaps are documented by the pinned upstream project. Tatoeba contributor credits and the full upstream source lock are retained locally. Do not call a corpus holdout external human validation.

## Development dependencies

Registry and compatibility review occurred on 6 October 2026 using official npm metadata. All direct versions and transitive integrity values are locked. Runtime package dependencies are zero. Build, formatting, browser testing and laboratory tooling are development-only and do not ship as imported packages in the app.

| Package or runtime           | Selected           | Reason                                                            |
| ---------------------------- | ------------------ | ----------------------------------------------------------------- |
| Node                         | 24.21.0            | Supported major 24, exact patch                                   |
| npm                          | 12.2.0             | Current selected exact package manager, no floating CI install    |
| TypeScript                   | 6.0.3              | Latest 7.0.2 is outside the selected typescript-eslint peer range |
| typescript-eslint            | 8.71.1             | Current compatible release with strict typed lint                 |
| @types/node                  | 24.19.1            | Node 24 declarations, not latest major 26                         |
| ESLint and @eslint/js        | 10.12.0 and 10.0.1 | Verified compatible package versions                              |
| esbuild                      | 0.28.2             | Small build-only bundler, readable IIFE, no hydration runtime     |
| html-validate                | 11.16.2            | Validate the actual generated HTML                                |
| Prettier                     | 3.9.9              | One formatter, imported pinned bytes excluded                     |
| css-tree and @types/css-tree | 3.2.1 and 3.2.0    | CSS syntax/declaration grammar and typed compensating checker     |
| Playwright and axe           | 1.63.0 and 4.13.0  | Three engine paths, scoped accessibility checks                   |
| Lighthouse                   | 13.5.0             | Repeated raw laboratory measurements                              |
| Lucide                       | 1.52.0             | Icons expanded at build time, original notices retained           |

The source lock and npm lock must be reviewed together on updates. No automatic major merge or `audit fix --force` is used. Initial Stylelint evaluation reported seven high entries propagated from one `braces` advisory, not seven independent application defects. The selected dependency graph audits with no known findings at the recorded review date. An audit result is a database snapshot, not proof that packages are defect-free or authentic.

## Primary research references

- [Final NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [Stable Web Cryptography Recommendation](https://www.w3.org/TR/2017/REC-WebCryptoAPI-20170126/)
- [Web Crypto Level 2 working draft](https://www.w3.org/TR/webcrypto/), not treated as a final new certification requirement
- [CSP Level 3](https://www.w3.org/TR/CSP3/)
- [zxcvbn paper at USENIX Security 2016](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler)
- [EFF design and wordlists](https://www.eff.org/dice), [current EFF reuse policy](https://www.eff.org/copyright)
- Product documentation and incident sources linked in [RESEARCH.md](RESEARCH.md)

All inference and selection decisions belong to this project. None of the referenced authors or products is claimed to endorse it.

The exact upstream CC-BY-SA legal-text copy is retained separately as `licenses/vietphrase-CC-BY-SA-4.0.txt`, with its own source pin. The standard application/documentation copies use the official legal-code identity recorded in `license-text-sources.json`. A formatting difference between those original texts is not hidden as a matching hash. Generated `docs/research/measurements.json` retains the serializer's deterministic bytes and is not reformatted by Prettier, so the research recomputation gate compares the actual generated artifact.
