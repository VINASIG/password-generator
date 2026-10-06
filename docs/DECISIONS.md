# Decisions and standards assessment

Reviewed 6 October 2026 under the owner's instruction to independently select architecture, technology, algorithms and test strategy. The adopted managed standards remain byte-preserved. This document specializes implementation choices; it does not claim an unperformed gate passed.

## Delivery and defaults

Strict TypeScript plus build-only esbuild emits a readable IIFE. No framework, runtime icon package, external font, fetched list or service worker was needed. Two locale documents and two standalone variants share one script and one embedded data model. Self-contained delivery increases duplicate payload but simplifies the runtime trust graph and offline verification.

Default password mode is 20 characters from all printable non-space ASCII, with no required character groups. Site compatibility rules are in a closed disclosure. Passphrase mode initially selects the unchanged EFF list. Both Vietnamese choices are explicitly experimental, and neither is recommended. Examples and controls state evidence levels. Transformation names alone do not establish usability.

No PIN, cryptographic key, uploaded custom list, deterministic secret seed, bulk export, generated-history, URL settings, strength library or clipboard auto-erasure is included. These add distinct threat or specification surfaces without demonstrated need for version 0.1. These are scoped choices, not a universal judgment about other products.

## QUAL-002 CSS specialization

The installed policy normally names Stylelint. Initial evaluation selected Stylelint 17.16.0 and its standard preset, then `npm audit` found seven high graph entries from the unpatched `braces` advisory GHSA-vfj7-8cjw-p6xm. The vulnerable package is development-only. Downgrading through `audit fix --force` or suppressing an advisory would not provide a sound new-project selection.

The owner's express instruction to choose the test strategy is the authority for selecting a different checker here. This is an agent's scoped implementation decision under that instruction, not a fabricated explicit owner waiver for a named Stylelint rule. Stylelint itself is **NOT_RUN** in the final stack. CSS syntax, declaration grammar, malformed/unknown-property fixtures, strict typed tooling, formatting and three-engine computed-control checks are the compensating gates. `var()` fallback syntax is parsed, while variable resolution is tested in real computed styles. Review the choice by 6 November 2026 or when a compatible fixed upstream chain is available.

The replacement does not provide every Stylelint convention rule. Newly authored CSS is formatted and grammar-checked. Imported pinned shared CSS is grammar-checked and browser-inspected without reformatting or changing bytes. No assertion or audit severity threshold is removed to make the result pass.

## WEB-001 data-URL checker limitation

The unchanged shared `inspectHeaderBrand` checks geometry, surface and original filename selection. Self-contained data URLs have no original filename, so it returns exactly `header-logo-variant` for these documents. This is recorded as an unsupported probe condition, not silently counted as a full PASS. Every other finding must remain absent.

A compensating probe decodes the actual displayed data URL, hashes its SVG bytes, compares against the correct reviewed light/dark source, and checks the original geometry through the unchanged inspector. Shared chrome, original ratio, transparent background, 132 px lockup, homepage link and preference targets are separately tested. The standard snapshot is not edited to accommodate the application.

Forced colors exposed a real difference between reported color scheme and rendered surface. The selection now reads actual body background luminance and responds to both color-scheme and forced-colors changes. The white high-contrast Chromium surface uses the original primary SVG even when the selected theme is dark. A screenshot and exact source-byte assertion verify that case.

## Disclosure indicators and other controls

There is no select, custom popup, search field, progress or meter in this interface, so ordinary dropdown indicator geometry is **NOT_APPLICABLE**, rather than a zero-count PASS claim. Initial/open disclosure, actual checkbox/radio/range parts, text inputs, readonly result scrollbar, focus and forced-colors behavior are applicable. Expected inventories assert nonzero counts for the controls present.

There is no product animation. Reduced-motion is exercised without adding movement solely to satisfy an animation test. Human screen-reader observation and independent browser-agent trials are **NOT_RUN**. Playwright automation and axe are different evidence classes.

## Claims and reproducibility

Counts, hashes and runner records must not make the result look more certain than its evidence. Tests are authored within the same project, including separately implemented oracles. None is an independent reviewer. Runner labels name stable OS families, while exact image/tool versions are recorded separately. A recorded image is not a hermetic environment or a promise of reproducibility years later.

Release notes are selected from exact package/tag identity. Publication compares deterministic artifacts from both OS builds, attaches their distinct environment records and produces provenance only for the verified files. Prepared workflows are **NOT_RUN** until actually executed.
