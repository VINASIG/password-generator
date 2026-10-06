import {
  Copy,
  Download,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  SunMoon,
  Trash2,
  WholeWord,
} from "lucide";
import type { IconNode } from "lucide";

export type Locale = "vi" | "en";
export const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? "",
  );
function icon(node: IconNode): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${node
    .map(
      ([name, attributes]) =>
        `<${name} ${Object.entries(attributes)
          .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
          .join(" ")}/>`,
    )
    .join("")}</svg>`;
}
const text = {
  vi: {
    title: "Tạo password và passphrase",
    description:
      "Sinh password và passphrase ngay trong trình duyệt với Web Crypto. Không gửi secret ra ngoài. Có bản HTML offline và phương pháp có thể kiểm chứng.",
    lead: "Sinh ngay trên thiết bị của bạn. Chọn password cho trình quản lý mật khẩu, hoặc passphrase khi cần đọc và nhập lại.",
    skip: "Đến công cụ",
    theme: "Đổi giao diện sáng tối",
    settings: "Thiết lập",
    password: "Password",
    phrase: "Passphrase",
    pwdHint: "Chuỗi ký tự ngẫu nhiên",
    phraseHint: "Các từ được chọn ngẫu nhiên",
    length: "Số ký tự",
    lengthHint: "Từ 8 đến 128 ký tự. Mặc định là 20.",
    groups: "Nhóm ký tự",
    lower: "Chữ thường",
    upper: "Chữ hoa",
    digits: "Chữ số",
    symbols: "Ký hiệu",
    compatibility: "Yêu cầu riêng của website",
    require: "Có ít nhất một ký tự từ mỗi nhóm đã chọn",
    requireHint:
      "Bật khi website yêu cầu. Công cụ chọn đều trong toàn bộ các chuỗi đáp ứng điều kiện.",
    ambiguous: "Bỏ các ký tự dễ nhầm Il1O0o",
    exclude: "Loại thêm ký tự",
    excludeHint:
      "Nhập chính xác ký tự ASCII cần loại. Không thêm khoảng trắng.",
    lists: "Bộ từ vựng",
    eff: "Tiếng Anh EFF",
    effHint: "7.776 từ, giữ nguyên chính tả nguồn",
    vi: "Tiếng Việt có dấu",
    viHint: "2.966 token, thử nghiệm do agents tuyển chọn",
    ascii: "Tiếng Việt không dấu",
    asciiHint: "2.389 token, thử nghiệm sau gộp trùng",
    experimental:
      "Hai bộ tiếng Việt chưa được người Việt kiểm thử khả năng ghi nhớ, mức quen thuộc hoặc lỗi gõ. Không có profile tiếng Việt được khuyến nghị. Dấu gạch dưới trong từ ghép là một phần của token. Bản không dấu làm mất phân biệt nghĩa.",
    words: "Số từ",
    wordsHint: "Từ 4 đến 20 từ. Các từ có thể lặp lại.",
    target: "Đặt số từ để có ít nhất",
    bits80: "80 bit",
    bits128: "128 bit",
    separator: "Ngăn cách các từ",
    space: "Khoảng trắng",
    period: "Dấu chấm",
    delimiterHint:
      "Giữ nguyên dấu nối của từ tiếng Anh và gạch dưới của token tiếng Việt. Khoảng trắng hoặc dấu chấm giúp ranh giới token không bị nhập nhằng.",
    generate: "Tạo kết quả mới",
    result: "Kết quả",
    empty: "Kết quả chỉ xuất hiện khi bạn bấm tạo.",
    resultLabel: "Password hoặc passphrase vừa tạo",
    reveal: "Hiện kết quả",
    copy: "Sao chép",
    clear: "Xóa",
    bits: "Bit không gian sinh",
    chars: "Ký tự Unicode",
    bytes: "Byte UTF-8",
    metricHint:
      "Số bit được làm tròn xuống từ số kết quả đồng xác suất. Con số này không phải điểm đánh giá tài khoản hay thời gian bị crack.",
    starting: "Đang kiểm tra tính toàn vẹn của các bộ từ vựng.",
    nojs: "Công cụ cần JavaScript và Web Crypto. Chức năng sinh bị khóa khi không chạy được mã đã kiểm tra.",
    lifecycle:
      "Không lưu lịch sử. Kết quả bị xóa khỏi trang khi rời tab, đổi thiết lập hoặc sau 5 phút. Clipboard và ứng dụng nhận có thể vẫn giữ nội dung.",
    offline: "Dùng bản offline",
    offlineHint:
      "Bản HTML đã build chứa sẵn mã, font và dữ liệu. Mở trong trình duyệt tương thích rồi ngắt mạng. Kiểm tra chữ ký nguồn và checksum của bản phát hành trước khi dùng.",
    download: "Tải HTML tiếng Việt",
    downloaded: "Bạn đang dùng bản HTML offline. Bản này không tự cập nhật.",
    limits: "Phương pháp và giới hạn",
    faq1: "Secret có được gửi ra ngoài không?",
    answer1:
      "Mã sinh không có API mạng, analytics, storage hoặc service worker. Content Security Policy chặn kết nối. Tải trang và bấm liên kết vẫn tạo kết nối bình thường. Trang bị thay mã ở máy chủ, extension, hệ điều hành hoặc trình duyệt bị xâm nhập có thể làm lộ secret. Bản offline đã xác minh giúp giảm việc phải tin máy chủ ở lần sử dụng sau.",
    faq2: "Bit không gian sinh có nghĩa gì?",
    answer2:
      "Với các ký tự độc lập, số kết quả là kích thước bảng ký tự mũ độ dài. Với passphrase, đó là số token mũ số từ. Khi bắt buộc có đủ nhóm ký tự, công cụ đếm chính xác các chuỗi hợp lệ rồi chọn đều một chuỗi. Dấu phân cách cố định không cộng thêm bit. Nếu sửa, bỏ từ hoặc chọn lại theo sở thích, mô hình này không còn mô tả lựa chọn của bạn.",
    faq3: "Tại sao không có điểm mạnh yếu hoặc thời gian crack?",
    answer3:
      "Tốc độ đoán phụ thuộc cách dịch vụ lưu mật khẩu, chi phí KDF, rate limit, khả năng tấn công và việc bạn có tái sử dụng secret hay không. Dùng một kết quả riêng cho mỗi tài khoản, lưu trong trình quản lý mật khẩu, ưu tiên passkey hoặc MFA khi có thể. Đây là công cụ sinh secret, không phải hệ thống chống phishing.",
    faq4: "Có thể dùng làm khóa mật mã không?",
    answer4:
      "Không dùng đầu ra này trực tiếp làm khóa giao thức, seed ví, nonce hoặc cặp khóa. Hãy dùng công cụ chuyên biệt và API tạo khóa của giao thức. Các định dạng đó có yêu cầu phân phối, tuổi thọ, lưu trữ và xác thực riêng.",
    faq5: "Tiếng Việt đã được xác nhận dễ nhớ hơn chưa?",
    answer5:
      "Chưa. Các phép kiểm tra kỹ thuật và proxy từ corpus không thay thế quan sát người Việt. Nhãn thử nghiệm áp dụng cả bộ có dấu lẫn không dấu. Website có thể thay đổi hoặc chuẩn hóa Unicode khi nhận mật khẩu, nên hãy kiểm tra khả năng nhập lại trước khi dùng cho tài khoản.",
    evidence: "Đọc nghiên cứu, thuật toán và bằng chứng kiểm thử",
    licenses: "Giấy phép",
    source: "Mã nguồn",
    issue: "Báo lỗi",
    licenseCopy:
      "Phần mềm của ứng dụng theo AGPL-3.0-or-later. Mã Vietnamese Passphrase giữ LGPL-3.0-or-later. Bộ từ tiếng Việt và tài liệu có giấy phép riêng CC-BY-SA-4.0. Bộ EFF ghi công Electronic Frontier Foundation theo CC-BY-4.0. Space Grotesk theo OFL-1.1. Icon Lucide giữ giấy phép ISC và MIT của Feather. Nhãn hiệu VINASIG được điều chỉnh bởi Brand Policy.",
    sourceBundle:
      "Mã nguồn tương ứng và toàn bộ thông báo ghi công có trong repo và gói phát hành. Giấy phép dữ liệu không được đổi thành giấy phép của ứng dụng.",
  },
  en: {
    title: "Generate passwords and passphrases",
    description:
      "Generate passwords and passphrases locally with Web Crypto. No secret transmission. Standalone offline HTML and inspectable methods.",
    lead: "Generate on your device. Choose a password for your password manager, or a passphrase when you need to read and type it again.",
    skip: "Go to generator",
    theme: "Change light or dark appearance",
    settings: "Settings",
    password: "Password",
    phrase: "Passphrase",
    pwdHint: "Random characters",
    phraseHint: "Randomly selected words",
    length: "Character count",
    lengthHint: "From 8 to 128 characters. Default is 20.",
    groups: "Character groups",
    lower: "Lowercase",
    upper: "Uppercase",
    digits: "Digits",
    symbols: "Symbols",
    compatibility: "Website compatibility requirements",
    require: "Require at least one character from every selected group",
    requireHint:
      "Enable when a website requires it. Selection is uniform over all strings satisfying the condition.",
    ambiguous: "Exclude similar characters Il1O0o",
    exclude: "Exclude other characters",
    excludeHint:
      "Enter the exact visible ASCII characters to exclude. Do not add spaces.",
    lists: "Wordlist",
    eff: "English EFF",
    effHint: "7,776 words with original source spelling",
    vi: "Vietnamese with accents",
    viHint: "2,966 tokens, experimental agent curation",
    ascii: "Vietnamese without accents",
    asciiHint: "2,389 tokens, experimental after deduplication",
    experimental:
      "Neither Vietnamese list has participant evidence about recall, familiarity or typing errors. No Vietnamese profile is recommended. Underscores inside compounds are part of the token. The accent-free list loses semantic distinctions.",
    words: "Word count",
    wordsHint: "From 4 to 20 words. Repeated words are allowed.",
    target: "Set word count for at least",
    bits80: "80 bits",
    bits128: "128 bits",
    separator: "Word separator",
    space: "Space",
    period: "Period",
    delimiterHint:
      "English hyphens and Vietnamese compound underscores remain unchanged. A space or period keeps token boundaries unambiguous.",
    generate: "Generate new result",
    result: "Result",
    empty: "A result appears only when you generate one.",
    resultLabel: "Generated password or passphrase",
    reveal: "Reveal result",
    copy: "Copy",
    clear: "Clear",
    bits: "Generation space in bits",
    chars: "Unicode characters",
    bytes: "UTF-8 bytes",
    metricHint:
      "Bits are rounded down from the number of equally likely outputs. This is not an account security rating or a time-to-crack estimate.",
    starting: "Checking wordlist integrity.",
    nojs: "JavaScript and Web Crypto are required. Generation stays locked when the checked code cannot run.",
    lifecycle:
      "No history is saved. Results are cleared from this page when leaving the tab, changing settings or after 5 minutes. The clipboard and receiving application may retain them.",
    offline: "Use offline",
    offlineHint:
      "The built HTML includes code, fonts and data. Open in a compatible browser, then disconnect. Verify release provenance and checksums before use.",
    download: "Download English HTML",
    downloaded:
      "This is a standalone offline HTML file. It does not update itself.",
    limits: "Methods and limits",
    faq1: "Are secrets sent anywhere?",
    answer1:
      "Generation code has no network API, analytics, storage or service worker. Content Security Policy blocks connections. Page loads and clicked links still make ordinary connections. Replaced hosting code, extensions, a compromised browser or operating system can expose secrets. A verified offline artifact reduces ongoing trust in the host.",
    faq2: "What do generation-space bits mean?",
    answer2:
      "For independent characters, the number of outcomes is alphabet size raised to length. For passphrases, it is token count raised to word count. With required character groups, the generator counts valid strings exactly and samples uniformly. A fixed separator adds no bits. Editing, removing words or repeatedly selecting favorites changes the selection model.",
    faq3: "Why no strength score or time to crack?",
    answer3:
      "Guessing cost depends on the service password storage, KDF cost, rate limits, attacker resources and password reuse. Save a unique result for each account in your password manager. Prefer passkeys or MFA when available. This generator does not prevent phishing.",
    faq4: "Can outputs be used as cryptographic keys?",
    answer4:
      "Do not directly use these outputs as protocol keys, wallet seeds, nonces or key pairs. Use a specialized protocol tool and its key-generation API. These formats have separate distribution, lifetime, storage and authentication requirements.",
    faq5: "Are Vietnamese phrases proven easier to remember?",
    answer5:
      "No. Engineering tests and corpus proxies cannot replace observation of Vietnamese participants. Both accented and accent-free lists are experimental. A website may normalize or transform Unicode passwords, so verify that you can enter one again before relying on it.",
    evidence: "Read research, algorithms and validation evidence",
    licenses: "Licenses",
    source: "Source code",
    issue: "Report an issue",
    licenseCopy:
      "Application software is AGPL-3.0-or-later. Vietnamese Passphrase code retains LGPL-3.0-or-later. Vietnamese wordlists and documentation have separate CC-BY-SA-4.0 terms. The EFF list credits the Electronic Frontier Foundation under CC-BY-4.0. Space Grotesk is OFL-1.1. Lucide icons retain ISC and Feather MIT terms. VINASIG trademarks are governed by the Brand Policy.",
    sourceBundle:
      "Corresponding source and complete attribution notices are provided in the repository and release bundle. Data licenses are not replaced by the application license.",
  },
} as const;

export function page(options: {
  locale: Locale;
  offline: boolean;
  css: string;
  js: string;
  csp: string;
  lightLogo: string;
  darkLogo: string;
  favicon: string;
  sourceCommit?: string;
  publicOrigin?: string;
  legalText: string;
}): string {
  const { locale, offline } = options;
  const t = text[locale];
  const legalHtml = escapeHtml(options.legalText).replace(
    /[ \t]+(?=\r?$)/gm,
    (whitespace) =>
      Array.from(whitespace, (character) =>
        character === " " ? "&#32;" : "&#9;",
      ).join(""),
  );
  const discovery = offline
    ? '<meta name="robots" content="noindex">'
    : options.publicOrigin
      ? `<link rel="canonical" href="${options.publicOrigin}${locale === "vi" ? "/" : "/en/"}"><link rel="alternate" hreflang="vi" href="${options.publicOrigin}/"><link rel="alternate" hreflang="en" href="${options.publicOrigin}/en/"><link rel="alternate" hreflang="x-default" href="${options.publicOrigin}/"><meta property="og:title" content="${escapeHtml(t.title)} | VINASIG"><meta property="og:description" content="${escapeHtml(t.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${options.publicOrigin}${locale === "vi" ? "/" : "/en/"}"><meta property="og:locale" content="${locale === "vi" ? "vi_VN" : "en_US"}">`
      : "";
  const repository = "https://github.com/VINASIG/password-generator";
  const source = options.sourceCommit
    ? `${repository}/tree/${options.sourceCommit}`
    : repository;
  const languageHref = offline
    ? locale === "vi"
      ? "./en.html"
      : "./vi.html"
    : locale === "vi"
      ? "/en/"
      : "/";
  const checked = (condition: boolean): string => (condition ? " checked" : "");
  const radio = (
    name: string,
    value: string,
    label: string,
    hint: string,
    active: boolean,
  ): string =>
    `<label class="choice"><input type="radio" name="${name}" value="${escapeHtml(value)}"${checked(active)}><span>${label}${hint ? `<small>${hint}</small>` : ""}</span></label>`;
  const check = (id: string, label: string, active: boolean): string =>
    `<label class="check"><input type="checkbox" id="${id}"${checked(active)}><span>${label}</span></label>`;
  const count = (
    id: string,
    label: string,
    min: number,
    max: number,
    value: number,
    hint: string,
  ): string =>
    `<div class="field"><label for="${id}">${label}</label><div class="number-control"><input type="range" id="${id}-range" min="${min}" max="${max}" value="${value}" aria-label="${label}"><input type="text" id="${id}" value="${value}" inputmode="numeric" pattern="[0-9]+" maxlength="3" autocomplete="off" aria-describedby="${id}-hint"></div><p class="hint" id="${id}-hint">${hint}</p></div>`;
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escapeHtml(options.csp)}"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>${t.title} | VINASIG</title><meta name="description" content="${t.description}">${discovery}<link rel="icon" type="image/svg+xml" href="${options.favicon}"><style>${options.css}</style></head>
<body><a class="skip-link" href="#generator">${t.skip}</a><div data-site-shell class="app-shell">
<header data-site-header><a data-brand-logo href="https://vinasig.io.vn/" aria-label="VINASIG"><picture><source type="image/svg+xml" srcset="${options.darkLogo}" media="(prefers-color-scheme: dark)"><img src="${options.lightLogo}" width="540" height="140" alt="VINASIG"></picture></a><div class="site-preferences"><button type="button" id="theme" data-theme-toggle aria-label="${t.theme}" disabled>${icon(SunMoon)}</button><a class="language-switch" data-copy-notation="ISO 639 language code" href="${languageHref}" lang="${locale === "vi" ? "en" : "vi"}" hreflang="${locale === "vi" ? "en" : "vi"}" aria-label="${locale === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}">${locale === "vi" ? "EN" : "VI"}</a></div></header>
<main><div class="intro"><h1>${t.title}</h1><p class="lead">${t.lead}</p></div>
<div class="workspace" id="generator"><section class="settings-surface" aria-labelledby="settings-title"><h2 id="settings-title">${icon(ShieldCheck)} ${t.settings}</h2><fieldset id="settings" disabled><legend class="sr-only">${t.settings}</legend>
<div class="choices">${radio("mode", "password", `${icon(KeyRound)} ${t.password}`, t.pwdHint, true)}${radio("mode", "phrase", `${icon(WholeWord)} ${t.phrase}`, t.phraseHint, false)}</div>
<div id="password-panel">${count("length", t.length, 8, 128, 20, t.lengthHint)}<fieldset class="field"><legend>${t.groups}</legend><div class="checks">${check("lower", `${t.lower} a-z`, true)}${check("upper", `${t.upper} A-Z`, true)}${check("digits", `${t.digits} 0-9`, true)}${check("symbols", `${t.symbols} !@#`, true)}</div></fieldset>
<details id="compatibility"><summary>${t.compatibility}</summary><div class="field">${check("require-each", t.require, false)}<p class="hint">${t.requireHint}</p></div><div class="field">${check("ambiguous", t.ambiguous, false)}</div><div class="field"><label for="exclude">${t.exclude}</label><input type="text" id="exclude" maxlength="94" autocomplete="off" spellcheck="false" aria-describedby="exclude-hint"><p class="hint" id="exclude-hint">${t.excludeHint}</p></div></details></div>
<div id="phrase-panel" hidden><fieldset class="field"><legend>${t.lists}</legend><div class="list-choices">${radio("wordlist", "eff", t.eff, t.effHint, true)}${radio("wordlist", "experimental-agent-vi", t.vi, t.viHint, false)}${radio("wordlist", "experimental-agent-ascii", t.ascii, t.asciiHint, false)}</div></fieldset><p id="experimental-note" class="experimental" hidden>${t.experimental}</p>${count("words", t.words, 4, 20, 7, t.wordsHint)}<div class="bit-shortcuts"><span>${t.target}</span><button type="button" data-bits="80" disabled>${t.bits80}</button><button type="button" data-bits="128" disabled>${t.bits128}</button></div><fieldset class="field"><legend>${t.separator}</legend><div class="choices">${radio("separator", " ", t.space, "", true)}${radio("separator", ".", t.period, "", false)}</div><p class="hint">${t.delimiterHint}</p></fieldset></div></fieldset>
<button type="button" class="primary generate" id="generate" disabled>${icon(RefreshCw)} ${t.generate}</button><noscript><p class="warning">${t.nojs}</p></noscript></section>
<section class="result-surface" aria-labelledby="result-title"><h2 id="result-title" tabindex="-1">${t.result}</h2><p id="empty-result" class="empty-result">${t.empty}</p><label class="sr-only" for="secret">${t.resultLabel}</label><textarea id="secret" rows="3" readonly autocomplete="off" spellcheck="false" autocapitalize="off" translate="no" hidden></textarea><div class="result-actions"><button type="button" id="reveal" aria-pressed="false" disabled>${t.reveal}</button><button type="button" id="copy" disabled>${icon(Copy)} ${t.copy}</button><button type="button" id="clear" disabled>${icon(Trash2)} ${t.clear}</button></div>
<dl class="metrics" id="metrics" hidden><div><dt>${t.bits}</dt><dd id="bit-count"></dd></div><div><dt>${t.chars}</dt><dd id="character-count"></dd></div><div><dt>${t.bytes}</dt><dd id="byte-count"></dd></div></dl><p class="hint">${t.metricHint}</p><p id="warning" class="warning"></p><p id="status" role="status" aria-live="polite" aria-atomic="true">${t.starting}</p><p class="hint lifecycle">${t.lifecycle}</p></section></div>
<section class="offline prose" aria-labelledby="offline-title"><h2 id="offline-title">${icon(Download)} ${t.offline}</h2><p>${offline ? t.downloaded : t.offlineHint}</p>${offline ? "" : `<a class="button-link" download="vinasig-password-${locale}.html" href="/offline/${locale}.html">${t.download}</a>`}</section>
<section class="prose methods" aria-labelledby="methods-title"><h2 id="methods-title">${t.limits}</h2>${([1, 2, 3, 4, 5] as const).map((number) => `<details><summary>${t[`faq${number}`]}</summary><p>${t[`answer${number}`]}</p></details>`).join("")}<p><a href="${repository}/blob/${options.sourceCommit ?? "main"}/docs/RESEARCH.md">${t.evidence}</a></p></section>
<section class="prose" id="licenses"><details><summary>${t.licenses}</summary><p>${t.licenseCopy}</p><p>${t.sourceBundle}</p><p><a href="${repository}/blob/${options.sourceCommit ?? "main"}/NOTICE.md">${t.licenses}</a></p>${offline ? `<pre class="legal-text" tabindex="0">${legalHtml}</pre>` : '<p><a href="/licenses/NOTICE.txt"><code>NOTICE</code></a> · <a href="/licenses/AGPL-3.0-or-later.txt"><code>AGPL-3.0-or-later</code></a> · <a href="/licenses/SpaceGrotesk-OFL.txt"><code>OFL-1.1</code></a> · <a href="/licenses/Lucide.txt">Lucide</a></p>'}</details></section></main>
<footer data-site-footer><a class="footer-home" href="https://vinasig.io.vn/">VINASIG</a><nav class="footer-links" aria-label="${t.source}"><a href="${source}">${t.source}</a><a href="${repository}/issues">${t.issue}</a><a href="#licenses">${t.licenses}</a></nav></footer></div><script>${options.js}</script></body></html>\n`;
}
