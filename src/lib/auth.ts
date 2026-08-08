// Shared-password auth. The session cookie holds a token derived from the
// password + a server secret (never the password itself), so a leaked cookie
// can be invalidated by rotating AUTH_SECRET. Uses Web Crypto so it runs in
// both the Edge middleware and Node route handlers.

export const AUTH_COOKIE = "snagpack_auth";

export async function authToken(): Promise<string> {
  const pw = process.env.APP_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET ?? "";
  const data = new TextEncoder().encode(`${pw}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-ish time compare (length-independent short-circuit avoided).
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
