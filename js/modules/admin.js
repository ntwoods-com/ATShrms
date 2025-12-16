import { apiCall } from "../api.js";

export async function renderAdminPage({ headerEl, rootEl }) {
  headerEl.textContent = "ADMIN REVIEW";
  rootEl.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">Admin Review Console</h3>
        <button class="btn btn-sm right" id="refreshBtn">Refresh</button>
      </div>
      <p class="muted">Pre-Interview Fail + Test Fail + Rejection Revert</p>
      <div class="hr"></div>
      <div class="row" style="gap:8px; flex-wrap:wrap">
        <button class="btn btn-sm" data-tab="pre">Pre-Interview Fail</button>
        <button class="btn btn-sm" data-tab="test">Test Fail</button>
        <button class="btn btn-sm" data-tab="rej">Rejection Log</button>
      </div>
      <div class="hr"></div>
      <div id="pane">Loading...</div>
    </div>
  `;

  const pane = rootEl.querySelector("#pane");
  const refreshBtn = rootEl.querySelector("#refreshBtn");

  let activeTab = "pre";
  rootEl.querySelectorAll("[data-tab]").forEach(b => {
    b.onclick = () => { activeTab = b.dataset.tab; load(); };
  });
  refreshBtn.onclick = () => load();

  await load();

  async function load() {
    pane.innerHTML = `<div class="muted">Loading...</div>`;

    try {
      if (activeTab === "rej") {
        const r = await apiCall("LIST_REJECTION_LOG", {});
        renderRejections(r.rejections || []);
        return;
      }

      const res = await apiCall("LIST_ADMIN_QUEUE", {});
      const q = res.queue || {};

      if (activeTab === "pre") renderPreFail(q.preInterviewFail || []);
      if (activeTab === "test") renderTestFail(q.testFail || []);

    } catch (e) {
      pane.innerHTML = `<div class="toast">${esc(e.message || String(e))}</div>`;
    }
  }

  function renderPreFail(list) {
    if (!list.length) {
      pane.innerHTML = `<div class="muted">No PRE_INTERVIEW_FAIL candidates.</div>`;
      return;
    }

    pane.innerHTML = list.map(c => {
      const pre = c.preInterview || {};
      const comm = pre.communication ?? "-";
      const roleFit = pre.roleFit ?? "-";
      const overall = pre.overall ?? "-";

      return `
        <div class="card card-wide" style="margin-bottom:12px">
          <div class="row">
            <span class="pill danger"><b>PRE_INTERVIEW_FAIL</b></span>
            <span class="pill">#${esc(c.id)}</span>
            <span class="right muted small">Req: ${esc(c.requirementId || "")}</span>
          </div>

          <div style="margin-top:10px; font-weight:900">${esc(c.name)}</div>
          <div class="muted small" style="margin-top:4px">${esc(c.mobile || "")} • ${esc(c.source || "")}</div>

          <div class="row" style="margin-top:10px">
            <span class="pill">Comm: ${esc(comm)}</span>
            <span class="pill">RoleFit: ${esc(roleFit)}</span>
            <span class="pill warn">Overall: ${esc(overall)}</span>
            ${c.cvUrl ? `<a class="pill ok right" target="_blank" href="${esc(c.cvUrl)}">Open CV</a>` : ``}
          </div>

          ${pre.remark ? `<div class="muted small" style="margin-top:8px">HR Remark: ${esc(pre.remark)}</div>` : ``}

          <div class="hr"></div>

          <div class="row" style="gap:8px; flex-wrap:wrap">
            <button class="btn btn-sm" data-edit-pre="${esc(c.id)}">Edit HR Marks</button>
            <button class="btn btn-sm" data-revert-hr="${esc(c.id)}">Revert to HR</button>
            <button class="btn btn-sm" data-reject="${esc(c.id)}" data-stage="PRE_INTERVIEW_FAIL">Reject</button>
          </div>
        </div>
      `;
    }).join("");

    pane.querySelectorAll("[data-edit-pre]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-edit-pre");
      const comm = prompt("Communication (0-10)?", "6");
      if (comm === null) return;
      const rf = prompt("Role Fit (0-10)?", "6");
      if (rf === null) return;
      const remark = prompt("Admin remark (optional):", "") || "";

      await apiCall("ADMIN_PREINTERVIEW_EDIT", {
        candidateId: id,
        communication: Number(comm),
        roleFit: Number(rf),
        remark
      });

      alert("Saved ✅ (If overall >= 6 then moved to PRE_INTERVIEW_PASS)");
      location.hash = "#/admin";
    });

    pane.querySelectorAll("[data-revert-hr]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-revert-hr");
      const remark = prompt("Reason to revert back to HR?", "") || "";
      await apiCall("ADMIN_PREINTERVIEW_REVERT_TO_HR", { candidateId: id, remark });
      alert("Reverted to HR ✅ (INTERVIEW_APPEARED)");
      location.hash = "#/admin";
    });

    pane.querySelectorAll("[data-reject]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-reject");
      const stage = b.getAttribute("data-stage");
      const reason = prompt("Reject reason (mandatory):", "");
      if (!reason) return alert("Reason required");
      await apiCall("ADMIN_CANDIDATE_REJECT", { candidateId: id, stage, reason });
      alert("Rejected ✅");
      location.hash = "#/admin";
    });
  }

  function renderTestFail(list) {
    if (!list.length) {
      pane.innerHTML = `<div class="muted">No TEST_FAIL candidates.</div>`;
      return;
    }

    pane.innerHTML = list.map(c => {
      const result = c.tests?.result || {};
      const score = (result.finalScore ?? "-");
      const corr = (result.correct ?? "-");
      const tot = (result.totalQuestions ?? "-");

      return `
        <div class="card card-wide" style="margin-bottom:12px">
          <div class="row">
            <span class="pill danger"><b>TEST_FAIL</b></span>
            <span class="pill">#${esc(c.id)}</span>
            <span class="right muted small">Req: ${esc(c.requirementId || "")}</span>
          </div>

          <div style="margin-top:10px; font-weight:900">${esc(c.name)}</div>
          <div class="muted small" style="margin-top:4px">${esc(c.mobile || "")} • ${esc(c.source || "")}</div>

          <div class="row" style="margin-top:10px">
            <span class="pill warn">Score: ${esc(score)}</span>
            <span class="pill">Correct: ${esc(corr)}/${esc(tot)}</span>
            ${c.cvUrl ? `<a class="pill ok right" target="_blank" href="${esc(c.cvUrl)}">Open CV</a>` : ``}
          </div>

          <div class="hr"></div>

          <div class="row" style="gap:8px; flex-wrap:wrap">
            <button class="btn btn-sm" data-override="${esc(c.id)}">Override Score</button>
            <button class="btn btn-sm" data-resume="${esc(c.id)}">Resume (Force Pass)</button>
            <button class="btn btn-sm" data-reject="${esc(c.id)}" data-stage="TEST_FAIL">Reject</button>
          </div>

          <div class="muted small" style="margin-top:8px">
            Pass hone par candidate <b>FINAL_INTERVIEW</b> stage me chala jayega.
          </div>
        </div>
      `;
    }).join("");

    pane.querySelectorAll("[data-override]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-override");
      const sc = prompt("Final Score (0-100)?", "60");
      if (sc === null) return;
      const remark = prompt("Admin remark (optional):", "") || "";
      await apiCall("ADMIN_TEST_EDIT", { candidateId: id, finalScore: Number(sc), remark });
      alert("Updated ✅ (>=60 → FINAL_INTERVIEW)");
      location.hash = "#/admin";
    });

    pane.querySelectorAll("[data-resume]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-resume");
      const remark = prompt("Resume remark (optional):", "") || "";
      await apiCall("ADMIN_TEST_RESUME", { candidateId: id, remark });
      alert("Resumed ✅ (FINAL_INTERVIEW)");
      location.hash = "#/admin";
    });

    pane.querySelectorAll("[data-reject]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-reject");
      const stage = b.getAttribute("data-stage");
      const reason = prompt("Reject reason (mandatory):", "");
      if (!reason) return alert("Reason required");
      await apiCall("ADMIN_CANDIDATE_REJECT", { candidateId: id, stage, reason });
      alert("Rejected ✅");
      location.hash = "#/admin";
    });
  }

  function renderRejections(list) {
    if (!list.length) {
      pane.innerHTML = `<div class="muted">No unreverted rejections.</div>`;
      return;
    }

    pane.innerHTML = list.map(r => `
      <div class="card card-wide" style="margin-bottom:12px">
        <div class="row">
          <span class="pill danger"><b>REJECT</b></span>
          <span class="pill">#${esc(r.id)}</span>
          <span class="right muted small">${esc(r.createdAt || "")}</span>
        </div>

        <div style="margin-top:10px">
          <b>${esc(r.entityType)}</b> • <span class="pill">${esc(r.entityId)}</span>
        </div>
        <div class="muted small" style="margin-top:6px">Stage: ${esc(r.stage)}</div>
        <div style="margin-top:6px">Reason: ${esc(r.reason)}</div>

        <div class="hr"></div>
        <div class="row">
          <button class="btn btn-sm" data-revert="${esc(r.id)}">Revert</button>
        </div>
      </div>
    `).join("");

    pane.querySelectorAll("[data-revert]").forEach(b => b.onclick = async () => {
      const rejectionId = b.getAttribute("data-revert");
      if (!confirm("Revert this rejection?")) return;
      const out = await apiCall("REVERT_REJECTION", { rejectionId });
      alert("Reverted ✅ → " + (out.reverted?.revertedTo || ""));
      location.hash = "#/admin";
    });
  }
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
