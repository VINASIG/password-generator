import { planPassword, generatePassword } from "./password.ts";
import type { CharacterGroup } from "./password.ts";
import { prepareList, generatePhrase, phrasePlan } from "./phrase.ts";
import type { VerifiedList } from "./phrase.ts";
import { SOURCES } from "./generated/wordlists.ts";

const lang = document.documentElement.lang === "vi" ? "vi" : "en";
const copy = {
  vi: {
    ready: "Chọn thiết lập rồi tạo một kết quả mới.",
    changed: "Thiết lập đã đổi. Hãy tạo kết quả mới.",
    created: "Đã tạo. Lưu một bản duy nhất trong trình quản lý mật khẩu.",
    cleared:
      "Đã xóa kết quả khỏi trang. Nội dung đã sao chép có thể vẫn còn trong clipboard.",
    expired: "Đã xóa kết quả khi rời tab hoặc hết 5 phút.",
    invalid:
      "Kiểm tra độ dài và nhóm ký tự. Mỗi nhóm được chọn phải còn ít nhất một ký tự. Chỉ dùng ký tự ASCII hiển thị trong ô loại trừ.",
    failed:
      "Không thể tạo kết quả an toàn. Hãy tải lại bản đã xác minh hoặc dùng một trình quản lý mật khẩu đáng tin cậy.",
    unavailable:
      "Cần trình duyệt có Web Crypto và ngữ cảnh an toàn. Hãy mở bằng HTTPS, localhost hoặc bản HTML offline được trình duyệt hỗ trợ. Trang được nhúng trong iframe không thể tạo secret.",
    integrity: "Không thể xác minh dữ liệu từ vựng. Chức năng tạo đã bị khóa.",
    copied: "Đã sao chép. Clipboard và ứng dụng nhận có thể lưu nội dung này.",
    denied:
      "Trình duyệt không cho phép sao chép. Hãy hiện kết quả và tự sao chép nếu cần.",
    show: "Hiện kết quả",
    hide: "Ẩn kết quả",
    bits: "bit không gian sinh",
    characters: "ký tự Unicode",
    bytes: "byte UTF-8",
    low: "Không gian sinh dưới 80 bit. Tăng độ dài hoặc số từ nếu tình huống của bạn cần sức chống đoán lớn hơn. 80 bit là mốc tham khảo của công cụ, không phải chứng nhận bảo mật.",
    short:
      "Dưới 15 ký tự. NIST yêu cầu tối thiểu 15 cho mật khẩu xác thực một yếu tố ở phía dịch vụ. Chỉ giảm độ dài để tương thích với yêu cầu đã hiểu rõ.",
  },
  en: {
    ready: "Choose settings, then generate a new result.",
    changed: "Settings changed. Generate a new result.",
    created: "Generated. Save a unique result in your password manager.",
    cleared:
      "Result cleared from this page. Copied content may still remain in the clipboard.",
    expired: "Result cleared after leaving the tab or after 5 minutes.",
    invalid:
      "Check length and character groups. Every selected group must retain at least one character. Use only visible ASCII characters in the exclusion field.",
    failed:
      "Safe generation failed. Reload a verified artifact or use a trusted password manager.",
    unavailable:
      "Web Crypto and a secure context are required. Open over HTTPS, localhost or a browser-supported offline HTML file. Embedded pages cannot generate secrets.",
    integrity:
      "Wordlist integrity could not be verified. Generation is locked.",
    copied:
      "Copied. The clipboard and receiving application may retain this content.",
    denied:
      "Clipboard access was denied. Reveal the result and copy it yourself if needed.",
    show: "Reveal result",
    hide: "Hide result",
    bits: "bits of generation space",
    characters: "Unicode characters",
    bytes: "UTF-8 bytes",
    low: "Generation space is below 80 bits. Increase length or word count if your use needs more guessing resistance. 80 bits is a tool reference point, not a security certification.",
    short:
      "Below 15 characters. NIST requires a minimum of 15 for service-side single-factor passwords. Use a shorter length only for an understood compatibility requirement.",
  },
}[lang];

