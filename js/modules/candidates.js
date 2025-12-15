import { mockApi } from "../api.js";
import { setState } from "../state.js";
import { statusMap } from "../config.js";

export function renderCandidates(target, state) {
  const candidates = state.candidates || [];
  target.innerHTML = `
    <div class="panel__header flex space-between">
      <div>
        <h2 class="panel__title">Candidates</h2>
        <p class="panel__body">Upload bulk CVs, auto-parse naming, capture shortlist decision.</p>
      </div>
      <button class="btn" id="add-candidate">Add / Bulk Upload</button>
    </div>
    <table class="table">
      <thead>
        <tr><th>Name</th><th>Mobile</th><th>Stage</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${candidates.map(row).join("") || '<tr><td colspan="4">No candidates yet.</td></tr>'}
      </tbody>
    </table>
  `;

  target.querySelector("#add-candidate").addEventListener("click", async () => {
    const name = prompt("Candidate Name") || "";
    if (!name) return;
    const mobile = prompt("Mobile") || "";
    const res = await mockApi("ADD_CANDIDATE", { name, mobile });
    if (res.ok) {
      const newCandidate = { id: crypto.randomUUID(), name, mobile, status: "SHORTLISTED" };
      setState({ candidates: [...candidates, newCandidate] });
    }
  });

  target.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const cand = candidates.find((c) => c.id === id);
      const remark = action === "REJECT" ? prompt("Reason") || "" : undefined;
      await mockApi("SHORTLIST_DECISION", { id, action, remark });
      const status = action === "REJECT" ? "REJECTED" : "ON_CALL";
      setState({ candidates: candidates.map((c) => (c.id === id ? { ...c, status, remark } : c)) });
    });
  });
}

function row(candidate) {
  const tone = statusMap.CANDIDATE[candidate.status]?.tone;
  const chipClass = tone ? `chip chip--${tone}` : "chip";
  return `
    <tr>
      <td>${candidate.name}</td>
      <td>${candidate.mobile}</td>
      <td><span class="${chipClass}">${statusMap.CANDIDATE[candidate.status]?.label || candidate.status}</span></td>
      <td class="flex" style="gap:6px;">
        <button class="btn btn--pill" data-action="APPROVE" data-id="${candidate.id}">Approve → On-Call</button>
        <button class="btn btn--pill btn--danger" data-action="REJECT" data-id="${candidate.id}">Reject</button>
      </td>
    </tr>
  `;
}
