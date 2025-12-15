import { CONFIG } from "./config.js";
import { api } from "./api.js";
import { setSession, clearSession, State } from "./state.js";
import { toast, renderShell } from "./ui.js";

export function initGoogleLogin() {
  // render google button
  window.google?.accounts?.id?.initialize({
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

  window.google?.accounts?.id?.renderButton(
    document.getElementById("gbtn"),
    { theme: "outline", size: "large", text: "signin_with" }
  );
}

export async function refreshSessionUser() {
  // easiest: call GET_DASHBOARD (token verifies)
  const dash = await api("GET_DASHBOARD", {});
  // backend returns user summary; keep existing user name/role from State unless you want to override
  return dash;
}

export function logout() {
  clearSession();
  toast("Logged out");
  renderShell();
}
