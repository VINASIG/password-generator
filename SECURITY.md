# Security policy

This project is an agent-assessed research preview. Maintenance is best effort, not a staffed incident-response service, independent security certification or production assurance.

## Supported versions

The latest published preview is the supported line once publication begins. Version 0.1.0 is the initial research preview undergoing publication checks. Report exact version, source commit, artifact SHA-256, browser and steps. Historical artifacts remain inspectable but are not automatically recommended.

## Private reporting

Use GitHub's private [Report a vulnerability](https://github.com/VINASIG/password-generator/security/advisories/new) form. Private vulnerability reporting was enabled and read back through GitHub's repository API on 7 October 2026. Submit security-sensitive details through that channel rather than a public issue.

If private reporting is unavailable, open an issue containing only a request for a private security contact. Omit exploitable details until a private channel is agreed. Do not assume an unverified email address is a security inbox. Never submit a real password, wallet seed, key, account credential or personal clipboard capture.

Useful reports describe the affected commit/artifact, a minimal synthetic fixture, expected/actual behavior and impact. Randomness/distribution, entropy presentation, CSP/privacy, lifecycle/clipboard, dependency/provenance, build drift and wordlist parsing issues are in scope. Participant/linguistic concerns are welcome but are not upgraded to observed evidence by an agent's opinion.

## Handling and disclosure

An acknowledgement within seven calendar days and an initial assessment within fourteen are targets, not guaranteed SLAs. Record affected versions/digests, reproduce with a synthetic regression, assess downstream impact, develop a fix, and publish an advisory with mitigation and upgrade instructions. Discuss disclosure timing with the reporter. Ninety days after acknowledgement is an initial planning target, adjusted by agreement. Active exploitation or an available mitigation may warrant earlier disclosure. There is no bounty promise or indefinite nondisclosure demand.

Do not silently replace a published artifact or wordlist. Fixes receive a new version and evidence. Dangerous old releases may be deprecated or withdrawn from recommended use without rewriting their bytes. Credit a reporter only with their consent and do not disclose secrets in an advisory.

A compromised OS, browser, extension or publisher identity is beyond the application's local protection boundary, but delivery weaknesses and misleading claims remain legitimate reports. See [the threat model](docs/SECURITY.md).
