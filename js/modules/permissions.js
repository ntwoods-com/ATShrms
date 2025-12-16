import { apiCall } from "../api.js";

export async function renderPermissionsPage({ headerEl, rootEl }) {
  headerEl.textContent = "ROLE PERMISSIONS (ADMIN)";

  rootEl.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">Role Permissions</h3>
        <button class="btn btn-sm right" id="ref">Refresh</button>
      </div>
      <p class="muted">Comma-separated permissions. Backend har request pe validate karega.</p>
      <div class="hr"></div>
      <div id="list" class="muted">Loading...</div>
    </div>
  `;

  const list = rootEl.querySelector("#list");
  rootEl.querySelector("#ref").onclick = () => load();

  await load();

  async function load() {
    list.innerHTML = `<div class="muted">Loading...</div>`;
    const res = await apiCall("LIST_ROLE_PERMISSIONS", {});
    const roles = res.roles || [];

    list.innerHTML = roles.map(r => `
      <div class="card card-wide" style="margin-bottom:12px">
        <div class="row">
          <span class="pill"><b>${esc(r.role)}</b></span>
          <span class="right muted small">${esc(r.updatedAt || "")}</span>
        </div>

        <div class="muted small" style="margin-top:8px">Permissions (CSV)</div>
        <textarea class="input" rows="4" style="width:100%" data-role="${esc(r.role)}">${esc((r.permissions || []).join(","))}</textarea>

        <div class="row" style="margin-top:10px">
          <button class="btn btn-sm" data-save="${esc(r.role)}">Save</button>
          <span class="muted small right">Tip: ADMIN ke liye "*" special hai (all).</span>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-save]").forEach(b => b.onclick = async () => {
      const role = b.getAttribute("data-save");
      const ta = list.querySelector(`textarea[data-role="${css(role)}"]`);
      const csvText = String(ta.value || "");
      const permissions = csvText.split(",").map(x => x.trim()).filter(Boolean);

      await apiCall("UPDATE_ROLE_PERMISSIONS", { role, permissions });
      alert("Saved ✅");
      location.hash = "#/permissions";
    });
  }
}

function css(s){return String(s).replace(/"/g,'\\"')}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
