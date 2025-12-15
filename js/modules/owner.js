import { apiCall } from "../api.js";
import { routeTo } from "../ui-router.js";

export async function renderOwnerPage({ headerEl, rootEl }) {
  headerEl.textContent = "OWNER DECISION";
  rootEl.innerHTML = `<div class="card card-wide">Loading...</div>`;

  try {
    const res = await apiCall("LIST_OWNER_QUEUE", {});
    const queue = res.queue || [];

    rootEl.innerHTML = `
      <div class="card card-wide">
        <div class="row">
          <h3 style="margin:0">Owner Review Queue</h3>
          <span class="pill">${queue.length} items</span>
        </div>
        <p class="muted">Approve → Interview Scheduling | Reject → Rejection Log | Hold → Owner Hold</p>
        <div class="hr"></div>
        <div id="list"></div>
      </div>
    `;

    const list = rootEl.querySelector("#list");
    if (!queue.length) {
      list.innerHTML = `<div class="muted">No candidates in OWNER queue 🎉</div>`;
      return;
    }

    list.innerHTML = queue.map(c => `
      <div class="card card-wide" style="margin-bottom:12px">
        <div class="row">
          <span class="pill warn"><b>${esc(c.status)}</b></span>
          <span class="pill">#${esc(c.id)}</span>
          <span class="right muted small">Req: ${esc(c.requirementId || "")}</span>
        </div>

        <div style="margin-top:10px; font-weight:900">${esc(c.name)}</div>
        <div class="muted small" style="margin-top:4px">${esc(c.mobile || "")} • ${esc(c.source || "")}</div>

        <div class="row" style="margin-top:10px">
          ${c.cvUrl ? `<a class="pill ok" href="${esc(c.cvUrl)}" target="_blank">Open CV</a>` : `<span class="pill">No CV</span>`}
          ${c.call ? `<span class="pill">Call: ${esc(c.call.outcome)} | Comm:${esc(c.call.communication ?? "-")} Exp:${esc(c.call.experience ?? "-")} Rec:${esc(c.call.recommend ?? "-")}</span>` : `<span class="pill">No Call Data</span>`}
        </div>

        <div class="hr"></div>

        <div class="row">
          ${c.ui?.canApprove ? `<button class="btn btn-sm" data-ap="${esc(c.id)}">Approve (Walk-in)</button>` : ``}
          ${c.ui?.canHold ? `<button class="btn btn-sm" data-hold="${esc(c.id)}">Hold</button>` : ``}
          ${c.ui?.canReject ? `<button class="btn btn-sm right" data-rej="${esc(c.id)}">Reject</button>` : ``}
          ${c.ui?.canReleaseHold ? `<button class="btn btn-sm" data-rel="${esc(c.id)}">Release Hold</button>` : ``}
          <button class="btn btn-sm" data-openi="${esc(c.id)}">Open Interview Panel</button>
        </div>
      </div>
    `).join("");

    // bind
    list.querySelectorAll("[data-ap]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-ap");
      await apiCall("OWNER_DECISION", { candidateId: id, decision: "APPROVE", remark: "" });
      alert("Approved ✅ Candidate moved to INTERVIEW_SCHEDULE");
      routeTo("interviews", { mode: "SCHEDULE" });
    });

    list.querySelectorAll("[data-hold]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-hold");
      await apiCall("OWNER_DECISION", { candidateId: id, decision: "HOLD", remark: "" });
      location.hash = "#/owner";
    });

    list.querySelectorAll("[data-rel]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-rel");
      await apiCall("OWNER_DECISION", { candidateId: id, decision: "RELEASE_HOLD", remark: "" });
      location.hash = "#/owner";
    });

    list.querySelectorAll("[data-rej]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-rej");
      const remark = prompt("Reject reason (mandatory):");
      if (!remark) return;
      await apiCall("OWNER_DECISION", { candidateId: id, decision: "REJECT", remark });
      location.hash = "#/owner";
    });

    list.querySelectorAll("[data-openi]").forEach(b => b.onclick = () => {
      routeTo("interviews", { mode: "SCHEDULE" });
    });

  } catch (e) {
    rootEl.innerHTML = `<div class="card card-wide"><h3>Error</h3><div class="toast">${esc(e.message || String(e))}</div></div>`;
  }
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
