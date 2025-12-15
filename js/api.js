import { CONFIG } from "./config.js";
import { getSessionToken } from "./auth.js";

export async function api(action, data = {}) {
  const token = getSessionToken();
  const payload = { action, token, data };

  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message || "API Error");
  return json.data;
}
