# Contributing

Start with README.md, docs/SECURITY.md and docs/ALGORITHMS.md. Use the exact Node/npm toolchain and locked dependencies. Changes should state the affected threat or behavior, the reason, and the evidence needed to verify the result.

Run `npm run verify`, all three browser projects, research recomputation, deterministic packaging and the separate Python package reader. Relevant UI changes need both locales/themes, smallest supported widths, native keyboard controls, forced colors and opened synthetic screenshots. Performance changes need repeated comparable measurements, retained raw results and the actual tested artifact identity. Do not publish actual credentials or clipboard captures as fixtures.

Do not add a weak randomness fallback, post-draw filtering, silent truncation, secret logging/storage/URL state, telemetry, fetched runtime wordlists or generated-secret history. A proposed feature involving keys, seeds, custom lists or new persistence must establish its own specification and threat model before implementation. Do not treat an extra feature as an automatic quality improvement.

Vocabulary updates must preserve exact source identity, license and credits, recompute counts/hash/collision diagnostics, and retain experimental evidence levels. Agents can inspect distribution, malformed input and reproducibility. They cannot claim participant recall or typing evidence from a proxy. Distinguish project-authored tests, agent assessment, independent review and observed human evidence in all public wording.

Keep original source/font/brand/standard bytes and notices when applicable. Record dependency rationale and audit the actual locked graph. Avoid unreviewed automatic major merges and mutable source inputs. A changed source pin is a reviewable trust change, not just a generated checksum update.

Security issues use SECURITY.md and a private channel once operational. Public releases require exact tag/package/notes identity, successful builds and matching artifacts. Never overwrite an existing published artifact. Published remote account changes still require current owner authorization.
