import { CONFIG } from "./config.js";

export async function apiCallPublic(action, token, data = {}) {
  const payload = { action, token, data };

  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    // ✅ IMPORTANT: text/plain to avoid preflight (Apps Script)
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message || "API error");
  return json.data;
}
