import {
  planPassword,
  generatePassword,
  CHARACTER_GROUPS,
} from "./password.ts";
import type { CharacterGroup } from "./password.ts";
import { prepareList, generatePhrase, phrasePlan } from "./phrase.ts";
import type { VerifiedList } from "./phrase.ts";
import { SOURCES } from "./generated/wordlists.ts";
import {
  boundedCount,
  scrambleFrame,
  ROTATION_MILLISECONDS,
  IDLE_MILLISECONDS,
  SCRAMBLE_MILLISECONDS,
  SCRAMBLE_HOLD_MILLISECONDS,
  maskSecret,
  selectedSecret,
} from "./presentation.ts";

const lang = document.documentElement.lang === "vi" ? "vi" : "en";
const copy = {
  vi: {
    ready: "Sẵn sàng tạo kết quả mới.",
    created: "Đã tạo kết quả mới.",
    expired: "Đã xóa kết quả khi rời tab hoặc không thao tác trong 5 phút.",
    lengthError: "Nhập số nguyên từ 8 đến 128 ký tự.",
    wordsError: "Nhập số nguyên từ 4 đến 20 từ.",
    groupsError: "Chọn ít nhất một nhóm ký tự.",
    excludeError: "Chỉ nhập ký tự ASCII hiển thị. Không thêm khoảng trắng.",
    emptyGroup:
      "Một nhóm đã chọn không còn ký tự. Bỏ bớt ký tự loại trừ hoặc bỏ chọn nhóm đó.",
    failed:
      "Không thể tạo kết quả an toàn. Hãy tải lại bản đã xác minh hoặc dùng một trình quản lý mật khẩu đáng tin cậy.",
    unavailable:
      "Cần trình duyệt có Web Crypto và ngữ cảnh an toàn. Hãy mở bằng HTTPS, localhost hoặc bản HTML offline được trình duyệt hỗ trợ. Trang được nhúng trong iframe không thể tạo secret.",
    integrity: "Không thể xác minh dữ liệu từ vựng. Chức năng tạo đã bị khóa.",
    copied: "Đã sao chép. Clipboard và ứng dụng nhận có thể lưu nội dung này.",
    denied:
      "Trình duyệt không cho phép sao chép. Hãy hiện kết quả và tự sao chép nếu cần.",
    pause: "Tạm dừng tự tạo",
    resume: "Tiếp tục tự tạo",
    countdown: (seconds: number) => `Tạo mới sau ${seconds} giây`,
    countdownStart: "Tạo mới sau ",
    countdownEnd: " giây",
    paused: "Đếm ngược đang tạm dừng",
    light: "Chuyển sang giao diện sáng",
    dark: "Chuyển sang giao diện tối",
    show: "Hiện kết quả",
    hide: "Ẩn kết quả",
    bits: "bit không gian sinh",
    characters: "ký tự Unicode",
    bytes: "byte UTF-8",
    low: "Không gian sinh dưới 80 bit. Bạn có thể tăng số ký tự. 80 bit là mốc tham khảo của công cụ, không phải chứng nhận bảo mật.",
    lowWords:
      "Không gian sinh dưới 80 bit. Bấm 80 bit hoặc 128 bit ở trên để tăng số từ. Đây là mốc tham khảo của công cụ, không phải chứng nhận bảo mật.",
    short:
      "Dưới 15 ký tự. NIST yêu cầu tối thiểu 15 cho mật khẩu xác thực một yếu tố ở phía dịch vụ. Chỉ giảm độ dài để tương thích với yêu cầu đã hiểu rõ.",
  },
  en: {
    ready: "Ready to generate a new result.",
    created: "New result generated.",
    expired:
      "Result cleared after leaving the tab or 5 minutes without interaction.",
    lengthError: "Enter a whole number from 8 to 128 characters.",
    wordsError: "Enter a whole number from 4 to 20 words.",
    groupsError: "Select at least one character group.",
    excludeError: "Enter only visible ASCII characters. Do not add spaces.",
    emptyGroup:
      "A selected group has no characters left. Remove some exclusions or deselect that group.",
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
    pause: "Pause automatic generation",
    resume: "Resume automatic generation",
    countdown: (seconds: number) => `New result in ${seconds} seconds`,
    countdownStart: "New result in ",
    countdownEnd: " seconds",
    paused: "Countdown paused",
    light: "Switch to light theme",
    dark: "Switch to dark theme",
    show: "Reveal result",
    hide: "Hide result",
    bits: "bits of generation space",
    characters: "Unicode characters",
    bytes: "UTF-8 bytes",
    low: "Generation space is below 80 bits. You can increase the character count. 80 bits is a tool reference point, not a security certification.",
    lowWords:
      "Generation space is below 80 bits. Choose 80 bits or 128 bits above to increase the word count. These are tool reference points, not security certifications.",
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
const pauseButton = element("pause", HTMLButtonElement);
const result = element("secret", HTMLTextAreaElement);
const scramble = element("scramble", HTMLDivElement);
const status = element("status", HTMLParagraphElement);
const metrics = element("metrics", HTMLDListElement);
const bitCount = element("bit-count", HTMLElement);
const characterCount = element("character-count", HTMLElement);
const byteCount = element("byte-count", HTMLElement);
const lengthWarning = element("length-warning", HTMLParagraphElement);
const wordsWarning = element("words-warning", HTMLParagraphElement);
const empty = element("empty-result", HTMLParagraphElement);
const passwordPanel = element("password-panel", HTMLDivElement);
const phrasePanel = element("phrase-panel", HTMLDivElement);
const rotation = element("rotation", HTMLDivElement);
const progress = element("countdown", HTMLProgressElement);
const countdownText = element("countdown-text", HTMLSpanElement);
const motion = matchMedia("(prefers-reduced-motion: reduce)");
let secret: string | null = null;
let revealed = true;
let revision = 0;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let rotationTimer: ReturnType<typeof setInterval> | undefined;
let frame = 0;
let lastActivity = Date.now();
let remaining = ROTATION_MILLISECONDS;
let previousTick = 0;
let paused = false;
let copying = false;
let active = !document.hidden;
let lists: readonly VerifiedList[] = [];
let readyForGeneration = false;
let nativeCopyActive = false;
let nativeCopyTimer: ReturnType<typeof setTimeout> | undefined;

function selected(name: string): string {
  const checked = document.querySelector('input[name="' + name + '"]:checked');
  if (!(checked instanceof HTMLInputElement))
    throw new Error("MISSING_SELECTION");
  return checked.value;
}
function input(id: string): HTMLInputElement {
  return element(id, HTMLInputElement);
}
function stopScramble(): void {
  cancelAnimationFrame(frame);
  frame = 0;
  scramble.textContent = "";
  scramble.hidden = true;
}
function stopNativeCopy(): void {
  clearTimeout(nativeCopyTimer);
  nativeCopyTimer = undefined;
  if (nativeCopyActive) {
    result.value = "";
    result.classList.remove("native-copy");
    nativeCopyActive = false;
  }
}
function clear(message: string): void {
  revision++;
  secret = null;
  copying = false;
  clearTimeout(idleTimer);
  clearInterval(rotationTimer);
  idleTimer = undefined;
  rotationTimer = undefined;
  stopScramble();
  stopNativeCopy();
  result.value = "";
  result.hidden = true;
  empty.hidden = false;
  rotation.hidden = true;
  metrics.hidden = true;
  bitCount.textContent = "";
  characterCount.textContent = "";
  byteCount.textContent = "";
  for (const warning of [lengthWarning, wordsWarning]) {
    warning.textContent = "";
    warning.hidden = true;
  }
  revealButton.disabled = true;
  copyButton.disabled = true;
  pauseButton.disabled = true;
  updateReveal();
  status.textContent = message;
  status.dataset["state"] = "ready";
}
function updateReveal(): void {
  const label = element("reveal-label", HTMLSpanElement);
  const nextLabel = revealed ? copy.hide : copy.show;
  if (label.textContent !== nextLabel) label.textContent = nextLabel;
  element("show-icon", HTMLElement).hidden = revealed;
  element("hide-icon", HTMLElement).hidden = !revealed;
  revealButton.setAttribute("aria-pressed", String(revealed));
}
function clearFieldErrors(): void {
  for (const id of ["length", "words", "groups", "exclude"]) {
    const error = element(id + "-error", HTMLParagraphElement);
    error.textContent = "";
    error.hidden = true;
  }
  for (const id of [
    "length",
    "words",
    "exclude",
    "lower",
    "upper",
    "digits",
    "symbols",
  ])
    input(id).setAttribute("aria-invalid", "false");
}
function fieldError(id: string, message: string): void {
  const error = element(id + "-error", HTMLParagraphElement);
  error.textContent = message;
  error.hidden = false;
  if (id === "groups") {
    for (const group of ["lower", "upper", "digits", "symbols"])
      input(group).setAttribute("aria-invalid", "true");
  } else input(id).setAttribute("aria-invalid", "true");
}
function fitResult(): void {
  if (secret === null || nativeCopyActive) return;
  const wasHidden = result.hidden;
  const previousValue = result.value;
  const { selectionStart, selectionEnd, selectionDirection } = result;
  result.value = revealed ? secret : maskSecret(secret);
  result.hidden = false;
  result.style.height = "0px";
  const height = `${Math.ceil(result.scrollHeight)}px`;
  result.style.height = height;
  scramble.style.height = height;
  result.value = previousValue;
  result.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
  result.hidden = wasHidden;
}
function armIdleTimer(): void {
  clearTimeout(idleTimer);
  if (secret === null) return;
  idleTimer = setTimeout(
    () => {
      if (Date.now() - lastActivity >= IDLE_MILLISECONDS) clear(copy.expired);
      else armIdleTimer();
    },
    Math.max(1, lastActivity + IDLE_MILLISECONDS - Date.now()),
  );
}
function touchActivity(): void {
  const now = Date.now();
  if (secret !== null && now - lastActivity >= IDLE_MILLISECONDS)
    clear(copy.expired);
  lastActivity = now;
  armIdleTimer();
}
function isExpired(): boolean {
  if (Date.now() - lastActivity < IDLE_MILLISECONDS) return false;
  clear(copy.expired);
  return true;
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
}
function setNumber(id: string, value: string): void {
  input(id).value = value;
  input(id + "-range").value = value;
  input(id).setAttribute("aria-invalid", "false");
}
function syncNumber(id: string, commit = false): void {
  const field = input(id);
  const range = input(id + "-range");
  const min = Number(range.min);
  const max = Number(range.max);
  if (/^\d{1,3}$/.test(field.value)) {
    const value = Number(field.value);
    if (value > max || (commit && value < min))
      setNumber(id, String(Math.max(min, Math.min(max, value))));
    else if (value >= min) setNumber(id, String(value));
  }
  field.setAttribute(
    "aria-invalid",
    String(boundedCount(field.value, min, max) === null),
  );
}
function renderSecret(): void {
  stopNativeCopy();
  stopScramble();
  result.value = revealed ? (secret ?? "") : maskSecret(secret ?? "");
  result.dataset["mode"] = selected("mode");
  scramble.dataset["mode"] = selected("mode");
  result.hidden = false;
  empty.hidden = true;
  fitResult();
  updateReveal();
  copyButton.disabled = secret === null || copying;
}
function animateSecret(): void {
  renderSecret();
  if (!revealed || motion.matches || secret === null) return;
  const capturedRevision = revision;
  const started = performance.now();
  let previousPaint = -Infinity;
  result.value = "";
  result.hidden = true;
  scramble.hidden = false;
  copyButton.disabled = true;
  const tick = (now: number): void => {
    if (
      revision !== capturedRevision ||
      secret === null ||
      !revealed ||
      !active
    )
      return;
    const elapsed = now - started;
    if (motion.matches || elapsed >= SCRAMBLE_MILLISECONDS) {
      renderSecret();
      return;
    }
    try {
      if (now - previousPaint >= 40) {
        scramble.textContent = scrambleFrame(
          secret,
          Math.max(0, elapsed - SCRAMBLE_HOLD_MILLISECONDS) /
            (SCRAMBLE_MILLISECONDS - SCRAMBLE_HOLD_MILLISECONDS),
        );
        previousPaint = now;
      }
      frame = requestAnimationFrame(tick);
    } catch {
      clear(copy.failed);
      status.dataset["state"] = "error";
    }
  };
  tick(started);
}
function countdownPaused(): boolean {
  return paused || copying;
}
function updateCountdown(): void {
  const label = countdownPaused()
    ? copy.paused
    : copy.countdown(Math.ceil(remaining / 1000));
  if (countdownText.textContent !== label) {
    if (countdownPaused()) countdownText.textContent = label;
    else {
      const seconds = document.createElement("strong");
      seconds.textContent = String(Math.ceil(remaining / 1000));
      countdownText.replaceChildren(
        copy.countdownStart,
        seconds,
        copy.countdownEnd,
      );
    }
  }
  progress.value = remaining / 1000;
  progress.setAttribute("aria-valuetext", label);
  pauseButton.disabled = copying;
  pauseButton.setAttribute("aria-pressed", String(paused));
  const pauseLabel = element("pause-label", HTMLSpanElement);
  const nextLabel = paused ? copy.resume : copy.pause;
  if (pauseLabel.textContent !== nextLabel) pauseLabel.textContent = nextLabel;
  element("pause-icon", HTMLElement).hidden = paused;
  element("resume-icon", HTMLElement).hidden = !paused;
}
function startRotation(): void {
  if (secret === null) return;
  remaining = ROTATION_MILLISECONDS;
  previousTick = Date.now();
  rotation.hidden = false;
  pauseButton.disabled = false;
  updateCountdown();
  rotationTimer = setInterval(() => {
    const now = Date.now();
    const elapsed = Math.max(0, now - previousTick);
    previousTick = now;
    if (secret === null || !active || isExpired()) return;
    if (!countdownPaused()) remaining = Math.max(0, remaining - elapsed);
    if (remaining === 0) generate();
    else updateCountdown();
  }, 250);
}
function generate(): void {
  if (!readyForGeneration || !active || document.hidden) return;
  clear("");
  clearFieldErrors();
  try {
    let bits: number;
    if (selected("mode") === "password") {
      const length = boundedCount(input("length").value, 8, 128);
      if (length === null) {
        fieldError("length", copy.lengthError);
        return;
      }
      const groups: CharacterGroup[] = [];
      for (const name of ["lower", "upper", "digits", "symbols"] as const)
        if (input(name).checked) groups.push(name);
      if (groups.length === 0) {
        fieldError("groups", copy.groupsError);
        return;
      }
      const exclude = input("exclude").value;
      if (exclude.length > 94 || !/^[!-~]*$/.test(exclude)) {
        fieldError("exclude", copy.excludeError);
        return;
      }
      const avoided = exclude + (input("ambiguous").checked ? "Il1O0o" : "");
      if (
        groups.some((group) =>
          Array.from(CHARACTER_GROUPS[group]).every((character) =>
            avoided.includes(character),
          ),
        )
      ) {
        fieldError("exclude", copy.emptyGroup);
        return;
      }
      const plan = planPassword({
        length,
        groups,
        requireEach: input("require-each").checked,
        exclude,
        avoidAmbiguous: input("ambiguous").checked,
      });
      secret = generatePassword(plan);
      bits = plan.bits;
    } else {
      const words = boundedCount(input("words").value, 4, 20);
      if (words === null) {
        fieldError("words", copy.wordsError);
        return;
      }
      const list = currentList();
      const separator = selected("separator");
      const plan = phrasePlan(list, words, separator);
      secret = generatePhrase(list, words, separator);
      bits = plan.bits;
    }
    const characters = Array.from(secret).length;
    bitCount.textContent = String(bits);
    characterCount.textContent = String(characters);
    byteCount.textContent = String(new TextEncoder().encode(secret).length);
    metrics.hidden = false;
    const isPassword = selected("mode") === "password";
    const warning = isPassword ? lengthWarning : wordsWarning;
    warning.textContent =
      bits < 80
        ? isPassword
          ? copy.low
          : copy.lowWords
        : isPassword && characters < 15
          ? copy.short
          : "";
    warning.hidden = warning.textContent === "";
    revealButton.disabled = false;
    status.textContent = copy.created;
    animateSecret();
    armIdleTimer();
    startRotation();
  } catch {
    clear(copy.failed);
    status.dataset["state"] = "error";
  }
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
const themeButton = element("theme", HTMLButtonElement);
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
let savedTheme: string | null = null;
function readTheme(): void {
  try {
    savedTheme = localStorage.getItem("vinasig-theme");
  } catch {
    savedTheme = null;
  }
}
function applyTheme(): void {
  const dark =
    savedTheme === "dark" || (savedTheme !== "light" && systemTheme.matches);
  document.documentElement.dataset["theme"] = dark ? "dark" : "light";
  const label = dark ? copy.light : copy.dark;
  themeButton.setAttribute("aria-label", label);
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.title = label;
  updateLogo();
}
readTheme();
themeButton.addEventListener("click", () => {
  savedTheme =
    document.documentElement.dataset["theme"] === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("vinasig-theme", savedTheme);
  } catch {
    /* Appearance remains available without storage. */
  }
  applyTheme();
});
systemTheme.addEventListener("change", applyTheme);
window.addEventListener("storage", (event) => {
  if (event.key === "vinasig-theme" || event.key === null) {
    readTheme();
    applyTheme();
  }
});
matchMedia("(forced-colors: active)").addEventListener("change", updateLogo);
applyTheme();
themeButton.disabled = false;

for (const event of ["pointerdown", "keydown", "input"] as const)
  document.addEventListener(event, touchActivity, {
    passive: true,
    capture: true,
  });
settings.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    if (target.type === "range")
      setNumber(target.id.replace("-range", ""), target.value);
    if (["length", "words"].includes(target.id)) syncNumber(target.id);
  }
  updatePanels();
  generate();
});
settings.addEventListener("change", (event) => {
  const target = event.target;
  if (
    target instanceof HTMLInputElement &&
    ["length", "words"].includes(target.id)
  ) {
    const previous = target.value;
    syncNumber(target.id, true);
    if (target.value !== previous) generate();
  }
});
document
  .querySelectorAll<HTMLButtonElement>("[data-bits]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      if (!readyForGeneration) return;
      touchActivity();
      setNumber(
        "words",
        String(
          Math.ceil(
            Number(button.dataset["bits"]) /
              Math.log2(currentList().tokens.length),
          ),
        ),
      );
      generate();
    });
  });
