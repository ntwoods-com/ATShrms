import { moduleOrder, statusMap } from "./config.js";
import { renderRequirements } from "./modules/requirements.js";
import { renderCandidates } from "./modules/candidates.js";
import { renderCalls } from "./modules/calls.js";
import { renderInterviews } from "./modules/interviews.js";
import { renderTests } from "./modules/tests.js";
import { renderAdmin } from "./modules/admin.js";
import { renderJobPosting } from "./modules/jobPosting.js";

const container = () => document.getElementById("module-container");
const navLinks = () => document.getElementById("nav-links");
const stageIndicator = () => document.getElementById("stage-indicator");
const alerts = () => document.getElementById("alerts");

let currentModule = "requirements";

export function render(state) {
  renderNav(state);
  renderSession(state);
  renderAlerts(state);
  renderModule(state);
}

function renderNav(state) {
  const nav = navLinks();
  nav.innerHTML = "";
  moduleOrder.forEach((m) => {
    const btn = document.createElement("button");
    btn.textContent = m.label;
    btn.className = currentModule === m.id ? "active" : "";
    btn.addEventListener("click", () => {
      currentModule = m.id;
      render(state);
    });
    nav.appendChild(btn);
  });
}

function renderSession(state) {
  const userEl = document.getElementById("session-user");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (!state.session) {
    userEl.textContent = "Not signed in";
    loginBtn.hidden = false;
    logoutBtn.hidden = true;
  } else {
    const { user } = state.session;
    userEl.textContent = `${user.name} • ${user.role}`;
    loginBtn.hidden = true;
    logoutBtn.hidden = false;
  }
}

function renderAlerts(state) {
  const container = alerts();
  container.innerHTML = "";
  if (!state.session) {
    const el = document.createElement("div");
    el.className = "alert alert--warn";
    el.textContent = "Sign in with Google to start. Backend validates tokens on every call.";
    container.appendChild(el);
  }
  if (!state.requirement) {
    const el = document.createElement("div");
    el.className = "alert";
    el.textContent = "No requirement raised yet. EA can raise using the Requirements module.";
    container.appendChild(el);
  }
}

function renderModule(state) {
  const target = container();
  const stage = state.requirement?.status || "NEW";
  stageIndicator().textContent = statusMap.REQUIREMENT[stage]?.label || stage;

  switch (currentModule) {
    case "requirements":
      renderRequirements(target, state);
      break;
    case "jobPosting":
      renderJobPosting(target, state);
      break;
    case "candidates":
      renderCandidates(target, state);
      break;
    case "calls":
      renderCalls(target, state);
      break;
    case "interviews":
      renderInterviews(target, state);
      break;
    case "tests":
      renderTests(target, state);
      break;
    case "admin":
      renderAdmin(target, state);
      break;
    default:
      target.innerHTML = "<p>Module missing.</p>";
  }
}
