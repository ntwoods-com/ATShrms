import { CONFIG } from "./config.js";
import { state } from "./state.js";

/**
 * IMPORTANT:
 * Hum headers set nahi kar rahe (no application/json),
 * so preflight OPTIONS trigger nahi hota. :contentReference[oaicite:3]{index=3}
 */
export async function apiCall(action, data = {}) {
  const payload = {
    action,
    token: state.sessionToken || "",
    data
  };

  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    body: JSON.stringify(payload) // string body => text/plain
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json?.error?.message || "API error");
  return json.data;
}

export async function pingApi() {
  // doGet ping
  const res = await fetch(CONFIG.API_URL);
  return res.json();
}
