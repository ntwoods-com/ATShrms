import { state } from "./state.js";
import { renderRequirementsPage } from "./modules/requirements.js";
import { renderJobPostingPage } from "./modules/jobpostings.js";

export function buildNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = "";

  const items = [
    { id: "home", label: "Home", roles: ["ADMIN","HR","EA","OWNER"] },
    { id: "requirements", label: "Requirements", roles: ["ADMIN","HR","EA"] },
    { id: "job-postings", label: "Job Posting", roles: ["ADMIN","HR"] },
    { id: "candidates", label: "Candidates", roles: ["ADMIN","HR","OWNER"] },
    { id: "admin", label: "Admin", roles: ["ADMIN"] }
  ];

  items.forEach(it => {
    if (!state.user) return;
    if (!it.roles.includes(state.user.role)) return;

    const div = document.createElement("div");
    div.className = "nav-item";
    div.dataset.route = it.id;
    div.innerHTML = `<span>${it.label}</span><span class="badge">${state.user.role}</span>`;
    div.onclick = () => routeTo(it.id);
    nav.appendChild(div);
  });

  window.onhashchange = () => routeFromHash();
  routeFromHash();
}

export function routeTo(route, params = {}) {
  const qs = new URLSearchParams(params).toString();
  location.hash = "#/" + route + (qs ? "?" + qs : "");
}

function routeFromHash() {
  const { route, params } = parseHash();
  setActive(route);

  const header = document.getElementById("pageHeader");
  const body = document.getElementById("pageBody");

  if (route === "requirements") {
    renderRequirementsPage({ headerEl: header, rootEl: body });
    return;
  }
  if (route === "job-postings") {
    renderJobPostingPage({ headerEl: header, rootEl: body, params });
    return;
  }

  header.textContent = route.toUpperCase();
  body.innerHTML = `<div class="card card-wide">Module <b>${route}</b> pending (NEXT parts).</div>`;
}

function parseHash() {
  const raw = location.hash.replace("#/", "");
  const [routePart, queryPart] = raw.split("?");
  const route = routePart || "home";
  const params = Object.fromEntries(new URLSearchParams(queryPart || ""));
  return { route, params };
}

function setActive(route) {
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.route === route);
  });
}
