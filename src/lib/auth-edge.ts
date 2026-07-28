const SESSION_SALT = "lee-g-admin-session-v1";

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "lee-g-admin";
}

async function createSessionTokenEdge(): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getAdminPassword()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(SESSION_SALT));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifySessionTokenEdge(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const expected = await createSessionTokenEdge();
  return token === expected;
}
