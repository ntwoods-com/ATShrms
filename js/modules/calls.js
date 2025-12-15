import { mockApi } from "../api.js";
import { setState } from "../state.js";
import { statusMap } from "../config.js";

export function renderCalls(target, state) {
  const candidates = (state.candidates || []).filter((c) => c.status === "ON_CALL" || c.status === "OWNER_REVIEW");
  target.innerHTML = `
    <div class="panel__header flex space-between">
      <div>
        <h2 class="panel__title">On-Call Screening</h2>
        <p class="panel__body">Capture connect outcome, scores, and recommend to Owner.</p>
      </div>
      <span class="badge">${candidates.length} to screen</span>
    </div>
    <div class="card-grid">
      ${candidates.map((c) => card(c)).join("") || "<p>No candidates awaiting call.</p>"}
    </div>
  `;

  target.querySelectorAll("button[data-call]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const status = btn.dataset.call;
      const remark = status === "REJECTED" ? prompt("Remark") || "" : "";
      const communication = status === "OWNER_REVIEW" ? Number(prompt("Communication (0-10)") || 0) : undefined;
      const experience = status === "OWNER_REVIEW" ? Number(prompt("Experience (0-10)") || 0) : undefined;
      await mockApi("CALL_SCREENING", { id, status, remark, communication, experience });
      setState({
        candidates: (state.candidates || []).map((c) =>
          c.id === id ? { ...c, status, remark, communication, experience } : c
        )
      });
    });
  });
}

function card(c) {
  const tone = statusMap.CANDIDATE[c.status]?.tone;
  const chipClass = tone ? `chip chip--${tone}` : "chip";
  return `
    <div class="card">
      <div class="flex space-between">
        <div>
          <h3 class="card__title">${c.name}</h3>
          <div class="card__meta">${c.mobile}</div>
        </div>
        <span class="${chipClass}">${statusMap.CANDIDATE[c.status]?.label || c.status}</span>
      </div>
      <div class="card__actions">
        <button class="btn btn--pill" data-call="OWNER_REVIEW" data-id="${c.id}">Call Done</button>
        <button class="btn btn--pill btn--ghost" data-call="NOT_REACHABLE" data-id="${c.id}">Not Reachable</button>
        <button class="btn btn--pill btn--ghost" data-call="NO_ANSWER" data-id="${c.id}">No Answer</button>
        <button class="btn btn--pill btn--danger" data-call="REJECTED" data-id="${c.id}">Reject</button>
      </div>
    </div>
  `;
}
