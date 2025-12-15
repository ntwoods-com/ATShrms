import { mockApi } from "../api.js";
import { setState } from "../state.js";
import { statusMap, defaultRequirementTemplate } from "../config.js";

export function renderRequirements(target, state) {
  const req = state.requirement ?? { status: "NEW", ...defaultRequirementTemplate };
  target.innerHTML = `
    <div class="panel__header flex space-between">
      <div>
        <h2 class="panel__title">Requirement</h2>
        <p class="panel__body">EA raises, HR reviews, Owner sees complete history. Status driven UI.</p>
      </div>
      <div class="chip ${tone(req.status)}">${statusLabel(req.status)}</div>
    </div>
    <div class="section">
      <div class="grid grid--2">
        ${textInput("jobRole", "Job Role", req.jobRole)}
        ${textInput("locations", "Locations (comma)", (req.locations || []).join(", "))}
        ${textInput("salaryBand", "Salary Band", req.salaryBand)}
        ${textInput("experience", "Experience", req.experience)}
      </div>
      <label for="jd">Job Description</label>
      <textarea id="jd">${req.jd || ""}</textarea>
      <div class="flex" style="margin-top:12px; gap:8px;">
        <button class="btn" id="raise-btn">Raise Requirement</button>
        <button class="btn btn--ghost" id="approve-btn">Approve</button>
        <button class="btn btn--danger" id="sendback-btn">Send Back</button>
      </div>
    </div>
    <div class="section">
      <h3 class="section__title">Audit Snapshot</h3>
      <p class="section__desc">Every action is recorded in AUDIT_LOG. Admin can revert using REJECTION_LOG.</p>
      <ul>
        ${(state.audit || []).map((a) => `<li>${a}</li>`).join("") || "<li>Pending actions...</li>"}
      </ul>
    </div>
  `;

  target.querySelector("#raise-btn").addEventListener("click", async () => {
    const payload = collect(target, req);
    const res = await mockApi("RAISE_REQUIREMENT", payload);
    if (res.ok) setState({ requirement: res.data.requirement });
  });

  target.querySelector("#approve-btn").addEventListener("click", async () => {
    const res = await mockApi("APPROVE_REQUIREMENT", { requirementId: req.id });
    if (res.ok) setState({ requirement: { ...req, status: "APPROVED" } });
  });

  target.querySelector("#sendback-btn").addEventListener("click", async () => {
    const remark = prompt("Remark for clarification?") || "";
    const res = await mockApi("SEND_BACK_REQUIREMENT", { requirementId: req.id, remark });
    if (res.ok) setState({ requirement: { ...req, status: "NEED_CLARIFICATION", remark } });
  });
}

function collect(target, base) {
  const role = target.querySelector("#jobRole").value;
  const locs = target.querySelector("#locations").value.split(",").map((s) => s.trim()).filter(Boolean);
  const salaryBand = target.querySelector("#salaryBand").value;
  const experience = target.querySelector("#experience").value;
  const jd = target.querySelector("#jd").value;
  return { ...base, jobRole: role, locations: locs, salaryBand, experience, jd };
}

function tone(status) {
  return statusMap.REQUIREMENT[status]?.tone ? `chip--${statusMap.REQUIREMENT[status].tone}` : "";
}

function statusLabel(status) {
  return statusMap.REQUIREMENT[status]?.label || status;
}

function textInput(id, label, value = "") {
  return `
    <div>
      <label for="${id}">${label}</label>
      <input id="${id}" value="${value}" />
    </div>`;
}
