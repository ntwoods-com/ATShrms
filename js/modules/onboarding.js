import { apiCall } from "../api.js";

export async function renderOnboardingPage({ headerEl, rootEl }) {
  headerEl.textContent = "ONBOARDING (HR)";
  rootEl.innerHTML = `<div class="card card-wide">Loading...</div>`;

  try {
    const res = await apiCall("LIST_ONBOARDING_QUEUE", {});
    const queue = res.queue || [];

    if (!queue.length) {
      rootEl.innerHTML = `<div class="card card-wide"><div class="muted">No onboarding cases.</div></div>`;
      return;
    }

    rootEl.innerHTML = `
      <div class="card card-wide">
        <div class="row">
          <h3 style="margin:0">Onboarding Queue</h3>
          <span class="pill">${queue.length} items</span>
        </div>
        <div class="hr"></div>
        <div id="list"></div>
      </div>
    `;

    const list = rootEl.querySelector("#list");

    list.innerHTML = queue.map(c => {
      const docs = c.documents?.payload?.docs || [];
      const reqDocs = c.documents?.payload?.requiredDocs || ["Aadhaar","PAN","Photo","Bank"];
      const join = c.onboarding?.joiningDate || "-";

      const docRows = reqDocs.map(dt => {
        const item = docs.find(d => d.type === dt);
        const tag = item ? (item.verified ? `<span class="pill ok">Verified</span>` : `<span class="pill warn">Pending</span>`) : `<span class="pill danger">Missing</span>`;
        const open = item?.url ? `<a class="pill" target="_blank" href="${esc(item.url)}">Open</a>` : ``;
        const verifyBtns = item ? `
          <button class="btn btn-sm" data-ver="${esc(c.id)}|${esc(dt)}|YES">Verify</button>
          <button class="btn btn-sm" data-ver="${esc(c.id)}|${esc(dt)}|NO">Unverify</button>
        ` : ``;

        return `
          <div class="card card-wide" style="margin-top:10px">
            <div class="row">
              <b>${esc(dt)}</b>
              ${tag}
              ${open}
              <span class="right">
                <input type="file" class="input" data-up="${esc(c.id)}|${esc(dt)}" />
              </span>
            </div>
            ${c.ui?.canVerifyDocs ? `<div class="row" style="margin-top:8px; gap:8px; flex-wrap:wrap">${verifyBtns}</div>` : ``}
          </div>
        `;
      }).join("");

      return `
        <div class="card card-wide" style="margin-bottom:12px">
          <div class="row">
            <span class="pill warn"><b>${esc(c.status)}</b></span>
            <span class="pill">#${esc(c.id)}</span>
            <span class="right muted small">Join: ${esc(join)}</span>
          </div>

          <div style="margin-top:10px; font-weight:900">${esc(c.name)}</div>
          <div class="muted small" style="margin-top:4px">${esc(c.mobile || "")} • ${esc(c.source || "")}</div>

          <div class="row" style="margin-top:10px">
            ${c.cvUrl ? `<a class="pill ok" target="_blank" href="${esc(c.cvUrl)}">Open CV</a>` : ``}
            ${c.onboarding?.employeeId ? `<span class="pill">Emp: ${esc(c.onboarding.employeeId)}</span>` : ``}
            ${c.documents?.id ? `<span class="pill">DocsId: ${esc(c.documents.id)}</span>` : ``}
          </div>

          <div class="hr"></div>
          <div class="muted small">Required Docs</div>
          ${docRows}

          <div class="hr"></div>
          <div class="row" style="gap:8px; flex-wrap:wrap">
            ${c.ui?.canSetJoining ? `<button class="btn btn-sm" data-join="${esc(c.id)}">Set Joining Date</button>` : ``}
            ${c.ui?.canMarkJoined ? `<button class="btn btn-sm" data-joined="${esc(c.id)}">Mark Joined</button>` : ``}
          </div>
        </div>
      `;
    }).join("");

    // Upload handlers
    list.querySelectorAll("input[type=file][data-up]").forEach(inp => {
      inp.addEventListener("change", async () => {
        const meta = inp.getAttribute("data-up");
        const [candidateId, docType] = meta.split("|");
        const f = inp.files && inp.files[0];
        if (!f) return;

        const base64 = await fileToBase64(f);
        await apiCall("UPLOAD_DOCUMENT", {
          candidateId,
          docType,
          fileName: f.name,
          fileMime: f.type || "application/pdf",
          fileBase64: base64
        });

        alert("Uploaded ✅");
        location.hash = "#/onboarding";
      });
    });

    // Verify handlers
    list.querySelectorAll("[data-ver]").forEach(b => b.onclick = async () => {
      const [candidateId, docType, yesno] = b.getAttribute("data-ver").split("|");
      const remark = prompt("Remark (optional):", "") || "";
      await apiCall("VERIFY_DOCUMENT", { candidateId, docType, verified: yesno, remark });
      alert("Updated ✅");
      location.hash = "#/onboarding";
    });

    // Set joining
    list.querySelectorAll("[data-join]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-join");
      const jd = prompt("Joining Date (yyyy-mm-dd)?", "");
      if (!jd) return alert("Joining date required");
      const remark = prompt("Remark (optional):", "") || "";
      await apiCall("SET_JOINING_DATE", { candidateId: id, joiningDate: jd, remark });
      alert("Joining scheduled ✅");
      location.hash = "#/onboarding";
    });

    // Mark joined
    list.querySelectorAll("[data-joined]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-joined");
      if (!confirm("Mark joined? This will start probation automatically.")) return;
      await apiCall("MARK_JOINED", { candidateId: id });
      alert("Joined ✅ Probation started");
      location.hash = "#/onboarding";
    });

  } catch (e) {
    rootEl.innerHTML = `<div class="card card-wide"><div class="toast">${esc(e.message || String(e))}</div></div>`;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const base64 = s.includes(",") ? s.split(",")[1] : s;
      resolve(base64);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
