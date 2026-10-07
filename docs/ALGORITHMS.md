# Algorithms and invariants

## Random integer selection

`uniformBelow(B)` accepts a positive BigInt bound whose binary representation is at most 2,048 bits. With `B = 1`, it returns zero without drawing. Otherwise it draws enough bytes for `bitLength(B - 1)`, masks unused high bits, converts to an integer, rejects values at least `B`, and returns an accepted value. There is no modulo reduction on an unrestricted range and no weak fallback. At most 128 attempts are allowed. A failing provider or exhausted attempts throws. Its temporary byte array is zeroed in a `finally` block.

In the ideal uniform-byte model, every candidate in the masked power-of-two range has equal probability. Conditioning on acceptance leaves exactly the integers `0` through `B - 1` with equal probability. Bounded failure does not select a biased substitute. The probability argument is conditional on success and a correctly functioning random source. Tests establish the mapping, not the browser CSPRNG's entropy or resistance to compromise.

The unchanged Vietnamese implementation uses a separate 32-bit rejection sampler. It accepts only values below `2^32 - (2^32 mod N)` before reducing modulo `N`. That interval has equally sized buckets. The English path uses this same reviewed sampler. A fixed stuck or malicious random provider that supplies plausible values is not detected by the application.

## Password counting and unranking

Selected groups are disjoint subsets of visible ASCII `!` through `~`. Exclusions and ambiguity removal happen before selection. Empty selected groups and impossible requirements fail. Length is at most 128, groups at most four. Repetition is allowed.

Let `W(r, m)` be the number of length-`r` suffixes still required to contain groups represented by mask `m`.

```text
W(0, 0) = 1
W(0, m) = 0 when m != 0
W(r, m) = sum over groups g of |g| * W(r - 1, m with g removed)
```

Without required groups, the starting mask is zero and the number is `A^L`. With requirements, the starting mask contains each selected group. The table holds BigInts, not floating-point counts. A rank is selected uniformly below the exact starting count. In a fixed group/character order, each next character owns a contiguous interval of ranks whose length is its number of valid suffixes. Subtract skipped intervals and recurse into the selected interval.

By induction on remaining length, every valid output has exactly one rank and every rank yields a valid output. Uniform rank selection therefore yields uniform outputs in this model. The table and alphabet snapshots are frozen. Tests enumerate valid strings without importing this recurrence and separately compute production counts by inclusion-exclusion.

If selected group sizes are `s_i`, the independent count oracle is the alternating sum over subsets of missing groups of `(A - sum(s_i))^L`. It is a different calculation path from the dynamic-programming recurrence.

The UI validates an integer length of 8 through 128. The core permits lengths 1 through 128 to make small exhaustive fixtures possible. This lower core bound is not a recommendation for a production secret.

## Passphrase selection and serialization

The build verifies source pins, preserves the EFF spelling/order while removing only its five-die lookup column, and embeds all three texts and digests. Startup verifies SHA-256 and parses strict unique line-delimited tokens. The Vietnamese parser requires lowercase NFC Vietnamese letters and single internal underscores. The ASCII list is imported already deduplicated. There is no post-draw accent removal.

The wrapper snapshots source fields before an asynchronous digest can yield to another task. This prevents a caller mutating English text between hash verification and parsing. Maximum codepoint/UTF-8 token lengths are computed once after verification and retained in the frozen list, rather than re-encoding the entire vocabulary for each generation. Actual result lengths are still measured from each produced string.

For `N` unique tokens and `k` independent uniform draws with replacement, the outcome count is `N^k`. Hyphen, space and period separators are accepted. Space and period require tokens without that delimiter. For hyphen, the codewords `token + "-"` must be prefix-free. The plan rejects any vocabulary where a token is also a prefix of another token ending immediately before an internal hyphen. No token in the pinned EFF list equals `drop`, `felt`, `t` or `yo`, so its four compound spellings preserve unique decoding. Each symbol can be decoded greedily to exactly one token. Vietnamese tokens contain no hyphens. Tests decode every EFF token paired with each compound, and reject a constructed ambiguous vocabulary. Original spellings and underscores remain literal token content. A fixed separator and a deterministic encoding add no randomness.

The core accepts one through twenty draws for testing. The UI accepts four through twenty. Words are not removed to meet length limits, truncated, sorted, selected for imagery or changed after sampling. The UI reports the actual codepoint and UTF-8 byte lengths so a user can check service compatibility. It cannot guarantee a verifier preserves the supplied text.

## What the displayed bits prove

Displayed whole bits are `bitLength(outcomeCount) - 1`, the exact floor of `log2(outcomeCount)` without floating-point rounding. Thus `2^bits <= outcomeCount < 2^(bits + 1)`. For uniform outcomes under the source model, the information-theoretic count is the logarithm of that space. The application does not measure physical entropy or certify downstream implementation/distribution.

Known settings and known wordlists are assumed public. Attackers do not need to discover them. Editing, favorite selection, banning repeated words, choosing a personally meaningful token or reusing a result changes assumptions. Offline KDF cost, rate limiting, MFA, phishing, credential stuffing and recovery are separate account properties.

## Lifecycle

Startup after integrity verification, settings changes, an explicit Generate now event and the visible 60-second rotation produce a secret. Results are shown by default. Show/hide is a volatile page-session preference, including across generation, clearing and tab visibility changes. A 480 ms decorative scramble uses separate Web Crypto draws and does not change the generated value or its count. Its nonselectable, aria-hidden element replaces the textarea during animation, and Copy stays disabled until the final value is available. Reduced motion skips it. Revisions and animation cancellation prevent obsolete frames restoring earlier values. Masked mode puts only a fixed-length mask in the textarea. Reveal intentionally exposes the value to DOM consumers. Copy intentionally exposes it to the platform clipboard. A monotonically incremented revision invalidates callbacks from earlier copy operations. Late success/failure cannot re-enable or rewrite a cleared/new result.

Rotation uses one explicit paused state. Focusing the result or copying sets it; Resume clears it even while the pointer stays on that button. Hover alone does not stop the countdown. Resume is temporarily disabled while a clipboard write is pending. Countdown ticks never reset the five-minute inactivity deadline. Pointer/keyboard/input activity resets that deadline. Clear cancels both timers. Page hide, hidden-document events and the inactivity timer clear the DOM, secret reference, controls and metrics. Returning to a visible page generates a fresh result rather than restoring the old one. Appearance-only storage matches shared VINASIG chrome. Secrets and generation preferences are never persisted. Timer throttling, crashes and process memory retention limit what cleanup can promise. No program can retract content already copied into another application through this mechanism.
