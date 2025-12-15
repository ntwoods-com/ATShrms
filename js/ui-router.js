import { renderDashboard } from "./ui.js";
import { renderRequirements } from "./modules/requirements.js";
//import { renderCandidates } from "./modules/candidates.js";
//import { renderCalls } from "./modules/calls.js";
//import { renderInterviews } from "./modules/interviews.js";
//import { renderTests } from "./modules/tests.js";
//import { renderAdmin } from "./modules/admin.js";
//import { renderOnboarding } from "./modules/onboarding.js";

const routes = {
  "#/dashboard": renderDashboard,
  "#/requirements": renderRequirements,
  "#/candidates": renderCandidates,
  "#/calls": renderCalls,
  "#/interviews": renderInterviews,
  "#/tests": renderTests,
  "#/onboarding": renderOnboarding,
  "#/admin": renderAdmin
};

export function navigate(hash) {
  location.hash = hash;
}

export async function router() {
  const hash = location.hash || "#/dashboard";
  const view = document.getElementById("view");
  view.innerHTML = `<div class="card">Loading...</div>`;

  const fn = routes[hash] || routes["#/dashboard"];
  await fn(view);
  highlightNav(hash);
}

export function highlightNav(hash) {
  document.querySelectorAll("#nav a").forEach(a => {
    a.classList.toggle("active", a.getAttribute("href") === hash);
  });
}
