import { state } from "./state.js";
import { renderRequirementsPage } from "./modules/requirements.js";
import { renderJobPostingPage } from "./modules/jobpostings.js";
import { renderCandidatesPage } from "./modules/candidates.js";
import { renderCallsPage } from "./modules/calls.js";
import { renderOwnerPage } from "./modules/owner.js";
import { renderInterviewsPage } from "./modules/interviews.js";
import { renderPreInterviewPage } from "./modules/preinterview.js";
import { renderAdminPage } from "./modules/admin.js";
import { renderFinalInterviewPage } from "./modules/finalInterview.js";
import { renderOnboardingPage } from "./modules/onboarding.js";
import { renderEmployeesPage } from "./modules/employees.js";
import { renderProbationPage } from "./modules/probation.js";
import { renderSettingsPage } from "./modules/settings.js";
import { renderPermissionsPage } from "./modules/permissions.js";
import { renderUsersAdminPage } from "./modules/usersAdmin.js";
import { renderTestBankPage } from "./modules/testBank.js";



export function buildNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = "";

  const items = [
    { id: "home", label: "Home", roles: ["ADMIN","HR","EA","OWNER"] },
    { id: "requirements", label: "Requirements", roles: ["ADMIN","HR","EA"] },
    { id: "job-postings", label: "Job Posting", roles: ["ADMIN","HR"] },
    { id: "candidates", label: "Candidates", roles: ["ADMIN","HR"] },
    { id: "calls", label: "On-Call Screening", roles: ["ADMIN","HR"] },
    { id: "owner", label: "Owner Decision", roles: ["ADMIN","OWNER"] },
    { id: "interviews", label: "Interviews", roles: ["ADMIN","HR"] },
    { id: "pre-interview", label: "Pre-Interview", roles: ["ADMIN","HR"] },
    { id: "admin", label: "Admin", roles: ["ADMIN"] },
    { id: "final-interview", label: "Final Interview", roles: ["ADMIN","OWNER"] },
    { id: "onboarding", label: "Onboarding", roles: ["ADMIN","HR"] },
    { id: "employees", label: "Employees", roles: ["ADMIN","HR","OWNER"] },
    { id: "probation", label: "Probation", roles: ["ADMIN","HR"] },
    { id: "settings", label: "Settings", roles: ["ADMIN"] },
    { id: "permissions", label: "Permissions", roles: ["ADMIN"] },
    { id: "users-admin", label: "Users", roles: ["ADMIN"] },
    { id: "test-bank", label: "Test Bank", roles: ["ADMIN"] },

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

  if (route === "requirements") return renderRequirementsPage({ headerEl: header, rootEl: body });
  if (route === "job-postings") return renderJobPostingPage({ headerEl: header, rootEl: body, params });
  if (route === "candidates") return renderCandidatesPage({ headerEl: header, rootEl: body, params });
  if (route === "calls") return renderCallsPage({ headerEl: header, rootEl: body, params });
  if (route === "owner") return renderOwnerPage({ headerEl: header, rootEl: body, params });
  if (route === "interviews") return renderInterviewsPage({ headerEl: header, rootEl: body, params });
  if (route === "pre-interview") return renderPreInterviewPage({ headerEl: header, rootEl: body, params });
  if (route === "admin") return renderAdminPage({ headerEl: header, rootEl: body, params });
  if (route === "final-interview") return renderFinalInterviewPage({ headerEl: header, rootEl: body, params });
  if (route === "onboarding") return renderOnboardingPage({ headerEl: header, rootEl: body, params });
  if (route === "employees") return renderEmployeesPage({ headerEl: header, rootEl: body, params });
  if (route === "probation") return renderProbationPage({ headerEl: header, rootEl: body, params });
  if (route === "settings") return renderSettingsPage({ headerEl: header, rootEl: body, params });
  if (route === "permissions") return renderPermissionsPage({ headerEl: header, rootEl: body, params });
  if (route === "users-admin") return renderUsersAdminPage({ headerEl: header, rootEl: body, params });
  if (route === "test-bank") return renderTestBankPage({ headerEl: header, rootEl: body, params });


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
