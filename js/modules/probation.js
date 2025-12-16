import { apiCall } from "../api.js";

export async function renderProbationPage({ headerEl, rootEl }) {
  headerEl.textContent = "PROBATION";
  rootEl.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">Probation Dashboard</h3>
        <button class="btn btn-sm right" id="refBtn">Refresh</button>
      </div>

      <div class="row" style="margin-top:10px; gap:10px; flex-wrap:wrap">
        <select class="input" id="st">
          <option value="">Active + Extended</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="EXTENDED">EXTENDED</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>
        <button class="btn btn-sm" id="go">Load</button>
      </div>

      <div class="hr"></div>
      <div id="list" class="muted">Loading...</div>
    </div>
  `;

  const list = rootEl.querySelector("#list");
  const stEl = rootEl.querySelector("#st");

  rootEl.querySelector("#refBtn").onclick = () => load();
  rootEl.querySelector("#go").onclick = () => load();

  await load();

  async function load() {
    list.innerHTML = `<div class="muted">Loading...</div>`;
    try {
      const res = await apiCall("LIST_PROBATION_QUEUE", { status: stEl.value || "" });
      const queue = res.queue || [];

      if (!queue.length) {
        list.innerHTML = `<div class="muted">No probation records.</div>`;
        return;
      }

      list.innerHTML = queue.map(p => {
        const emp = p.employee || {};
        const left = daysLeft(p.endDate);

        return `
          <div class="card card-wide" style="margin-bottom:12px">
            <div class="row">
              <span class="pill"><b>${esc(p.id)}</b></span>
              <span class="pill warn">${esc(p.status)}</span>
              <span class="right pill ${left <= 7 ? "danger" : "warn"}">Days Left: ${esc(left)}</span>
            </div>

            <div style="margin-top:10px; font-weight:900">${esc(emp.name || "-")}</div>
            <div class="muted small" style="margin-top:4px">${esc(emp.role || "-")} • Emp: ${esc(p.employeeId)}</div>

            <div class="row" style="margin-top:10px">
              <span class="pill">Start: ${esc(p.startDate)}</span>
              <span class="pill">End: ${esc(p.endDate)}</span>
              <span class="pill">EmpStatus: ${esc(emp.status || "-")}</span>
            </div>

            <div class="hr"></div>

            <div class="row" style="gap:8px; flex-wrap:wrap">
              ${p.ui?.canConfirm ? `<button class="btn btn-sm" data-dec="${esc(p.employeeId)}|CONFIRM">Confirm</button>` : ``}
              ${p.ui?.canExtend ? `<button class="btn btn-sm" data-ext="${esc(p.employeeId)}">Extend</button>` : ``}
              ${p.ui?.canTerminate ? `<button class="btn btn-sm" data-dec="${esc(p.employeeId)}|TERMINATE">Terminate</button>` : ``}
              <a class="pill right" href="#/employees">Open Employees</a>
            </div>
          </div>
        `;
      }).join("");

      list.querySelectorAll("[data-dec]").forEach(b => b.onclick = async () => {
        const [employeeId, decision] = b.getAttribute("data-dec").split("|");
        const remark = prompt(decision === "TERMINATE" ? "Terminate reason (mandatory):" : "Remark (optional):", "") || "";
        if (decision === "TERMINATE" && !remark) return alert("Reason required");

        await apiCall("PROBATION_DECISION", { employeeId, decision, remark });
        alert("Saved ✅");
        location.hash = "#/probation";
      });

      list.querySelectorAll("[data-ext]").forEach(b => b.onclick = async () => {
        const employeeId = b.getAttribute("data-ext");
        const days = prompt("Extend by how many days? (1-180)", "30");
        if (!days) return;
        const remark = prompt("Remark (optional):", "") || "";

        await apiCall("PROBATION_EXTEND", { employeeId, extendDays: Number(days), remark });
        alert("Extended ✅");
        location.hash = "#/probation";
      });

    } catch (e) {
      list.innerHTML = `<div class="toast">${esc(e.message || String(e))}</div>`;
    }
  }
}

function daysLeft(endDate) {
  try {
    const end = new Date(endDate + "T00:00:00");
    const now = new Date();
    const diff = Math.ceil((end - now) / (24 * 3600 * 1000));
    return isFinite(diff) ? diff : "-";
  } catch { return "-"; }
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
