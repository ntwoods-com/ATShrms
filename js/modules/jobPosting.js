import { setState } from "../state.js";
import { mockApi } from "../api.js";

export function renderJobPosting(target, state) {
  const { requirement } = state;
  const posted = state.requirement?.jobPosted || false;
  target.innerHTML = `
    <div class="panel__header flex space-between">
      <div>
        <h2 class="panel__title">Job Posting</h2>
        <p class="panel__body">HR ensures JD is live on at least one portal before candidate intake.</p>
      </div>
      <span class="badge">Requirement ${requirement?.status || "NEW"}</span>
    </div>
    <div class="section">
      <div class="flex" style="gap:8px; flex-wrap:wrap;">
        <button class="btn" id="copy-jd">Copy JD</button>
        <button class="btn btn--ghost" id="upload-shot">Upload Portal Screenshot</button>
        <button class="btn ${posted ? "" : "btn--ghost"}" id="mark-posted">${posted ? "Posted" : "Mark Posted"}</button>
      </div>
      <p class="section__desc">Add Candidate unlocks only when at least one portal is posted.</p>
    </div>
  `;

  target.querySelector("#copy-jd").addEventListener("click", () => {
    navigator.clipboard?.writeText(requirement?.jd || "");
  });

  target.querySelector("#upload-shot").addEventListener("click", () => {
    alert("Upload placeholder — integrate with Drive picker in production.");
  });

  target.querySelector("#mark-posted").addEventListener("click", async () => {
    const res = await mockApi("JOB_POSTING", { requirementId: requirement?.id });
    if (res.ok) setState({ requirement: { ...requirement, jobPosted: true } });
  });
}
