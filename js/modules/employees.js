import { apiCall } from "../api.js";

export async function renderEmployeesPage({ headerEl, rootEl }) {
  headerEl.textContent = "EMPLOYEES";
  rootEl.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">Employee Directory</h3>
        <button class="btn btn-sm right" id="refBtn">Refresh</button>
      </div>

      <div class="row" style="margin-top:10px; gap:10px; flex-wrap:wrap">
        <input class="input" id="q" placeholder="Search: name, empId, role..." style="min-width:260px" />
        <select class="input" id="st">
          <option value="">All Status</option>
          <option value="PENDING_JOIN">PENDING_JOIN</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>
        <button class="btn btn-sm" id="go">Search</button>
      </div>

      <div class="hr"></div>
      <div id="list" class="muted">Loading...</div>
    </div>
  `;

  const list = rootEl.querySelector("#list");
  const qEl = rootEl.querySelector("#q");
  const stEl = rootEl.querySelector("#st");

  rootEl.querySelector("#refBtn").onclick = () => load();
  rootEl.querySelector("#go").onclick = () => load();

  await load();

  async function load() {
    list.innerHTML = `<div class="muted">Loading...</div>`;
    try {
      const res = await apiCall("LIST_EMPLOYEES", { q: qEl.value || "", status: stEl.value || "" });
      const employees = res.employees || [];

      if (!employees.length) {
        list.innerHTML = `<div class="muted">No employees found.</div>`;
        return;
      }

      list.innerHTML = employees.map(e => {
        const offer = e.letters?.OFFER?.url || "";
        const join = e.letters?.JOINING?.url || "";
        const prob = e.probation;

        return `
          <div class="card card-wide" style="margin-bottom:12px">
            <div class="row">
              <span class="pill"><b>${esc(e.id)}</b></span>
              <span class="pill warn">${esc(e.status)}</span>
              <span class="right muted small">Join: ${esc(e.joiningDate || "-")}</span>
            </div>

            <div style="margin-top:10px; font-weight:900">${esc(e.name)}</div>
            <div class="muted small" style="margin-top:4px">${esc(e.role || "-")} • Cand: ${esc(e.candidateId || "-")}</div>

            ${prob ? `
              <div class="row" style="margin-top:10px">
                <span class="pill">Probation: ${esc(prob.status)}</span>
                <span class="pill">End: ${esc(prob.endDate)}</span>
                <span class="pill warn">Days Left: ${esc(daysLeft(prob.endDate))}</span>
              </div>
            ` : `<div class="muted small" style="margin-top:10px">Probation: -</div>`}

            <div class="hr"></div>

            <div class="row" style="gap:8px; flex-wrap:wrap">
              ${offer ? `<a class="pill ok" target="_blank" href="${esc(offer)}">Offer Letter</a>` : `<span class="pill danger">Offer: Missing</span>`}
              ${join ? `<a class="pill ok" target="_blank" href="${esc(join)}">Joining Letter</a>` : `<span class="pill danger">Joining: Missing</span>`}
            </div>

            <div class="row" style="margin-top:10px; gap:10px; flex-wrap:wrap">
              <div class="pill">
                Upload Offer:
                <input type="file" class="input" data-up="${esc(e.id)}|OFFER" />
              </div>
              <div class="pill">
                Upload Joining:
                <input type="file" class="input" data-up="${esc(e.id)}|JOINING" />
              </div>
              <button class="btn btn-sm right" data-seturl="${esc(e.id)}">Set Link Manually</button>
            </div>
          </div>
        `;
      }).join("");

      // Upload handlers
      list.querySelectorAll("input[type=file][data-up]").forEach(inp => {
        inp.addEventListener("change", async () => {
          const meta = inp.getAttribute("data-up");
          const [employeeId, letterType] = meta.split("|");
          const f = inp.files && inp.files[0];
          if (!f) return;

          const base64 = await fileToBase64(f);
          await apiCall("UPLOAD_LETTER", {
            employeeId,
            letterType,
            fileName: f.name,
            fileMime: f.type || "application/pdf",
            fileBase64: base64
          });

          alert("Uploaded ✅");
          location.hash = "#/employees";
        });
      });

      // Set URL handlers
      list.querySelectorAll("[data-seturl]").forEach(b => b.onclick = async () => {
        const employeeId = b.getAttribute("data-seturl");
        const type = prompt("Letter Type? OFFER or JOINING", "OFFER");
        if (!type) return;
        const url = prompt("Paste Drive/Doc URL:", "");
        if (!url) return;

        await apiCall("SET_LETTER_URL", { employeeId, letterType: type.toUpperCase(), url });
        alert("Saved ✅");
        location.hash = "#/employees";
      });

    } catch (e) {
      list.innerHTML = `<div class="toast">${esc(e.message || String(e))}</div>`;
    }
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      resolve(s.includes(",") ? s.split(",")[1] : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function daysLeft(endDate) {
  try {
    const end = new Date(endDate + "T00:00:00");
    const now = new Date();
    const diff = Math.ceil((end - now) / (24 * 3600 * 1000));
    return isFinite(diff) ? diff : "-";
  } catch { return "-"; }
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
