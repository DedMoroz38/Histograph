import crypto from "crypto";

export interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

export function verifyTelegramHash(
  data: Record<string, string>,
  botToken: string
): boolean {
  const { hash, ...rest } = data;
  if (!hash) return false;

  const checkString = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== "")
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  return expected === hash;
}

// Returns false if auth_date is older than maxAgeSeconds (default 1 day)
export function isTelegramAuthFresh(
  authDate: string,
  maxAgeSeconds = 86400
): boolean {
  const age = Math.floor(Date.now() / 1000) - parseInt(authDate, 10);
  return age >= 0 && age <= maxAgeSeconds;
}
