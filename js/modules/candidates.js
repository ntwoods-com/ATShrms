import { apiCall } from "../api.js";
import { routeTo } from "../ui-router.js";

export async function renderCandidatesPage({ headerEl, rootEl, params }) {
  headerEl.textContent = "CANDIDATES";
  rootEl.innerHTML = `<div class="card card-wide">Loading...</div>`;

  try {
    const reqRes = await apiCall("LIST_REQUIREMENTS_FOR_CANDIDATES");
    const reqs = (reqRes.requirements || []).filter(r => r.addCandidateUnlocked);

    const selectedReq = params?.req || (reqs[0]?.id || "");
    const status = params?.st || "";

    rootEl.innerHTML = `
      <div class="grid grid-2">
        <div id="left"></div>
        <div id="right"></div>
      </div>

      ${modalHtml()}
    `;

    const left = rootEl.querySelector("#left");
    const right = rootEl.querySelector("#right");

    left.innerHTML = uploadPanelHtml(reqs, selectedReq);
    bindUploadPanel({ rootEl, reqs });

    await renderList({ right, requirementId: selectedReq, status });

  } catch (e) {
    rootEl.innerHTML = `
      <div class="card card-wide">
        <h3>Error</h3>
        <div class="toast">${esc(e.message || String(e))}</div>
      </div>
    `;
  }
}

