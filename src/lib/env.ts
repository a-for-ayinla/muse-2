/**
 * Central, validated environment access. Never read secrets in client code.
 */
function str(name: string, fallback = ""): string {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : fallback;
}

function int(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

export const env = {
  appUrl: str("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  aiProvider: str("AI_PROVIDER", "none"), // none | anthropic | openai
  aiApiKey: str("AI_API_KEY"),
  aiModel: str("AI_MODEL"),
  /** Canonical variable is MUSIC_PROVIDERS (plural): none | demo | apple (apple not yet implemented). */
  musicProviders: str("MUSIC_PROVIDERS", "none")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  rateLimitMax: int("RATE_LIMIT_MAX_REQUESTS", 20),
  rateLimitWindow: int("RATE_LIMIT_WINDOW_SECONDS", 60),
  logLevel: str("LOG_LEVEL", "info"),
  isProd: process.env.NODE_ENV === "production",
  /** SMTP is not part of this environment; email delivery is documented as unconfigured. */
  emailConfigured: str("SMTP_URL") !== "",
};

export function aiConfigured(): boolean {
  return env.aiProvider !== "none" && env.aiApiKey !== "" && env.aiModel !== "";
}
