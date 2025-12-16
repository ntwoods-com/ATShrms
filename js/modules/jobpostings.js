import { apiCall } from "../api.js";
import { routeTo } from "../ui-router.js";

export async function renderJobPostingPage({ headerEl, rootEl, params }) {
  headerEl.textContent = "JOB POSTING";
  rootEl.innerHTML = `<div class="card card-wide">Loading...</div>`;

  try {
    const reqRes = await apiCall("LIST_REQUIREMENTS_FOR_JOB_POSTING");
    const reqs = reqRes.requirements || [];

    const selectedReq = params?.req || (reqs[0]?.id || "");
    rootEl.innerHTML = `
      <div class="card card-wide">
        <div class="row">
          <h3 style="margin:0">Job Posting</h3>
          <span class="pill">Approved Requirements Only</span>
        </div>

        <div class="hr"></div>

        <div class="grid grid-2">
          <div class="form-row">
            <div class="label">Select Requirement</div>
            <select id="reqSel" class="select"></select>
          </div>
          <div class="form-row">
            <div class="label">Status</div>
            <div id="statusBox" class="pill"></div>
          </div>
        </div>

        <div class="hr"></div>

        <div id="jpBody"></div>
      </div>
    `;

    const reqSel = rootEl.querySelector("#reqSel");
    const statusBox = rootEl.querySelector("#statusBox");
    const jpBody = rootEl.querySelector("#jpBody");

    reqSel.innerHTML = reqs.map(r => {
      const unlock = r.addCandidateUnlocked ? "UNLOCKED" : "LOCKED";
      return `<option value="${esc(r.id)}">#${esc(r.id)} • ${esc(r.templateRole)} • AddCandidate:${unlock}</option>`;
    }).join("");

    if (selectedReq) reqSel.value = selectedReq;

    reqSel.onchange = () => {
      routeTo("job-postings", { req: reqSel.value });
    };

    if (!reqSel.value) {
      jpBody.innerHTML = `<div class="muted">No approved requirement found.</div>`;
      return;
    }

    const jpRes = await apiCall("GET_JOB_POSTING", { requirementId: reqSel.value });
    const jp = jpRes.jobPosting;

    renderJobPostingUI({ jp, statusBox, jpBody, requirementId: reqSel.value });

  } catch (e) {
    rootEl.innerHTML = `
      <div class="card card-wide">
        <h3>Error</h3>
        <div class="toast">${esc(e.message || String(e))}</div>
      </div>
    `;
  }
}

function renderJobPostingUI({ jp, statusBox, jpBody, requirementId }) {
  const postedCount = jp.postedCount || 0;
  const unlock = jp.addCandidateUnlocked ? "UNLOCKED" : "LOCKED";
  statusBox.className = "pill " + (jp.addCandidateUnlocked ? "ok" : "bad");
  statusBox.textContent = `JP:${jp.status} | Posted:${postedCount} | AddCandidate:${unlock}`;

  const portals = jp.payload?.portals || [];
  const jdText = jp.payload?.jdText || "";

  jpBody.innerHTML = `
    <div class="grid">
      <div class="row">
        <div class="pill">JobPostingId: ${esc(jp.id)}</div>
        <button class="btn right" id="btnCopyJD">Copy JD</button>
      </div>

      <div class="form-row">
        <div class="label">Job Description (JD)</div>
        <textarea class="textarea" id="jdText" placeholder="Paste/Write JD here...">${esc(jdText)}</textarea>
      </div>

      <div class="row">
        <button class="btn" id="btnSaveJD">Save JD</button>
        <span class="muted small" id="msg"></span>
      </div>

      <div class="hr"></div>

      <div class="row">
        <h4 style="margin:0">Portals</h4>
        <span class="pill">${portals.length} total</span>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Portal</th>
            <th>Posted?</th>
            <th>Screenshot URL</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${portals.map(p => `
            <tr>
              <td><b>${esc(p.name)}</b></td>
              <td>${p.posted ? `<span class="pill ok">YES</span>` : `<span class="pill bad">NO</span>`}</td>
              <td><input class="input" data-shot="${esc(p.name)}" value="${esc(p.screenshotUrl || "")}" placeholder="Optional screenshot link" /></td>
              <td>
                ${p.posted
                  ? `<span class="muted small">${esc(p.postedAt || "")}</span>`
                  : `<button class="btn" data-post="${esc(p.name)}">Mark Posted</button>`}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="hr"></div>

      <div class="grid grid-2">
        <div class="form-row">
          <div class="label">Add New Portal</div>
          <input class="input" id="newPortal" placeholder="e.g. Shine, Internshala, Local Groups..." />
        </div>
        <div class="form-row">
          <div class="label">&nbsp;</div>
          <button class="btn" id="btnAddPortal">Add Portal</button>
        </div>
      </div>

      <div class="hint">
        Rule: <b>At least 1 portal posted</b> ho jaaye to <b>Add Candidate unlock</b> ho jayega (Next module me actual Add Candidate screen aayegi).
      </div>
    </div>
  `;

  const msg = jpBody.querySelector("#msg");
  const jdEl = jpBody.querySelector("#jdText");

  jpBody.querySelector("#btnCopyJD").onclick = async () => {
    await navigator.clipboard.writeText(jdEl.value || "");
    msg.textContent = "JD copied ✅";
    setTimeout(() => msg.textContent = "", 1200);
  };

  jpBody.querySelector("#btnSaveJD").onclick = async () => {
    try {
      msg.textContent = "Saving...";
      await apiCall("SET_JOB_POSTING_JD", { requirementId, jdText: jdEl.value || "" });
      msg.textContent = "Saved ✅";
      setTimeout(() => msg.textContent = "", 1200);
      // refresh page
      location.hash = "#/job-postings?req=" + encodeURIComponent(requirementId);
    } catch (e) {
      msg.textContent = e.message || String(e);
    }
  };

  jpBody.querySelectorAll("[data-post]").forEach(btn => {
    btn.onclick = async () => {
      try {
        const portalName = btn.getAttribute("data-post");
        const shot = jpBody.querySelector(`[data-shot="${cssId(portalName)}"]`)?.value || "";
        msg.textContent = "Marking...";
        await apiCall("MARK_PORTAL_POSTED", { requirementId, portalName, screenshotUrl: shot });
        msg.textContent = "Updated ✅";
        location.hash = "#/job-postings?req=" + encodeURIComponent(requirementId);
      } catch (e) {
        msg.textContent = e.message || String(e);
      }
    };
  });

  jpBody.querySelector("#btnAddPortal").onclick = async () => {
    try {
      const name = (jpBody.querySelector("#newPortal").value || "").trim();
      if (!name) return alert("Portal name required");
      msg.textContent = "Adding...";
      await apiCall("ADD_JOB_PORTAL", { requirementId, portalName: name });
      msg.textContent = "Added ✅";
      location.hash = "#/job-postings?req=" + encodeURIComponent(requirementId);
    } catch (e) {
      msg.textContent = e.message || String(e);
    }
  };
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
function cssId(s){return String(s).replace(/[^a-zA-Z0-9_-]/g,"_")}
