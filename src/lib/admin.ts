// Minimal admin allowlist — a comma-separated list of Clerk user IDs in an
// env var. No roles table, no org-level admin, no UI to manage this list;
// none of that is justified before there's an actual admin team. This is
// enough to gate the admin control center and let something other than "any
// authenticated user" create platform-level data like economic signals.
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

export function forbiddenAdmin(): Response {
  return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403 });
}
