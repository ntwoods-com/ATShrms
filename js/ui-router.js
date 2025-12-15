import { renderDashboard } from "./ui.js";
import { renderRequirements } from "./modules/requirements.js";

const routes = {
  "#/dashboard": renderDashboard,
  "#/requirements": renderRequirements,
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
