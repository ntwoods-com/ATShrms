import { apiCall } from "../api.js";

export async function renderInterviewsPage({ headerEl, rootEl, params }) {
  headerEl.textContent = "INTERVIEWS";
  rootEl.innerHTML = `<div class="card card-wide">Loading...</div>${modalHtml()}`;

  try {
    const mode = params?.mode || ""; // SCHEDULE | TODAY | ""
    const res = await apiCall("LIST_INTERVIEW_QUEUE", { mode });
    const queue = res.queue || [];

    rootEl.innerHTML = `
      <div class="card card-wide">
        <div class="row">
          <h3 style="margin:0">Interview Panel</h3>
          <span class="pill">${queue.length} items</span>
        </div>

        <div class="row" style="margin-top:10px">
          <button class="btn btn-sm" data-m="">All</button>
          <button class="btn btn-sm" data-m="SCHEDULE">Need Schedule</button>
          <button class="btn btn-sm" data-m="TODAY">Today</button>
        </div>

        <div class="hr"></div>
        <div id="list"></div>
      </div>

      ${modalHtml()}
    `;

    rootEl.querySelectorAll("[data-m]").forEach(b => {
      b.onclick = () => {
        const m = b.getAttribute("data-m");
        location.hash = "#/interviews" + (m ? `?mode=${encodeURIComponent(m)}` : "");
      };
    });

    const list = rootEl.querySelector("#list");
    if (!queue.length) {
      list.innerHTML = `<div class="muted">No interview items.</div>`;
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
          ${c.interview?.date ? `<span class="pill">Schedule: ${esc(c.interview.date)} ${esc(c.interview.time || "")}</span>` : `<span class="pill">Not Scheduled</span>`}
          ${c.interview?.location ? `<span class="pill">Loc: ${esc(c.interview.location)}</span>` : ``}
        </div>

        <div class="hr"></div>

        <div class="row">
          ${c.ui?.canSetSchedule ? `<button class="btn btn-sm" data-sch="${esc(c.id)}">Set Schedule</button>` : ``}
          ${c.ui?.canMarkAttendance ? `<button class="btn btn-sm" data-app="${esc(c.id)}">Mark Appeared</button>
            <button class="btn btn-sm right" data-no="${esc(c.id)}">Not Appeared</button>` : ``}
          ${(!c.ui?.canSetSchedule && !c.ui?.canMarkAttendance) ? `<span class="muted small">-</span>` : ``}
        </div>
      </div>
    `).join("");

    // bind schedule
    list.querySelectorAll("[data-sch]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-sch");
      const form = await openScheduleModal();
      if (!form) return;

      await apiCall("SET_INTERVIEW_SCHEDULE", {
        candidateId: id,
        date: form.date,
        time: form.time,
        location: form.location,
        note: form.note
      });
      location.hash = "#/interviews?mode=SCHEDULE";
    });

    // bind attendance
    list.querySelectorAll("[data-app]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-app");
      await apiCall("INTERVIEW_ATTENDANCE", { candidateId: id, appeared: "YES", remark: "" });
      alert("Marked Appeared ✅ (INTERVIEW_APPEARED)");
      location.hash = "#/interviews";
    });

    list.querySelectorAll("[data-no]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-no");
      const remark = prompt("No-show reason (mandatory):");
      if (!remark) return;
      await apiCall("INTERVIEW_ATTENDANCE", { candidateId: id, appeared: "NO", remark });
      location.hash = "#/interviews";
    });

  } catch (e) {
    rootEl.innerHTML = `<div class="card card-wide"><h3>Error</h3><div class="toast">${esc(e.message || String(e))}</div></div>${modalHtml()}`;
  }
}

/** ---------- Schedule Modal ---------- */
function modalHtml() {
  return `
    <div class="modal-backdrop" id="ivBack" style="display:none">
      <div class="modal">
        <div class="row">
          <h3 style="margin:0">Set Interview Schedule</h3>
          <button class="btn btn-sm right" id="ivClose">X</button>
        </div>

        <div class="hr"></div>

        <div class="grid grid-2">
          <div class="form-row">
            <div class="label">Date (yyyy-mm-dd)</div>
            <input class="input" id="ivDate" type="date" />
          </div>
          <div class="form-row">
            <div class="label">Time</div>
            <input class="input" id="ivTime" type="time" />
          </div>
        </div>

        <div class="form-row">
          <div class="label">Location</div>
          <input class="input" id="ivLoc" placeholder="e.g. NTW Office, Aligarh" />
        </div>

        <div class="form-row">
          <div class="label">Note (optional)</div>
          <input class="input" id="ivNote" placeholder="e.g. bring documents, meet HR" />
        </div>

        <div class="row">
          <button class="btn" id="ivSubmit">Save</button>
        </div>
      </div>
    </div>
  `;
}

function openScheduleModal() {
  return new Promise((resolve) => {
    const back = document.getElementById("ivBack");
    const close = document.getElementById("ivClose");
    const submit = document.getElementById("ivSubmit");

    const date = document.getElementById("ivDate");
    const time = document.getElementById("ivTime");
    const loc = document.getElementById("ivLoc");
    const note = document.getElementById("ivNote");

    // defaults
    date.value = "";
    time.value = "";
    loc.value = "NTW Office, Aligarh";
    note.value = "";

    function hide(val) {
      back.style.display = "none";
      close.onclick = null;
      submit.onclick = null;
      resolve(val);
    }

    back.style.display = "flex";

    close.onclick = () => hide(null);
    submit.onclick = () => {
      const d = (date.value || "").trim();
      const t = (time.value || "").trim();
      const l = (loc.value || "").trim();
      const n = (note.value || "").trim();

      if (!d) return alert("Date required");
      if (!t) return alert("Time required");
      if (!l) return alert("Location required");

      hide({ date: d, time: t, location: l, note: n });
    };
  });
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
