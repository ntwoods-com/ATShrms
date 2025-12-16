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

  await fetch(CONFIG.API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload) // browser sends as text/plain (simple request)
  });

  // no-cors => you can't read response, so just return a local ok
  return { ok: true };
}


export async function pingApi() {
  // doGet ping
  const res = await fetch(CONFIG.API_URL);
  return res.json();
}
