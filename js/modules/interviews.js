import { mockApi } from "../api.js";
import { setState } from "../state.js";
import { scoringBands, statusMap } from "../config.js";

export function renderInterviews(target, state) {
  const candidates = (state.candidates || []).filter((c) =>
    ["OWNER_REVIEW", "INTERVIEW_SCHEDULE", "PRE_INTERVIEW_PASS", "PRE_INTERVIEW_FAIL", "READY_FOR_FINAL", "SELECTED"].includes(c.status)
  );

  target.innerHTML = `
    <div class="panel__header flex space-between">
      <div>
        <h2 class="panel__title">Interviews & Walk-in</h2>
        <p class="panel__body">Schedule, capture pre-interview feedback, auto-test assignment, and move to final.</p>
      </div>
      <span class="badge">${candidates.length} in funnel</span>
    </div>
    <div class="card-grid">
      ${candidates.map((c) => interviewCard(c)).join("") || "<p>No candidates scheduled.</p>"}
    </div>
  `;

  target.querySelectorAll("button[data-int]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.int;
      const cand = candidates.find((c) => c.id === id);
      if (action === "SCHEDULE") {
        const date = prompt("Interview Date (YYYY-MM-DD)") || "";
        const time = prompt("Time") || "";
        await mockApi("INTERVIEW_SCHEDULE", { id, date, time });
        setState({ candidates: update(state.candidates, id, { status: "INTERVIEW_SCHEDULE", date, time }) });
      }
      if (action === "PRE_FEEDBACK") {
        const communication = Number(prompt(`Communication ${scoringBands.communicationScale.min}-${scoringBands.communicationScale.max}`) || 0);
        const roleFit = Number(prompt("Role Fit (0-10)") || 0);
        const overall = Number(((communication + roleFit) / 2).toFixed(1));
        const status = overall >= scoringBands.preInterviewPassMark ? "PRE_INTERVIEW_PASS" : "PRE_INTERVIEW_FAIL";
        await mockApi("PRE_INTERVIEW_FEEDBACK", { id, communication, roleFit, overall });
        setState({ candidates: update(state.candidates, id, { communication, roleFit, overall, status }) });
      }
      if (action === "OWNER_DECISION") {
        const decision = prompt("Owner decision (Approve/Reject/Hold)", "Approve") || "Approve";
        const status = decision.toUpperCase() === "APPROVE" ? "READY_FOR_FINAL" : decision.toUpperCase() === "REJECT" ? "REJECTED" : "OWNER_REVIEW";
        await mockApi("ADMIN_DECISION", { id, decision });
        setState({ candidates: update(state.candidates, id, { status, decision }) });
      }
      if (action === "FINAL") {
        const decision = prompt("Final Interview: Select/Reject/Hold", "Select") || "Select";
        const status = decision.toUpperCase() === "SELECT" ? "SELECTED" : decision.toUpperCase() === "REJECT" ? "REJECTED" : "READY_FOR_FINAL";
        await mockApi("ADMIN_DECISION", { id, decision });
        setState({ candidates: update(state.candidates, id, { status, decision }) });
      }
    });
  });
}

function interviewCard(c) {
  const tone = statusMap.CANDIDATE[c.status]?.tone;
  const chipClass = tone ? `chip chip--${tone}` : "chip";
  return `
    <div class="card">
      <div class="flex space-between">
        <div>
          <h3 class="card__title">${c.name}</h3>
          <div class="card__meta">${c.status}</div>
        </div>
        <span class="${chipClass}">${statusMap.CANDIDATE[c.status]?.label || c.status}</span>
      </div>
      <div class="card__actions">
        <button class="btn btn--pill" data-int="SCHEDULE" data-id="${c.id}">Schedule</button>
        <button class="btn btn--pill" data-int="PRE_FEEDBACK" data-id="${c.id}">Pre-Interview Feedback</button>
        <button class="btn btn--pill btn--ghost" data-int="OWNER_DECISION" data-id="${c.id}">Owner Decision</button>
        <button class="btn btn--pill btn--ghost" data-int="FINAL" data-id="${c.id}">Final Interview</button>
      </div>
    </div>
  `;
}

function update(list, id, patch) {
  return (list || []).map((c) => (c.id === id ? { ...c, ...patch } : c));
}
