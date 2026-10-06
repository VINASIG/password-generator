# License scopes

The repository owner authorizes an open-source VINASIG project and the purpose-based license selection in the adopted agent standards. These scopes do not assign third-party copyright or imply endorsement by a source contributor.

## Software grant

Except for the separately scoped materials below, VINASIG-authored software is free software under the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or, at your option, any later version. SPDX identifies this as `AGPL-3.0-or-later`. The complete standard text is in [LICENSE](LICENSE). It is supplied without warranty under those terms. Commercial use is allowed subject to the license.

| Material                           | Scope                                                                                        | Terms                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Application and build/test tooling | Authored TypeScript, CSS, HTML generation, configuration and executable examples             | AGPL-3.0-or-later                                                                 |
| Documentation                      | Authored narrative, methods, UI guidance and Markdown, excluding original quotations/notices | CC-BY-SA-4.0                                                                      |
| Vietnamese code                    | `src/vendor/vietphrase/`, unchanged upstream files                                           | LGPL-3.0-or-later, full LGPL and GPL companion texts retained                     |
| Vietnamese wordlists               | Original experimental profiles and retained provenance                                       | CC-BY-SA-4.0 with upstream source and corpus credits                              |
| English wordlist                   | EFF original lookup text and spelling-preserving derived text                                | CC-BY-4.0, credit Electronic Frontier Foundation and Joseph Bonneau               |
| Upstream source evidence           | Tatoeba credits, wordfreq notice, original source lock                                       | Original terms including CC BY 2.0 France and wordfreq's separate notice rights   |
| Fonts                              | Space Grotesk original TTF/WOFF2 and notice                                                  | OFL-1.1, unchanged font bytes and reserved-name conditions                        |
| Icons                              | Build-time Lucide SVG geometry                                                               | ISC and Feather MIT notices in `licenses/Lucide.txt`                              |
| Official identity                  | Original brand SVGs and embedded logos                                                       | [VINASIG Brand Usage Policy](BRAND_POLICY.md), not licensed by the software grant |
| Managed standards                  | `.vinasig/standards/` and `.agents/skills/`                                                  | Their retained [license scopes](.vinasig/standards/LICENSES.md)                   |
| Literal license text               | `licenses/`, legal notices and legal-code copies                                             | Original source rights, not rewritten into the app's primary grant                |

## Distribution and adoption

Provide corresponding application source, build scripts and notices for the actual distributed version. Modified AGPL software supporting remote interaction must prominently offer its Corresponding Source under section 13. The generator's source link and paired source/offline archives implement that distribution route. A source link to unrelated or unavailable code does not fulfill the intent, so public launch remains gated on actual source publication.

The Vietnamese component remains under LGPL. Keep its notices and full license texts with source and delivery. Embedding or minifying it does not make those terms disappear. The bundled code is readable and the source modules are included in the source archive. A downstream product needs to assess its own combined distribution and applicable modification/relinking obligations.

Retain wordlist attribution, source links, license links and modification indications. The EFF transformation removes only the lookup column. The Vietnamese texts are unchanged. Adapted Vietnamese data must comply with its share-alike terms. This project does not declare that JavaScript, binary or minified embedding waives data obligations, nor that the software grant replaces them. Data files remain separately identified and licensed.

Generation does not by itself license a user's account or secret under AGPL. Redistributing bundled wordlists, templates or covered source is a separate operation. The source archive includes every credited license and notice. `private: true` in package.json prevents npm publication, not source reuse.

New contributions must identify their applicable scope and preserve third-party rights. Do not assume blanket copyright assignment or legal approval from automated checks.