generateButton.addEventListener("click", () => {
  touchActivity();
  generate();
});
revealButton.addEventListener("click", () => {
  if (secret === null || isExpired()) return;
  revealed = !revealed;
  renderSecret();
});
pauseButton.addEventListener("click", () => {
  if (secret === null || copying) return;
  paused = !paused;
  previousTick = Date.now();
  updateCountdown();
});
result.addEventListener("focus", () => {
  if (secret === null) return;
  paused = true;
  updateCountdown();
});
result.addEventListener("copy", (event) => {
  if (!event.isTrusted) return;
  if (secret === null || frame !== 0 || !active || isExpired()) {
    event.preventDefault();
    return;
  }
  const text = selectedSecret(
    secret,
    result.selectionStart,
    result.selectionEnd,
    !revealed,
  );
  if (text === "") return;
  paused = true;
  updateCountdown();
  if (!revealed) {
    stopNativeCopy();
    const capturedRevision = revision;
    const { selectionStart, selectionEnd, selectionDirection } = result;
    scramble.textContent = maskSecret(secret);
    scramble.hidden = false;
    result.classList.add("native-copy");
    result.value = text;
    result.setSelectionRange(0, text.length);
    nativeCopyActive = true;
    nativeCopyTimer = setTimeout(() => {
      const restoreFocus = document.activeElement === result;
      stopNativeCopy();
      if (
        revision === capturedRevision &&
        secret !== null &&
        active &&
        !document.hidden
      ) {
        renderSecret();
        if (restoreFocus) result.focus({ preventScroll: true });
        result.setSelectionRange(
          selectionStart,
          selectionEnd,
          selectionDirection,
        );
      }
    }, 0);
  }
  status.textContent = copy.copied;
});
const outputResize = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentRect.width !== outputWidth) {
      outputWidth = entry.contentRect.width;
      fitResult();
    }
  }
});
let outputWidth = 0;
outputResize.observe(element("result-surface", HTMLElement));
void document.fonts.ready.then(fitResult);
motion.addEventListener("change", () => {
  if (motion.matches && secret !== null) renderSecret();
});