function element<T extends HTMLElement>(
  id: string,
  constructor: { new (...args: never[]): T },
): T {
  const result = document.getElementById(id);
  if (!(result instanceof constructor)) throw new Error("INVALID_INTERFACE");
  return result;
}
const settings = element("settings", HTMLFieldSetElement);
const generateButton = element("generate", HTMLButtonElement);
const revealButton = element("reveal", HTMLButtonElement);
const copyButton = element("copy", HTMLButtonElement);
const clearButton = element("clear", HTMLButtonElement);
const result = element("secret", HTMLTextAreaElement);
const status = element("status", HTMLParagraphElement);
const metrics = element("metrics", HTMLDListElement);
const bitCount = element("bit-count", HTMLElement);
const characterCount = element("character-count", HTMLElement);
const byteCount = element("byte-count", HTMLElement);
const warning = element("warning", HTMLParagraphElement);
const empty = element("empty-result", HTMLParagraphElement);
const passwordPanel = element("password-panel", HTMLDivElement);
const phrasePanel = element("phrase-panel", HTMLDivElement);
const experimental = element("experimental-note", HTMLParagraphElement);
let secret: string | null = null;
let revealed = false;
let revision = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let deadline = 0;
let lists: readonly VerifiedList[] = [];
let readyForGeneration = false;

function selected(name: string): string {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  if (!(checked instanceof HTMLInputElement))
    throw new Error("MISSING_SELECTION");
  return checked.value;
}
function input(id: string): HTMLInputElement {
  return element(id, HTMLInputElement);
}
function clear(message: string): void {
  revision++;
  secret = null;
  revealed = false;
  deadline = 0;
  clearTimeout(timer);
  timer = undefined;
  result.value = "";
  result.hidden = true;
  empty.hidden = false;
  metrics.hidden = true;
  bitCount.textContent = "";
  characterCount.textContent = "";
  byteCount.textContent = "";
  warning.textContent = "";
  revealButton.disabled = true;
  copyButton.disabled = true;
  clearButton.disabled = true;
  revealButton.textContent = copy.show;
  revealButton.setAttribute("aria-pressed", "false");
  status.textContent = message;
  status.dataset["state"] = "ready";
}
function currentList(): VerifiedList {
  const list = lists.find((candidate) => candidate.id === selected("wordlist"));
  if (list === undefined) throw new Error("LIST_NOT_READY");
  return list;
}
function updatePanels(): void {
  const isPassword = selected("mode") === "password";
  passwordPanel.hidden = !isPassword;
  phrasePanel.hidden = isPassword;
  experimental.hidden = isPassword || selected("wordlist") === "eff";
}
function setNumber(id: string, value: string): void {
  input(id).value = value;
  input(`${id}-range`).value = value;
}
function renderSecret(): void {
  result.value = revealed ? (secret ?? "") : "••••••••••••••••••••";
  result.hidden = false;
  empty.hidden = true;
  revealButton.textContent = revealed ? copy.hide : copy.show;
  revealButton.setAttribute("aria-pressed", String(revealed));
}

function updateLogo(): void {
  const source = document.querySelector("[data-brand-logo] source");
  const rgb = getComputedStyle(document.body)
    .backgroundColor.match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number);
  const luminance =
    rgb?.length === 3
      ? rgb.reduce((total, value, index) => {
          const channel = value / 255;
          return (
            total +
            (channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4) *
              ([0.2126, 0.7152, 0.0722][index] ?? 0)
          );
        }, 0)
      : 1;
  if (source instanceof HTMLSourceElement)
    source.media = luminance < 0.179 ? "all" : "not all";
}
element("theme", HTMLButtonElement).addEventListener("click", () => {
  const dark =
    getComputedStyle(document.documentElement).colorScheme === "dark";
  document.documentElement.dataset["theme"] = dark ? "light" : "dark";
  updateLogo();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener(
  "change",
  updateLogo,
);
matchMedia("(forced-colors: active)").addEventListener("change", updateLogo);
updateLogo();
element("theme", HTMLButtonElement).disabled = false;
settings.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.type === "range")
    setNumber(target.id.replace("-range", ""), target.value);
  if (
    target instanceof HTMLInputElement &&
    ["length", "words"].includes(target.id)
  )
    input(`${target.id}-range`).value = target.value;
  clear(copy.changed);
  updatePanels();
});
document
  .querySelectorAll<HTMLButtonElement>("[data-bits]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset["bits"]);
      const words = Math.ceil(target / Math.log2(currentList().tokens.length));
      setNumber("words", String(words));
      clear(copy.changed);
    });
  });
