import { apiCall } from "../api.js";

export async function renderSettingsPage({ headerEl, rootEl }) {
  headerEl.textContent = "SYSTEM SETTINGS (ADMIN)";

  rootEl.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">System Settings</h3>
        <button class="btn btn-sm right" id="ref">Refresh</button>
      </div>
      <p class="muted">Yahan se hardcoded rules future me bina coding change ke control honge.</p>
      <div class="hr"></div>

      <div id="form"></div>
      <div class="hr"></div>

      <div class="row">
        <button class="btn btn-sm" id="save">Save</button>
        <span class="muted small right" id="msg"></span>
      </div>
    </div>
  `;

  const form = rootEl.querySelector("#form");
  const msg = rootEl.querySelector("#msg");

  rootEl.querySelector("#ref").onclick = () => load();
  rootEl.querySelector("#save").onclick = () => save();

  let settings = {};
  await load();

  async function load() {
    msg.textContent = "";
    form.innerHTML = `<div class="muted">Loading...</div>`;
    const res = await apiCall("GET_SETTINGS", {});
    settings = res.settings || {};

    form.innerHTML = `
      <div class="row" style="gap:12px; flex-wrap:wrap">
        <div style="min-width:260px">
          <div class="muted small">Probation Days</div>
          <input class="input" id="probationDays" type="number" min="1" max="365" value="${esc(settings.probationDays ?? 90)}" />
        </div>

        <div style="min-width:260px">
          <div class="muted small">Pre-Interview Pass Overall</div>
          <input class="input" id="preInterviewPassOverall" type="number" min="0" max="10" step="0.1" value="${esc(settings.preInterviewPassOverall ?? 6)}" />
        </div>

        <div style="min-width:260px">
          <div class="muted small">Test Pass Score</div>
          <input class="input" id="testPassScore" type="number" min="0" max="100" value="${esc(settings.testPassScore ?? 60)}" />
        </div>
      </div>

      <div class="hr"></div>

      <div>
        <div class="muted small">Required Docs (one per line)</div>
        <textarea class="input" id="requiredDocs" rows="6" style="width:100%">${esc((settings.requiredDocs || ["Aadhaar","PAN","Photo","Bank"]).join("\n"))}</textarea>
      </div>
    `;
  }

  async function save() {
    msg.textContent = "Saving...";
    const probationDays = Number(rootEl.querySelector("#probationDays").value);
    const preInterviewPassOverall = Number(rootEl.querySelector("#preInterviewPassOverall").value);
    const testPassScore = Number(rootEl.querySelector("#testPassScore").value);

    const docsLines = String(rootEl.querySelector("#requiredDocs").value || "")
      .split("\n").map(x => x.trim()).filter(Boolean);

    const updates = [
      { key: "probationDays", value: probationDays },
      { key: "preInterviewPassOverall", value: preInterviewPassOverall },
      { key: "testPassScore", value: testPassScore },
      { key: "requiredDocs", value: docsLines }
    ];

    await apiCall("UPDATE_SETTINGS", { updates });
    msg.textContent = "Saved ✅";
  }
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
