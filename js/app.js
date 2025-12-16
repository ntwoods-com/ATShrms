import { initGoogleLogin, restoreSession, logout } from "./auth.js";
import { buildNav } from "./ui-router.js";
import { pingApi } from "./api.js";
import { state } from "./state.js";

const viewLogin = document.getElementById("viewLogin");
const viewApp = document.getElementById("viewApp");
const loginMsg = document.getElementById("loginMsg");
const userBadge = document.getElementById("userBadge");
const btnLogout = document.getElementById("btnLogout");
const apiStatus = document.getElementById("apiStatus");

btnLogout.addEventListener("click", async () => {
  await logout();
  render();
});

async function boot() {
  // Ping
  try {
    const ping = await pingApi();
    apiStatus.textContent = "API: OK";
    apiStatus.title = JSON.stringify(ping);
  } catch (e) {
    apiStatus.textContent = "API: DOWN";
  }

  // Restore session if present
  await restoreSession();
  render();

  // Google login init (only if not logged-in)
  if (!state.user) {
    initGoogleLogin({
      onDone: () => render(),
      onError: (e) => showLoginError(e.message)
    });
  }
}

function showLoginError(msg) {
  loginMsg.classList.remove("hidden");
  loginMsg.textContent = "Login failed: " + msg;
}

function render() {
  const loggedIn = !!state.user;

  viewLogin.classList.toggle("hidden", loggedIn);
  viewApp.classList.toggle("hidden", !loggedIn);

  userBadge.classList.toggle("hidden", !loggedIn);
  btnLogout.classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    userBadge.textContent = `${state.user.name} (${state.user.role})`;
    buildNav();
  }
}

boot();
