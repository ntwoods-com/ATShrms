import { apiCall } from "../api.js";

export async function renderFinalInterviewPage({ headerEl, rootEl }) {
  headerEl.textContent = "FINAL INTERVIEW (OWNER)";
  rootEl.innerHTML = `<div class="card card-wide">Loading...</div>`;

  try {
    const res = await apiCall("LIST_FINAL_INTERVIEW_QUEUE", {});
    const queue = res.queue || [];

    if (!queue.length) {
      rootEl.innerHTML = `<div class="card card-wide"><div class="muted">No candidates in FINAL_INTERVIEW.</div></div>`;
      return;
    }

    rootEl.innerHTML = `
      <div class="card card-wide">
        <div class="row">
          <h3 style="margin:0">Final Interview Queue</h3>
          <span class="pill">${queue.length} items</span>
        </div>
        <div class="hr"></div>
        <div id="list"></div>
      </div>
    `;

    const list = rootEl.querySelector("#list");
    list.innerHTML = queue.map(c => {
      const score = c.tests?.result?.finalScore ?? "-";
      const overall = c.preInterview?.overall ?? "-";
      return `
        <div class="card card-wide" style="margin-bottom:12px">
          <div class="row">
            <span class="pill warn"><b>${esc(c.status)}</b></span>
            <span class="pill">#${esc(c.id)}</span>
            <span class="right muted small">Req: ${esc(c.requirementId || "")}</span>
          </div>

          <div style="margin-top:10px; font-weight:900">${esc(c.name)}</div>
          <div class="muted small" style="margin-top:4px">${esc(c.mobile || "")} • ${esc(c.source || "")}</div>

          <div class="row" style="margin-top:10px">
            <span class="pill">Pre: ${esc(overall)}</span>
            <span class="pill">Test: ${esc(score)}</span>
            ${c.cvUrl ? `<a class="pill ok right" target="_blank" href="${esc(c.cvUrl)}">Open CV</a>` : ``}
          </div>

          <div class="hr"></div>
          <div class="row" style="gap:8px; flex-wrap:wrap">
            ${c.ui?.canSelect ? `<button class="btn btn-sm" data-sel="${esc(c.id)}">Select</button>` : ``}
            ${c.ui?.canReject ? `<button class="btn btn-sm" data-rej="${esc(c.id)}">Reject</button>` : ``}
            ${c.ui?.canHold ? `<button class="btn btn-sm" data-hold="${esc(c.id)}">Hold</button>` : ``}
            ${c.ui?.canReleaseHold ? `<button class="btn btn-sm" data-rel="${esc(c.id)}">Release Hold</button>` : ``}
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-sel]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-sel");
      const jd = prompt("Joining Date (yyyy-mm-dd) ?", "");
      if (!jd) return alert("Joining date required");
      const remark = prompt("Remark (optional):", "") || "";
      await apiCall("OWNER_FINAL_DECISION", { candidateId: id, decision: "SELECT", joiningDate: jd, remark });
      alert("Selected ✅ Candidate moved to ONBOARDING_DOCS");
      location.hash = "#/final-interview";
    });

    list.querySelectorAll("[data-rej]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-rej");
      const reason = prompt("Reject reason (mandatory):", "");
      if (!reason) return alert("Reason required");
      await apiCall("OWNER_FINAL_DECISION", { candidateId: id, decision: "REJECT", remark: reason });
      alert("Rejected ✅");
      location.hash = "#/final-interview";
    });

    list.querySelectorAll("[data-hold]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-hold");
      const remark = prompt("Hold remark (optional):", "") || "";
      await apiCall("OWNER_FINAL_DECISION", { candidateId: id, decision: "HOLD", remark });
      alert("Hold ✅");
      location.hash = "#/final-interview";
    });

    list.querySelectorAll("[data-rel]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-rel");
      await apiCall("OWNER_FINAL_DECISION", { candidateId: id, decision: "RELEASE_HOLD" });
      alert("Released ✅");
      location.hash = "#/final-interview";
    });

  } catch (e) {
    rootEl.innerHTML = `<div class="card card-wide"><div class="toast">${esc(e.message || String(e))}</div></div>`;
  }
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
