# Source and attribution notice

VINASIG Password Generator is developed with SI agents. Source inspection and automated tests do not constitute independent security, linguistic or participant review.

Application Corresponding Source, build instructions and revision-specific releases are intended at [VINASIG/password-generator](https://github.com/VINASIG/password-generator). While publication is pending, the local source tree and matching `password-generator-v0.1.0-source.zip` provide that source for review. Published deployments must point to their actual source revision.

## EFF

Credit Electronic Frontier Foundation and Joseph Bonneau for the [2016 long dice wordlist](https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt) and [wordlist design](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases). EFF's current [reuse policy](https://www.eff.org/copyright) applies CC-BY-4.0 absent a separate notice. The project removes only the dice column and preserves spelling, order and all four hyphenated words. The raw source, hashes and full license are retained. No EFF endorsement is implied.

## Vietnamese Passphrase

Credit VINASIG and the authors/contributors recorded by [Vietnamese Passphrase at commit 147c379](https://github.com/VINASIG/vietnamese-passphrase/tree/147c3791dd686b4eda5893b0eedb2d9b5f8f95e7). Its two TypeScript source files are unchanged under LGPL-3.0-or-later. The experimental `2026-10-06.agent-1` display and ASCII display lists are unchanged under their CC-BY-SA-4.0 data terms. The generator does not reselect vocabulary or claim participant validation.

The [unaltered upstream notice](licenses/vietphrase-NOTICE.md) uses paths relative to that upstream repository. Inspect those paths at the pinned source link. Locally retained source evidence is [vietphrase-source-lock.json](data/upstream/vietphrase-source-lock.json), [Tatoeba credits](data/upstream/tatoeba-credits.json) and [wordfreq's original notice](licenses/wordfreq-NOTICE.md).

Credit English and Vietnamese Wiktionary contributors, Kaikki.org and Tatu Ylonen for dictionary extraction, Robyn Speer and the upstream credited frequency-data authors, and Tatoeba contributor usernames/sentence IDs in the retained credits. Tatoeba source evidence is CC BY 2.0 France, with the original legal code retained. Dictionary/frequency-derived data uses the upstream CC-BY-SA-4.0 terms. These sources are proxies and do not prove familiarity, memorability or regional acceptance.

## Fonts, icons, brand and standards

Space Grotesk font software retains its original [OFL notice](assets/fonts/OFL.txt), copyright and reserved-name conditions. Full original TTF and WOFF2 bytes are preserved.

Lucide SVG icon geometry is expanded at build time. Retain [Lucide ISC and Feather MIT notices](licenses/Lucide.txt). No icon library executes in the page.

Original VINASIG identity SVGs retain separate [brand rights](BRAND_POLICY.md). Shared chrome/control CSS comes from the reviewed VINASIG web design system, and tokens/preferences from the reviewed existing TOTP tool. Their hashes are recorded in the source lock. The [managed agent standards](.vinasig/standards/LICENSES.md) retain their original grants and notices.

Development packages are not included as runtime dependencies. Their original notices remain in the locked development distribution. Nothing here changes upstream ownership or claims a source author's endorsement.