copyButton.addEventListener("click", () => {
  if (secret === null || frame !== 0 || copying || isExpired()) return;
  const capturedRevision = revision;
  copying = true;
  paused = true;
  copyButton.disabled = true;
  updateCountdown();
  const complete = (message: string): void => {
    if (revision !== capturedRevision || secret === null) return;
    copying = false;
    status.textContent = message;
    copyButton.disabled = false;
    updateCountdown();
  };
  try {
    const clipboard = (navigator as { clipboard?: Clipboard }).clipboard;
    if (typeof clipboard?.writeText !== "function")
      throw new Error("CLIPBOARD_UNAVAILABLE");
    void clipboard
      .writeText(secret)
      .then(() => {
        complete(copy.copied);
      })
      .catch(() => {
        complete(copy.denied);
      });
  } catch {
    complete(copy.denied);
  }
});
window.addEventListener("pagehide", () => {
  active = false;
  clear(copy.expired);
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted && !document.hidden) {
    active = true;
    touchActivity();
    generate();
  }
});
document.addEventListener("visibilitychange", () => {
  active = !document.hidden;
  if (!active) clear(copy.expired);
  else {
    touchActivity();
    generate();
  }
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
    touchActivity();
    generate();
  } catch {
    status.textContent = copy.integrity;
    status.dataset["state"] = "error";
  }
}
void initialize();
