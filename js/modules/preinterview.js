import { apiCall } from "../api.js";

export async function renderPreInterviewPage({ headerEl, rootEl }) {
  headerEl.textContent = "PRE-INTERVIEW FEEDBACK";
  rootEl.innerHTML = `<div class="card card-wide">Loading...</div>${modalHtml()}`;

  try {
    const res = await apiCall("LIST_PREINTERVIEW_QUEUE", {});
    const queue = res.queue || [];

    rootEl.innerHTML = `
      <div class="card card-wide">
        <div class="row">
          <h3 style="margin:0">Pre-Interview Queue</h3>
          <span class="pill">${queue.length} items</span>
        </div>
        <p class="muted">Interview Appeared → Feedback → Pass/Fail → Test Link</p>
        <div class="hr"></div>
        <div id="list"></div>
      </div>
      ${modalHtml()}
    `;

    const list = rootEl.querySelector("#list");
    if (!queue.length) {
      list.innerHTML = `<div class="muted">No candidates in pre-interview panel.</div>`;
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
          ${c.interview?.date ? `<span class="pill">Interview: ${esc(c.interview.date)} ${esc(c.interview.time || "")}</span>` : ``}
          ${c.interview?.location ? `<span class="pill">Loc: ${esc(c.interview.location)}</span>` : ``}
        </div>

        ${c.preInterview ? `
          <div class="hr"></div>
          <div class="row">
            <span class="pill">Comm: ${esc(c.preInterview.communication)}</span>
            <span class="pill">RoleFit: ${esc(c.preInterview.roleFit)}</span>
            <span class="pill ok">Overall: ${esc(c.preInterview.overall)}</span>
            ${c.ui?.hrLocked ? `<span class="pill danger">HR Locked</span>` : ``}
          </div>
          ${c.preInterview.remark ? `<div class="muted small" style="margin-top:8px">Remark: ${esc(c.preInterview.remark)}</div>` : ``}
        ` : ``}

        ${c.tests?.link ? `
          <div class="hr"></div>
          <div class="row">
            <span class="pill">Tests: ${(c.tests.assigned||[]).map(esc).join(", ")}</span>
            <a class="pill ok" target="_blank" href="${esc(c.tests.link)}">Open Test Link</a>
            <span class="pill warn">Expires: ${esc(c.tests.expiresAt || "")}</span>
          </div>
        ` : ``}

        <div class="hr"></div>

        <div class="row">
          ${c.ui?.canFillFeedback ? `<button class="btn btn-sm" data-fb="${esc(c.id)}">Fill Feedback</button>` : ``}
          ${c.ui?.canGenerateTest ? `<button class="btn btn-sm" data-gt="${esc(c.id)}">Generate Test Link</button>` : ``}
          ${c.ui?.canGenerateTest && c.tests?.link ? `<button class="btn btn-sm right" data-copy="${esc(c.tests.link)}">Copy Link</button>` : ``}
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-fb]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-fb");
      const form = await openFeedbackModal();
      if (!form) return;

      await apiCall("SUBMIT_PREINTERVIEW_FEEDBACK", {
        candidateId: id,
        communication: Number(form.communication),
        roleFit: Number(form.roleFit),
        remark: form.remark
      });

      location.hash = "#/pre-interview";
    });

    list.querySelectorAll("[data-gt]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-gt");
      const out = await apiCall("GENERATE_TEST_LINK", { candidateId: id });
      alert("Test link generated ✅\n" + (out.test?.link || ""));
      location.hash = "#/pre-interview";
    });

    list.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => {
      const link = b.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(link);
        alert("Copied ✅");
      } catch {
        prompt("Copy this link:", link);
      }
    });

  } catch (e) {
    rootEl.innerHTML = `<div class="card card-wide"><h3>Error</h3><div class="toast">${esc(e.message || String(e))}</div></div>${modalHtml()}`;
  }
}

/** ---------- Feedback Modal ---------- */
function modalHtml() {
  return `
    <div class="modal-backdrop" id="pfBack" style="display:none">
      <div class="modal">
        <div class="row">
          <h3 style="margin:0">Pre-Interview Feedback</h3>
          <button class="btn btn-sm right" id="pfClose">X</button>
        </div>

        <div class="hr"></div>

        <div class="grid grid-2">
          <div class="form-row">
            <div class="label">Communication (0-10)</div>
            <input class="input" id="pfComm" type="number" min="0" max="10" step="1" value="6" />
          </div>
          <div class="form-row">
            <div class="label">Role Fit (0-10)</div>
            <input class="input" id="pfRole" type="number" min="0" max="10" step="1" value="6" />
          </div>
        </div>

        <div class="form-row">
          <div class="label">Remark (optional)</div>
          <input class="input" id="pfRemark" placeholder="notes..." />
        </div>

        <div class="row">
          <button class="btn" id="pfSubmit">Save</button>
        </div>
      </div>
    </div>
  `;
}

function openFeedbackModal() {
  return new Promise((resolve) => {
    const back = document.getElementById("pfBack");
    const close = document.getElementById("pfClose");
    const submit = document.getElementById("pfSubmit");

    const comm = document.getElementById("pfComm");
    const role = document.getElementById("pfRole");
    const remark = document.getElementById("pfRemark");

    comm.value = 6;
    role.value = 6;
    remark.value = "";

    function hide(val) {
      back.style.display = "none";
      close.onclick = null;
      submit.onclick = null;
      resolve(val);
    }

    back.style.display = "flex";
    close.onclick = () => hide(null);

    submit.onclick = () => {
      const c = Number(comm.value);
      const r = Number(role.value);
      const rm = (remark.value || "").trim();
      if (!Number.isFinite(c) || c < 0 || c > 10) return alert("Communication 0-10");
      if (!Number.isFinite(r) || r < 0 || r > 10) return alert("Role Fit 0-10");
      hide({ communication: c, roleFit: r, remark: rm });
    };
  });
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
