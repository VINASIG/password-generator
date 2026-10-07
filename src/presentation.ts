export const ROTATION_MILLISECONDS = 60_000;
export const IDLE_MILLISECONDS = 300_000;
export const SCRAMBLE_MILLISECONDS = 1_200;
export const SCRAMBLE_HOLD_MILLISECONDS = 240;

export function maskSecret(secret: string): string {
  return "•".repeat(Array.from(secret).length);
}

export function selectedSecret(
  secret: string,
  start: number,
  end: number,
  masked: boolean,
): string {
  return masked
    ? Array.from(secret).slice(start, end).join("")
    : secret.slice(start, end);
}

export function boundedCount(
  text: string,
  min: number,
  max: number,
): number | null {
  if (!/^\d{1,3}$/.test(text)) return null;
  const value = Number(text);
  return value >= min && value <= max ? value : null;
}

export function scrambleFrame(secret: string, amount: number): string {
  const characters = Array.from(secret);
  const noise = new Uint8Array(characters.length);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  try {
    crypto.getRandomValues(noise);
    const settled = Math.floor(
      characters.length * Math.max(0, Math.min(1, amount)),
    );
    return characters
      .map((character, index) =>
        index < settled ||
        character === " " ||
        character === "-" ||
        character === "_" ||
        character === "."
          ? character
          : alphabet[(noise[index] ?? 0) & 31],
      )
      .join("");
  } finally {
    noise.fill(0);
  }
}
