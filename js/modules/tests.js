import { mockApi } from "../api.js";
import { setState } from "../state.js";

const roleMapping = {
  Accounts: ["Tally", "Excel"],
  "CRM/CCE": ["Excel", "Voice"]
};

export function renderTests(target, state) {
  const candidates = (state.candidates || []).filter((c) => c.status === "PRE_INTERVIEW_PASS" || c.status === "TEST_ASSIGNED" || c.status === "TEST_FAIL");
  target.innerHTML = `
    <div class="panel__header flex space-between">
      <div>
        <h2 class="panel__title">Tests</h2>
        <p class="panel__body">Auto-assign per role, 24-hr token links, HR view-only.</p>
      </div>
      <span class="badge">${candidates.length} in testing</span>
    </div>
    <div class="card-grid">
      ${candidates.map((c) => testCard(c)).join("") || "<p>No candidates awaiting tests.</p>"}
    </div>
  `;

  target.querySelectorAll("button[data-test]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.test;
      if (action === "ASSIGN") {
        const role = prompt("Role for test mapping", "CRM/CCE") || "CRM/CCE";
        const tests = roleMapping[role] || [];
        await mockApi("GENERATE_TEST_LINK", { id, role, tests });
        setState({ candidates: update(state.candidates, id, { status: "TEST_ASSIGNED", role, tests }) });
      }
      if (action === "RESULT") {
        const tally = Number(prompt("Tally/Voice Score", "7") || 0);
        const excel = Number(prompt("Excel Score", "8") || 0);
        const voice = Number(prompt("Voice Score", "8") || 0);
        const overall = Number(((tally + excel + voice) / 3).toFixed(1));
        const status = overall >= 6 ? "READY_FOR_FINAL" : "TEST_FAIL";
        await mockApi("SUBMIT_TEST", { id, tally, excel, voice, overall });
        setState({ candidates: update(state.candidates, id, { status, tally, excel, voice, overall }) });
      }
    });
  });
}

function testCard(c) {
  return `
    <div class="card">
      <div class="flex space-between">
        <div>
          <h3 class="card__title">${c.name}</h3>
          <div class="card__meta">${c.role || "Role TBC"}</div>
        </div>
        <span class="badge">${c.status}</span>
      </div>
      <div class="card__actions">
        <button class="btn btn--pill" data-test="ASSIGN" data-id="${c.id}">Assign Tests</button>
        <button class="btn btn--pill btn--ghost" data-test="RESULT" data-id="${c.id}">Submit Result</button>
      </div>
    </div>
  `;
}

function update(list, id, patch) {
  return (list || []).map((c) => (c.id === id ? { ...c, ...patch } : c));
}
