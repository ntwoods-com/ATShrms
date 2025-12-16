import { apiCall } from "../api.js";

export async function renderUsersAdminPage({ headerEl, rootEl }) {
  headerEl.textContent = "USERS (ADMIN)";

  rootEl.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">User Role Manager</h3>
        <button class="btn btn-sm right" id="ref">Refresh</button>
      </div>
      <p class="muted">USERS sheet ke emails ko roles assign/re-assign yahin se.</p>
      <div class="hr"></div>
      <div id="list" class="muted">Loading...</div>
    </div>
  `;

  const list = rootEl.querySelector("#list");
  rootEl.querySelector("#ref").onclick = () => load();

  await load();

  async function load() {
    list.innerHTML = `<div class="muted">Loading...</div>`;
    const res = await apiCall("LIST_USERS", {});
    const users = res.users || [];

    if (!users.length) {
      list.innerHTML = `<div class="muted">No users in USERS sheet.</div>`;
      return;
    }

    list.innerHTML = users.map(u => `
      <div class="card card-wide" style="margin-bottom:10px">
        <div class="row">
          <span class="pill"><b>${esc(u.email || "")}</b></span>
          <span class="pill warn">${esc(u.role || "")}</span>
          <span class="right muted small">${esc(u.updatedAt || "")}</span>
        </div>

        <div class="muted small" style="margin-top:6px">${esc(u.name || "")} • ID: ${esc(u.id || "")}</div>

        <div class="row" style="margin-top:10px; gap:10px; flex-wrap:wrap">
          <select class="input" data-role="${esc(u.email)}">
            ${["ADMIN","EA","HR","OWNER"].map(r => `<option value="${r}" ${String(u.role||"").toUpperCase()===r?"selected":""}>${r}</option>`).join("")}
          </select>
          <button class="btn btn-sm" data-save="${esc(u.email)}">Save Role</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-save]").forEach(b => b.onclick = async () => {
      const email = b.getAttribute("data-save");
      const sel = list.querySelector(`select[data-role="${css(email)}"]`);
      const role = sel.value;

      await apiCall("UPDATE_USER_ROLE", { email, role });
      alert("Role Updated ✅");
      location.hash = "#/users-admin";
    });
  }
}

function css(s){return String(s).replace(/"/g,'\\"')}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
