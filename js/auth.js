import { CONFIG } from "./config.js";
import { apiCall } from "./api.js";
import { setSession, clearSession, state } from "./state.js";

export function initGoogleLogin({ onDone, onError }) {
  const el = document.getElementById("gBtn");
  if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    onError?.(new Error("Google Identity SDK not loaded"));
    return;
  }

  window.google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: async (resp) => {
      try {
        const idToken = resp.credential;
        const data = await apiCall("LOGIN_EXCHANGE", { idToken });
        setSession(data.sessionToken, data.user);
        onDone?.(data.user);
      } catch (e) {
        onError?.(e);
      }
    }
  });

  window.google.accounts.id.renderButton(el, {
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "signin_with"
  });
}

export async function restoreSession() {
  if (!state.sessionToken) return null;
  try {
    const data = await apiCall("GET_ME");
    state.user = data.user;
    return data.user;
  } catch {
    clearSession();
    return null;
  }
}

export async function logout() {
  try { await apiCall("LOGOUT"); } catch {}
  clearSession();
}
