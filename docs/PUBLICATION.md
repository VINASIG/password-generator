# Concrete publication plan

The owner authorized full publication on 7 October 2026 at `VINASIG/password-generator` and `password.vinasig.io.vn`, including the repository, disclosure channel, CI, release provenance, hosting/DNS, Search Console and related public inventory/profile updates. This record separates executed observations from remaining deployment steps.

## Observed state

- Public repository [VINASIG/password-generator](https://github.com/VINASIG/password-generator) was created on 7 October 2026. Description, README homepage and all nine discovery topics were saved and read back through the GitHub API.
- Private vulnerability reporting was enabled. GitHub's read API returned `enabled: true`.
- Repository Actions are enabled. Exact-commit verification and actual release provenance are pending execution.
- Cloudflare account/zone access was observed in the owner-provided dashboard. Hosting, custom-domain DNS, Search Console and related inventories are pending execution.

## GitHub

Proposed public repository is `VINASIG/password-generator`, default branch `main`. Description is `Static local password and passphrase generator with uniform sampling, offline builds and inspectable evidence`. Initial homepage is `https://github.com/VINASIG/password-generator#readme`. Topics are `password-generator`, `passphrase`, `web-crypto`, `privacy`, `security`, `offline`, `vietnamese`, `typescript` and `reproducible-builds`.

Immediately save and read back those Repo details when creating the repository. Enable private vulnerability reporting and verify its state before describing the advisory form as operational. Keep the current security policy's pre-publication state accurate until then. Read back pushed HEAD, default branch and CI for that exact revision. An authorized v0.1.0 release is a prerelease with `latest=false`, matching notes, tested assets and provenance. CI configuration alone is not successful CI.

## Static hosting and DNS

The owner-approved canonical origin is `https://password.vinasig.io.vn`. Choose Cloudflare Pages static hosting because its `_headers` file can deliver the required security response headers. The application requires no Pages Functions, worker, database or client API. The [Cloudflare headers documentation](https://developers.cloudflare.com/pages/configuration/headers/) limits those rules to static responses. Verify actual responses after deployment.

Proposed Pages project name is `password-generator`, connected repository is `VINASIG/password-generator`, production branch is `main`, root directory is `/`, output directory is `dist`, framework preset is none. Set `NODE_VERSION=24.21.0`, `SKIP_DEPENDENCY_INSTALL=1`, `PUBLIC_ORIGIN=https://password.vinasig.io.vn` for the canonical production build. Use this build command to pin npm and bind source identity:

```sh
npm install --global npm@12.2.0 && npm ci --ignore-scripts && SOURCE_COMMIT="$CF_PAGES_COMMIT_SHA" npm run build
```

Cloudflare's [build-image documentation](https://developers.cloudflare.com/pages/configuration/build-image/) supports explicit tool versions and skipping the automatic install. Its images are mutable, so record the actual build environment too. Preview origins must not be advertised as the canonical service. Hosting scripts, analytics, Rocket Loader, HTML/JS rewriting and minification that change hashed script/style bytes must remain disabled for this project. Verify served bytes and CSP instead of relying only on dashboard settings.

First associate `password.vinasig.io.vn` with the Pages project. Then use its actual confirmed Pages destination for the DNS CNAME. Do not invent a `.pages.dev` target before creation. Proposed record fields are type `CNAME`, name `password`, target the verified project host, TTL `Auto`, with proxy status consistent with Pages domain activation. The existing zone is `vinasig.io.vn` in account `ff374997a8dad2386d1eb0fe8a06504b`. [Cloudflare custom-domain instructions](https://developers.cloudflare.com/pages/configuration/custom-domains/) require project association before a manually created CNAME. Preserve existing DNS records.

After HTTPS and canonical routes are verified, change the GitHub homepage to the actual canonical URL and read it back. Check `/`, `/en/`, both offline downloads, `robots.txt`, `sitemap.xml`, licenses, CSP hashes, no external asset requests and real browser generation. Repeat the logo link and shared-chrome probes on deployed pages. Local checks do not substitute for deployed checks.

## Search Console and public project facts

The existing property `sc-domain:vinasig.io.vn` covers subdomains according to [Google's Domain-property documentation](https://support.google.com/webmasters/answer/34592). Verify access and ownership first. It should not need a duplicate DNS verification merely for this subdomain. Submit `https://password.vinasig.io.vn/sitemap.xml` only once it is served successfully and its two canonical URLs are accessible. Google's [sitemap instructions](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) distinguish sitemap submission from crawling/indexing. Record submitted, fetched and indexed separately.

Update the actual VINASIG website inventory and both `VINASIG/.github/profile/README.md` and `profile/README.vi.md` within authorized scope after source/site availability is verified. Suggested English wording is `Password Generator — local password and English/Vietnamese passphrase generation with standalone offline builds; research preview`. Vietnamese wording is `Password Generator — tạo password và passphrase tiếng Anh/tiếng Việt trên thiết bị, có bản offline; bản nghiên cứu`. Place it in the relevant tools/research section, preserving current project ordering. Experimental Vietnamese vocabulary remains explicitly labeled. Do not advertise participant validation, best-in-market status or guarantees against a compromised host.

Successful steps are recorded above. Unexecuted verification and account changes remain NOT_RUN until their actual results are observed. The original pre-publication lab record in VALIDATION.md remains separate from eventual public CI and deployment evidence.
