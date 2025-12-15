import { apiCall } from "../api.js";

export async function renderCallsPage({ headerEl, rootEl, params }) {
  headerEl.textContent = "ON-CALL SCREENING";
  rootEl.innerHTML = `<div class="card card-wide">Loading...</div>${callModalHtml()}`;

  try {
    const requirementId = params?.req || "";
    const res = await apiCall("LIST_CALL_QUEUE", { requirementId });
    const queue = res.queue || [];

    rootEl.innerHTML = `
      <div class="card card-wide">
        <div class="row">
          <h3 style="margin:0">Call Queue</h3>
          <span class="pill">${queue.length} pending</span>
        </div>
        <p class="muted">Actions: No Answer / Not Reachable / Reject / Call Done → (Recommend YES ⇒ OWNER_REVIEW)</p>
        <div class="hr"></div>
        <div id="list"></div>
      </div>
      ${callModalHtml()}
    `;

    const list = rootEl.querySelector("#list");
    if (!queue.length) {
      list.innerHTML = `<div class="muted">No call pending candidates 🎉</div>`;
      return;
    }

    list.innerHTML = queue.map(c => `
      <div class="card card-wide" style="margin-bottom:12px">
        <div class="row">
          <div class="pill warn"><b>${esc(c.status)}</b></div>
          <div class="pill">#${esc(c.id)}</div>
          <div class="right muted small">${esc(c.requirementId || "")}</div>
        </div>

        <div style="margin-top:10px; font-weight:800">${esc(c.name)}</div>
        <div class="muted small" style="margin-top:4px">${esc(c.mobile || "")} • ${esc(c.source || "")}</div>

        <div class="row" style="margin-top:10px">
          ${c.cvUrl ? `<a class="pill ok" href="${esc(c.cvUrl)}" target="_blank">Open CV</a>` : `<span class="pill">No CV</span>`}
          ${c.lastCall?.at ? `<span class="pill">Last: ${esc(c.lastCall.outcome)} @ ${esc(c.lastCall.at)}</span>` : `<span class="pill">No attempts</span>`}
        </div>

        <div class="hr"></div>

        <div class="row">
          <button class="btn btn-sm" data-na="${esc(c.id)}">No Answer</button>
          <button class="btn btn-sm" data-nr="${esc(c.id)}">Not Reachable</button>
          <button class="btn btn-sm" data-rej="${esc(c.id)}">Reject</button>
          <button class="btn btn-sm right" data-done="${esc(c.id)}">Call Done</button>
        </div>
      </div>
    `).join("");

    // bind
    list.querySelectorAll("[data-na]").forEach(b => b.onclick = () => quickUpdate(b.getAttribute("data-na"), "NO_ANSWER"));
    list.querySelectorAll("[data-nr]").forEach(b => b.onclick = () => quickUpdate(b.getAttribute("data-nr"), "NOT_REACHABLE"));

    list.querySelectorAll("[data-rej]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-rej");
      const remark = prompt("Reject remark (mandatory):");
      if (!remark) return;
      await apiCall("CALL_SCREENING_UPDATE", { candidateId: id, outcome: "REJECT", remark });
      location.hash = "#/calls";
    });

    list.querySelectorAll("[data-done]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-done");
      const result = await openCallDoneModal();
      if (!result) return;

      await apiCall("CALL_SCREENING_UPDATE", {
        candidateId: id,
        outcome: "CALL_DONE",
        communication: result.communication,
        experience: result.experience,
        recommend: result.recommend,
        remark: result.remark || ""
      });
      location.hash = "#/calls";
    });

    async function quickUpdate(candidateId, outcome) {
      await apiCall("CALL_SCREENING_UPDATE", { candidateId, outcome, remark: "" });
      location.hash = "#/calls";
    }

  } catch (e) {
    rootEl.innerHTML = `
      <div class="card card-wide">
        <h3>Error</h3>
        <div class="toast">${esc(e.message || String(e))}</div>
      </div>
      ${callModalHtml()}
    `;
  }
}

/** -------- Call Done Modal -------- */
function callModalHtml() {
  return `
    <div class="modal-backdrop" id="callBack" style="display:none">
      <div class="modal">
        <div class="row">
          <h3 style="margin:0">Call Done</h3>
          <button class="btn btn-sm right" id="callClose">X</button>
        </div>

        <div class="hr"></div>

        <div class="grid grid-2">
          <div class="form-row">
            <div class="label">Communication (0-10)</div>
            <input class="input" id="cmComm" type="number" min="0" max="10" value="7" />
          </div>
          <div class="form-row">
            <div class="label">Experience (0-10)</div>
            <input class="input" id="cmExp" type="number" min="0" max="10" value="7" />
          </div>
        </div>

        <div class="form-row">
          <div class="label">Recommend?</div>
          <select class="select" id="cmRec">
            <option value="YES">YES (Send to OWNER_REVIEW)</option>
            <option value="NO">NO (Reject)</option>
          </select>
        </div>

        <div class="form-row">
          <div class="label">Remark (mandatory if Recommend=NO)</div>
          <input class="input" id="cmRemark" placeholder="e.g. weak communication, mismatch role, etc." />
        </div>

        <div class="row">
          <button class="btn" id="callSubmit">Submit</button>
        </div>
      </div>
    </div>
  `;
}

function openCallDoneModal() {
  return new Promise((resolve) => {
    const back = document.getElementById("callBack");
    const close = document.getElementById("callClose");
    const submit = document.getElementById("callSubmit");

    const comm = document.getElementById("cmComm");
    const exp = document.getElementById("cmExp");
    const rec = document.getElementById("cmRec");
    const remark = document.getElementById("cmRemark");

    comm.value = "7";
    exp.value = "7";
    rec.value = "YES";
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
      const e = Number(exp.value);
      const r = rec.value;
      const rm = (remark.value || "").trim();

      if (!(c >= 0 && c <= 10)) return alert("Communication 0-10");
      if (!(e >= 0 && e <= 10)) return alert("Experience 0-10");
      if (r === "NO" && !rm) return alert("Remark mandatory when Recommend=NO");

      hide({ communication: c, experience: e, recommend: r, remark: rm });
    };
  });
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
