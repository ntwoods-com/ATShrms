import { CONFIG } from "./config.js";
import { api } from "./api.js";
import { setSession, clearSession } from "./state.js";
import { toast, renderShell } from "./ui.js";

async function waitForGIS(maxMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (window.google?.accounts?.id) return true;
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}

export async function initGoogleLogin() {
  const el = document.getElementById("gbtn");
  if (!el) return;

  el.innerHTML = `<div class="muted small">Loading Google Sign-in…</div>`;

  const ok = await waitForGIS();
  if (!ok) {
    el.innerHTML = `<div class="badge bad">Google Sign-in load failed</div>
                    <div class="muted small" style="margin-top:6px;">Check adblock / third-party script blocked.</div>`;
    return;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: async (resp) => {
        try {
          const idToken = resp.credential;
          const data = await api("LOGIN_EXCHANGE", { idToken }, { public: true });

          setSession({ user: data.user, sessionToken: data.sessionToken });
          toast(`Logged in: ${data.user.name} (${data.user.role})`);
          renderShell();
        } catch (e) {
          clearSession();
          toast("Login failed: " + e.message, true);
        }
      }
    });

    el.innerHTML = "";
    window.google.accounts.id.renderButton(el, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill"
    });

  } catch (e) {
    el.innerHTML = `<div class="badge bad">Init error</div>
                    <div class="muted small" style="margin-top:6px;">${String(e.message || e)}</div>`;
  }
}

export function logout() {
  clearSession();
  toast("Logged out");
  renderShell();
}
export async function refreshSessionUser() {
  // simplest token check → backend pe
  // ye call session token ko validate bhi karega
  await fetch(".", { method: "HEAD" });
}

