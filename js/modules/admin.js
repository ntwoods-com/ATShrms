import { mockApi } from "../api.js";
import { setState } from "../state.js";
import { statusMap } from "../config.js";

export function renderAdmin(target, state) {
  const rejectionLog = (state.candidates || []).filter((c) => c.status === "REJECTED");
  const audit = state.audit || [];
  target.innerHTML = `
    <div class="panel__header flex space-between">
      <div>
        <h2 class="panel__title">Admin & Reverts</h2>
        <p class="panel__body">Full access to edit marks, revert from rejection log, manage permissions.</p>
      </div>
      <span class="badge">${rejectionLog.length} rejection(s)</span>
    </div>
    <div class="section">
      <h3 class="section__title">Rejection Log</h3>
      <p class="section__desc">Admin can revert any stage; backend enforces permission on every request.</p>
      <div class="card-grid">
        ${rejectionLog.map((c) => rejectCard(c)).join("") || "<p>No rejections yet.</p>"}
      </div>
    </div>
    <div class="section">
      <h3 class="section__title">Audit Log (latest)</h3>
      <ul>${audit.map((a) => `<li>${a}</li>`).join("") || "<li>No audit lines</li>"}</ul>
    </div>
  `;

  target.querySelectorAll("button[data-revert]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await mockApi("ADMIN_DECISION", { id, action: "REVERT" });
      setState({ candidates: (state.candidates || []).map((c) => (c.id === id ? { ...c, status: "OWNER_REVIEW" } : c)) });
    });
  });
}

function rejectCard(c) {
  const tone = statusMap.CANDIDATE[c.status]?.tone;
  const chipClass = tone ? `chip chip--${tone}` : "chip";
  return `
    <div class="card">
      <div class="flex space-between">
        <div>
          <h3 class="card__title">${c.name}</h3>
          <div class="card__meta">${c.remark || "Reason not captured"}</div>
        </div>
        <span class="${chipClass}">${statusMap.CANDIDATE[c.status]?.label || c.status}</span>
      </div>
      <div class="card__actions">
        <button class="btn btn--pill" data-revert data-id="${c.id}">Revert to HR</button>
      </div>
    </div>
  `;
}