clearButton.addEventListener("click", () => {
  clear(copy.cleared);
});
revealButton.addEventListener("click", () => {
  if (secret === null) return;
  if (Date.now() >= deadline) {
    clear(copy.expired);
    return;
  }
  revealed = !revealed;
  renderSecret();
});
copyButton.addEventListener("click", () => {
  if (secret === null) return;
  if (Date.now() >= deadline) {
    clear(copy.expired);
    return;
  }
  const capturedRevision = revision;
  copyButton.disabled = true;
  try {
    const clipboard = (navigator as { clipboard?: Clipboard }).clipboard;
    if (typeof clipboard?.writeText !== "function")
      throw new Error("CLIPBOARD_UNAVAILABLE");
    void clipboard
      .writeText(secret)
      .then(() => {
        if (revision === capturedRevision && secret !== null)
          status.textContent = copy.copied;
      })
      .catch(() => {
        if (revision === capturedRevision && secret !== null)
          status.textContent = copy.denied;
      })
      .finally(() => {
        if (revision === capturedRevision && secret !== null)
          copyButton.disabled = false;
      });
  } catch {
    if (revision === capturedRevision) {
      status.textContent = copy.denied;
      copyButton.disabled = false;
    }
  }
});
generateButton.addEventListener("click", () => {
  if (!readyForGeneration) return;
  clear(copy.ready);
  try {
    let bits: number;
    if (selected("mode") === "password") {
      const lengthText = input("length").value;
      if (
        !/^\d{1,3}$/.test(lengthText) ||
        Number(lengthText) < 8 ||
        Number(lengthText) > 128
      )
        throw new Error("INVALID_LENGTH");
      const groups: CharacterGroup[] = [];
      for (const name of ["lower", "upper", "digits", "symbols"] as const)
        if (input(name).checked) groups.push(name);
      const plan = planPassword({
        length: Number(lengthText),
        groups,
        requireEach: input("require-each").checked,
        exclude: input("exclude").value,
        avoidAmbiguous: input("ambiguous").checked,
      });
      secret = generatePassword(plan);
      bits = plan.bits;
    } else {
      const wordsText = input("words").value;
      if (
        !/^\d{1,2}$/.test(wordsText) ||
        Number(wordsText) < 4 ||
        Number(wordsText) > 20
      )
        throw new Error("INVALID_WORDS");
      const words = Number(wordsText);
      const list = currentList();
      const separator = selected("separator");
      const plan = phrasePlan(list, words, separator);
      secret = generatePhrase(list, words, separator);
      bits = plan.bits;
    }
    const characters = Array.from(secret).length;
    const bytes = new TextEncoder().encode(secret).length;
    bitCount.textContent = String(bits);
    characterCount.textContent = String(characters);
    byteCount.textContent = String(bytes);
    metrics.hidden = false;
    warning.textContent =
      bits < 80 ? copy.low : characters < 15 ? copy.short : "";
    revealed = false;
    renderSecret();
    revealButton.disabled = false;
    copyButton.disabled = false;
    clearButton.disabled = false;
    status.textContent = copy.created;
    deadline = Date.now() + 300000;
    timer = setTimeout(() => {
      clear(copy.expired);
    }, 300000);
    element("result-title", HTMLHeadingElement).focus();
  } catch (error) {
    clear(
      error instanceof RangeError ||
        (error instanceof Error && error.message.startsWith("INVALID_"))
        ? copy.invalid
        : copy.failed,
    );
    status.dataset["state"] = "error";
  }
});
window.addEventListener("pagehide", () => {
  clear(copy.expired);
});
window.addEventListener("pageshow", () => {
  if (secret !== null && Date.now() >= deadline) clear(copy.expired);
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && secret !== null) clear(copy.expired);
});
document.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
  link.addEventListener("click", () => {
    if (secret !== null) clear(copy.expired);
  });
});

async function initialize(): Promise<void> {
  const provider = (
    globalThis as {
      crypto?: {
        getRandomValues?: Crypto["getRandomValues"];
        subtle?: { digest?: SubtleCrypto["digest"] };
      };
    }
  ).crypto;
  if (
    !globalThis.isSecureContext ||
    globalThis.top !== globalThis.self ||
    typeof provider?.getRandomValues !== "function" ||
    typeof provider.subtle?.digest !== "function"
  ) {
    status.textContent = copy.unavailable;
    status.dataset["state"] = "error";
    return;
  }
  try {
    lists = await Promise.all(SOURCES.map(prepareList));
    readyForGeneration = true;
    settings.disabled = false;
    generateButton.disabled = false;
    document
      .querySelectorAll<HTMLButtonElement>("[data-bits]")
      .forEach((button) => {
        button.disabled = false;
      });
    status.textContent = copy.ready;
    updatePanels();
  } catch {
    status.textContent = copy.integrity;
    status.dataset["state"] = "error";
  }
}
void initialize();