function uploadPanelHtml(reqs, selectedReq) {
  return `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">Bulk Upload CV</h3>
        <span class="pill ok">Portal Posted ≥ 1</span>
      </div>
      <p class="muted">Filename: <b>Name_Mobile_Source.pdf</b></p>

      <div class="form-row">
        <div class="label">Select Requirement</div>
        <select class="select" id="reqSel">
          ${reqs.map(r => `<option ${r.id===selectedReq?"selected":""} value="${esc(r.id)}">#${esc(r.id)} • ${esc(r.title || r.templateRole)}</option>`).join("")}
        </select>
      </div>

      <div class="form-row">
        <div class="label">Select PDFs</div>
        <input class="input" id="cvFiles" type="file" accept="application/pdf" multiple />
      </div>

      <div class="hr"></div>
      <div id="preview" class="muted">No files selected.</div>

      <div class="hr"></div>
      <div class="row">
        <button class="btn" id="btnStart">Start Upload</button>
        <span class="muted small" id="msg"></span>
      </div>

      <div class="hr"></div>
      <div class="hint">
        Upload → CV_UPLOADED → modal Relevant? → YES=SHORTLISTED (then Send to On-Call) / NO=Rejected
      </div>
    </div>
  `;
}

function bindUploadPanel({ rootEl }) {
  const reqSel = rootEl.querySelector("#reqSel");
  const filesEl = rootEl.querySelector("#cvFiles");
  const preview = rootEl.querySelector("#preview");
  const msg = rootEl.querySelector("#msg");
  const btnStart = rootEl.querySelector("#btnStart");

  let files = [];

  reqSel.onchange = () => routeTo("candidates", { req: reqSel.value });

  filesEl.onchange = () => {
    files = Array.from(filesEl.files || []);
    if (!files.length) {
      preview.innerHTML = `<div class="muted">No files selected.</div>`;
      return;
    }
    preview.innerHTML = `
      <table class="table">
        <thead><tr><th>#</th><th>Filename</th><th>Parsed</th><th>Size</th></tr></thead>
        <tbody>
          ${files.map((f, idx) => {
            const p = parseName(f.name);
            return `<tr>
              <td>${idx+1}</td>
              <td><b>${esc(f.name)}</b></td>
              <td>${esc(p.name)} | ${esc(p.mobile)} | ${esc(p.source)}</td>
              <td>${formatBytes(f.size)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;
  };

  btnStart.onclick = async () => {
    try {
      if (!reqSel.value) throw new Error("Select requirement first");
      if (!files.length) throw new Error("Select at least 1 PDF");

      msg.textContent = "Uploading...";
      btnStart.disabled = true;

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.size > 8 * 1024 * 1024) throw new Error(`File too large (>8MB): ${f.name}`);

        msg.textContent = `Uploading ${i+1}/${files.length}: ${f.name}`;
        const base64 = await fileToBase64(f);

        const res = await apiCall("ADD_CANDIDATE", {
          requirementId: reqSel.value,
          fileName: f.name,
          fileMime: f.type || "application/pdf",
          fileBase64: base64
        });

        const cand = res.candidate;

        // relevant modal
        const decision = await askRelevantModal({
          title: `${cand.name} (${cand.mobile || "-"})`,
          sub: `Source: ${cand.source || "Unknown"} | Status: ${cand.status}`,
          cvUrl: cand.cvUrl
        });

        if (decision.ok) {
          await apiCall("SHORTLIST_DECISION", { candidateId: cand.id, decision: "YES" });
        } else {
          await apiCall("SHORTLIST_DECISION", { candidateId: cand.id, decision: "NO", reason: decision.reason || "Not relevant" });
        }
      }

      msg.textContent = "All uploaded ✅";
      btnStart.disabled = false;
      routeTo("candidates", { req: reqSel.value });

    } catch (e) {
      msg.textContent = e.message || String(e);
      btnStart.disabled = false;
    }
  };
}

async function renderList({ right, requirementId, status }) {
  const listRes = await apiCall("LIST_CANDIDATES", { requirementId, status });
  const candidates = listRes.candidates || [];

  right.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">Candidates</h3>
        <span class="pill">${candidates.length} items</span>
      </div>

      <div class="row" style="margin-top:10px">
        <button class="btn btn-sm" data-st="">All</button>
        <button class="btn btn-sm" data-st="CV_UPLOADED">CV_UPLOADED</button>
        <button class="btn btn-sm" data-st="SHORTLISTED">SHORTLISTED</button>
        <button class="btn btn-sm" data-st="CALL_PENDING">CALL_PENDING</button>
        <button class="btn btn-sm" data-st="OWNER_REVIEW">OWNER_REVIEW</button>
        <button class="btn btn-sm" data-st="REJECTED_SHORTLISTING">REJECTED_SHORTLISTING</button>
        <button class="btn btn-sm" data-st="REJECTED_CALL_SCREENING">REJECTED_CALL_SCREENING</button>
        <span class="right muted small">${requirementId ? `Req: ${esc(requirementId)}` : ""}</span>
      </div>

      <div class="hr"></div>
      <div id="list"></div>
    </div>
  `;

  right.querySelectorAll("[data-st]").forEach(b => {
    b.onclick = () => routeTo("candidates", { req: requirementId, st: b.getAttribute("data-st") });
  });

  const listEl = right.querySelector("#list");
  if (!candidates.length) {
    listEl.innerHTML = `<div class="muted">No candidates found.</div>`;
    return;
  }

  listEl.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Name</th><th>Mobile</th><th>Source</th><th>Status</th><th>CV</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${candidates.map(c => `
          <tr>
            <td><b>${esc(c.name)}</b><div class="muted small">${esc(c.id)}</div></td>
            <td>${esc(c.mobile || "")}</td>
            <td>${esc(c.source || "")}</td>
            <td>${pillStatus(c.status)}</td>
            <td>${c.cvUrl ? `<a href="${esc(c.cvUrl)}" target="_blank">Open</a>` : "-"}</td>
            <td>
              ${c.ui?.canShortlistDecision ? `
                <button class="btn btn-sm" data-yes="${esc(c.id)}">Shortlist</button>
                <button class="btn btn-sm" data-no="${esc(c.id)}">Reject</button>
              ` : ""}
              ${c.ui?.canMoveToCall ? `
                <button class="btn btn-sm" data-move="${esc(c.id)}">Send to On-Call</button>
                <button class="btn btn-sm" data-rejs="${esc(c.id)}">Reject (Shortlisting)</button>
              ` : ""}
              ${(!c.ui?.canShortlistDecision && !c.ui?.canMoveToCall) ? `<span class="muted small">-</span>` : ""}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  // bind actions
  listEl.querySelectorAll("[data-yes]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-yes");
      await apiCall("SHORTLIST_DECISION", { candidateId: id, decision: "YES" });
      routeTo("candidates", { req: requirementId, st: status || "" });
    };
  });

  listEl.querySelectorAll("[data-no]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-no");
      const reason = prompt("Reject reason (mandatory):");
      if (!reason) return;
      await apiCall("SHORTLIST_DECISION", { candidateId: id, decision: "NO", reason });
      routeTo("candidates", { req: requirementId, st: status || "" });
    };
  });

  listEl.querySelectorAll("[data-move]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-move");
      await apiCall("MOVE_TO_CALL_SCREENING", { candidateId: id });
      alert("Moved to On-Call ✅ (CALL_PENDING)");
      routeTo("calls", {}); // directly open calls
    };
  });

  listEl.querySelectorAll("[data-rejs]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-rejs");
      const reason = prompt("Reject at Shortlisting (mandatory):");
      if (!reason) return;
      await apiCall("REJECT_AT_SHORTLISTING", { candidateId: id, reason });
      routeTo("candidates", { req: requirementId, st: status || "" });
    };
  });
}

/** -------- Modal (same as Part-4) -------- */
function modalHtml() {
  return `
    <div class="modal-backdrop" id="modalBack" style="display:none">
      <div class="modal">
        <div class="row">
          <h3 style="margin:0" id="mTitle">Candidate</h3>
          <button class="btn btn-sm right" id="mClose">X</button>
        </div>
        <div class="muted" id="mSub" style="margin-top:6px"></div>
        <div class="hr"></div>

        <div class="row">
          <a id="mCv" target="_blank" class="pill ok" href="#">Open CV</a>
        </div>

        <div class="hr"></div>

        <div class="row">
          <button class="btn" id="mYes">✅ Relevant</button>
          <button class="btn" id="mNo">❌ Not Relevant</button>
        </div>

        <div id="mReasonBox" style="display:none; margin-top:12px">
          <div class="form-row">
            <div class="label">Reject Reason</div>
            <input class="input" id="mReason" placeholder="e.g. Not matching role, wrong location, etc." />
          </div>
          <div class="row" style="margin-top:10px">
            <button class="btn" id="mSubmitNo">Submit Reject</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function askRelevantModal({ title, sub, cvUrl }) {
  return new Promise((resolve) => {
    const back = document.getElementById("modalBack");
    const mTitle = document.getElementById("mTitle");
    const mSub = document.getElementById("mSub");
    const mCv = document.getElementById("mCv");
    const mClose = document.getElementById("mClose");
    const mYes = document.getElementById("mYes");
    const mNo = document.getElementById("mNo");
    const mReasonBox = document.getElementById("mReasonBox");
    const mReason = document.getElementById("mReason");
    const mSubmitNo = document.getElementById("mSubmitNo");

    mTitle.textContent = title;
    mSub.textContent = sub;
    mCv.href = cvUrl || "#";
    mReason.value = "";
    mReasonBox.style.display = "none";

    function close(val) {
      back.style.display = "none";
      cleanup();
      resolve(val);
    }
    function cleanup() {
      mClose.onclick = null;
      mYes.onclick = null;
      mNo.onclick = null;
      mSubmitNo.onclick = null;
    }

    back.style.display = "flex";
    mClose.onclick = () => close({ ok: true });
    mYes.onclick = () => close({ ok: true });
    mNo.onclick = () => { mReasonBox.style.display = "block"; mReason.focus(); };
    mSubmitNo.onclick = () => {
      const reason = (mReason.value || "").trim();
      if (!reason) return alert("Reason required");
      close({ ok: false, reason });
    };
  });
}

/** -------- helpers -------- */
function parseName(fileName) {
  const base = fileName.replace(/\.[^/.]+$/, "");
  const parts = base.split("_").map(s => s.trim()).filter(Boolean);
  if (parts.length >= 3) return { name: parts[0], mobile: parts[1], source: parts.slice(2).join("_") };
  if (parts.length === 2) return { name: parts[0], mobile: parts[1], source: "Unknown" };
  return { name: base, mobile: "", source: "Unknown" };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || "");
      resolve(res-hook(res));
      function res-hook(s){ return s.split(",")[1] || ""; }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function pillStatus(st) {
  const cls = st === "SHORTLISTED" || st === "OWNER_REVIEW" ? "ok" : (String(st).includes("REJECT") ? "bad" : "warn");
  return `<span class="pill ${cls}">${esc(st)}</span>`;
}

function formatBytes(bytes) {
  const u = ["B","KB","MB","GB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < u.length-1) { n /= 1024; i++; }
  return `${n.toFixed(i?1:0)} ${u[i]}`;
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
