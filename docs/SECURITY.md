# Threat model

The intended user obtains the authentic reviewed artifact, uses a trustworthy modern browser and operating system, generates a unique password or passphrase, and transfers it deliberately into a trusted password manager or service. Settings, lists and algorithms are public. The adversary may know all of them.

## Boundaries

| Concern                                | Implemented boundary                                                                                                                                                                        | Remaining risk                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Remote observation by application code | No runtime network API, `connect-src 'none'`, no tracking or report endpoint                                                                                                                | Initial HTTP/TLS hosting request, explicit navigation, malicious replaced artifact, compromised browser/network trust |
| Persistent application data            | No secret/settings storage, IndexedDB, history state, service worker or secret URL. Only finite theme/language preferences use Secure parent-domain cookies or bounded Web Storage fallback | Browser process memory, page/session infrastructure, extensions, swap and screenshots                                 |
| Randomness                             | Web Crypto required, unbiased rejection, bounded failures, no weak fallback                                                                                                                 | A compromised or malfunctioning provider returning plausible bytes cannot be authenticated by JavaScript              |
| Display                                | Visible by default, volatile show/hide preference, readonly masked output, cancellable decorative scramble                                                                                  | Screen capture, shoulder surfing and DOM-reading extensions after reveal or during an explicit copy transfer          |
| Clipboard                              | Explicit transfer only, animation/rotation guards, copy pauses rotation, denial guidance, revision guards, transient native-copy field cleanup, no clipboard read                           | OS/cloud clipboard history and receiving apps can retain content. Cleanup does not overwrite the system clipboard     |
| Embedding                              | Response `frame-ancestors 'none'` and X-Frame-Options, plus application top-level check                                                                                                     | Meta CSP alone cannot enforce the ancestor rule. A replaced artifact can remove all defenses                          |
| Input                                  | Bounded predefined alphabets/lists/counts, no HTML injection sinks, no arbitrary uploaded text                                                                                              | Service restrictions, Unicode transformations, unsupported characters and account recovery remain external            |
| Supply chain                           | No runtime package graph, exact dev lock, no install scripts, source pins, reproducible packaging and release attestation gate                                                              | Hashes do not authenticate an attacker-controlled source and metadata pair. CI/maintainer compromise remains possible |

## Fail-closed states

No secure context, missing RNG/digest, an embedded document or any failed wordlist integrity check leaves generation disabled. A random-source exception, rejection exhaustion, malformed settings or impossible policy clears any prior result and produces a generic error without secrets or error contents. No fallback uses time, UUIDs, `Math.random`, mouse events or additional user entropy. No bulk generation/history/export feature is provided.

## Static CSP

Both online and offline documents contain exact SHA-256 script/style hashes. Other scripts, inline event handlers, eval, network connections, workers, frames, objects, base URI and form submissions are restricted. Fonts and original SVG images are embedded data URLs. There is no violation reporting endpoint that could become a data route.

Online hosts must apply `dist/_headers` or equivalent response headers. Meta CSP cannot provide every header defense. Deployment checks need to read the actual served headers and artifacts. The local preview server applies the intended headers so browser tests exercise them. The offline top-level guard is additional defense, not proof of authentic code.

HTTPS responses include `Strict-Transport-Security: max-age=31536000`. This host-only policy does not set `includeSubDomains` or request preload. Per [RFC 6797](https://www.rfc-editor.org/rfc/rfc6797), a browser learns the policy through a valid HTTPS response and subsequently requires HTTPS for that hostname. It does not protect an initial unauthenticated HTTP visit or a compromised trusted publisher. The canonical HTTP origin was observed redirecting to HTTPS; actual release deployment must verify the HSTS header as well.

The canonical Cloudflare hostname has scoped rules disabling injected Web Analytics/RUM, Zaraz, Rocket Loader and email obfuscation, respecting origin cache headers, and removing NEL/Report-To network-reporting headers. Observed served bytes and headers are recorded in [the publication evidence](PUBLICATION.md). These are delivery settings, not a promise about every browser or network provider. An existing browser policy cached before a hosting change may persist until it expires. Cloudflare still receives the ordinary HTTPS request and can retain provider-side request information. No generated secret is part of that request.

## Lifetime and transfer

Lifecycle cleanup is best effort when the browser dispatches the relevant events and timers. It does not guarantee zeroization of strings, BigInts, engine copies, crash dumps, swap, caches or previously copied content. The application deliberately does not auto-write an empty clipboard, since that cannot reliably retract history and may destroy content copied later by the user.

Switching tabs or applications suspends presentation and rotation instead of discarding the result. Plaintext and animation are removed from the DOM, pending transfer callbacks are invalidated, and the existing secret remains in volatile page memory until five-minute inactivity expiry or actual page departure. Returning before expiry restores that secret and the remaining visible countdown without drawing a new one. Hidden time still counts toward inactivity, and expiry is checked before restoration. This owner-requested behavior replaces the earlier clear-on-every-visibility-transition policy. It trades earlier reference release for uninterrupted transfer between applications, without adding persistence, transmission or a longer inactivity lifetime.

Native Copy on masked output briefly selects the requested plaintext in the original readonly textarea, clipped completely out of view while a nonselectable mask overlay retains the presentation. The browser's default Copy action consumes that selection; the following task wipes the transfer and conditionally restores the mask/selection. Lifecycle cleanup also wipes it immediately. This path requires a trusted Copy event and is tested by real keyboard/browser Copy followed by Paste, including partial Unicode selection. There is no extra production input, background clipboard write or production `execCommand` fallback. A hidden result is a presentation choice, not protection from a compromised page or extension.

A web generator cannot bind a password to the intended account, prevent phishing, manage account recovery or guarantee verifier behavior. Prefer a trusted password manager for saving/autofill and phishing-resistant authentication when available. Do not use these strings directly as wallet seeds, protocol keys, SSH keypairs or nonces. Version 0.1 contains no cryptographic key export feature.

## Evidence labels

Automated verification, agent source inspection, external security review, external linguistic review, participant usability and production validation are separate categories. Only the first two currently have evidence. Correct sampling is not evidence that a vocabulary is memorable or culturally appropriate. Public release does not convert a research preview into a security certification.

Report vulnerabilities using [the disclosure policy](../SECURITY.md). Do not submit a real password or account credential as a reproduction fixture.
