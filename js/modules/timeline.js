// /js/modules/timeline.js
import { apiCall } from "../api.js";

export async function renderTimeline(root) {
  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <h2>Candidate Journey Timeline</h2>
        <div class="row">
          <input id="tlCandId" class="inp" placeholder="Enter Candidate ID (e.g. CXXXX)" />
          <button id="tlLoad" class="btn btn-primary">Load</button>
        </div>
      </div>

      <div id="tlOut"></div>
    </div>
  `;

  const $ = (id) => document.getElementById(id);

  $("tlLoad").addEventListener("click", async () => {
    const candidateId = $("tlCandId").value.trim();
    if (!candidateId) return alert("candidateId required");
    await load(candidateId);
  });

  async function load(candidateId) {
    $("tlOut").innerHTML = `<div class="card"><p>Loading...</p></div>`;

    const res = await apiCall("GET_CANDIDATE_TIMELINE", { candidateId });
    const t = res?.timeline;

    if (!t?.candidate) {
      $("tlOut").innerHTML = `<div class="card"><p>No data found.</p></div>`;
      return;
    }

    const cand = t.candidate;
    const req = t.requirement;
    const jp = t.jobPosting;
    const interview = t.interview;
    const docs = t.documents;
    const emp = t.employee;
    const prob = t.probation;

    $("tlOut").innerHTML = `
      ${card("Candidate", `
        <div><b>${cand.name || ""}</b> (${cand.id})</div>
        <div class="muted">Status: <span class="tag">${cand.status}</span> • Mobile: ${cand.mobile || "-"} • Source: ${cand.source || "-"}</div>
        <div class="muted">Requirement: ${cand.requirementId}</div>
        ${cand.cvUrl ? `<div class="muted">CV: <a href="${cand.cvUrl}" target="_blank">Open</a></div>` : ""}
      `)}

      ${card("Requirement", req ? `
        <div><b>${req.id}</b> • <span class="tag">${req.status}</span></div>
        <div class="muted">Template Role: ${req.templateRole || "-"}</div>
      ` : `<div class="muted">No requirement found.</div>`)}

      ${card("Job Posting", jp ? `
        <div><b>${jp.id}</b> • <span class="tag">${jp.status}</span></div>
        <div class="muted">Posted portals: ${(jp.payload?.portals || []).filter(p => p.posted).length}</div>
      ` : `<div class="muted">No job posting found.</div>`)}

      ${card("Interview", interview ? `
        <div><b>${interview.id}</b> • <span class="tag">${interview.status}</span></div>
        <pre class="pre">${escapeHtml(JSON.stringify(interview.payload || {}, null, 2))}</pre>
      ` : `<div class="muted">No interview record.</div>`)}

      ${card("Tests", (t.tests || []).length ? `
        ${(t.tests || []).map(x => `
          <div class="item">
            <div class="row space">
              <div>
                <div class="title">${x.token} <span class="tag">${x.status}</span></div>
                <div class="muted">RoleTag: ${x.roleTag || "-"} • Tests: ${(x.testsAssigned || []).join(", ")}</div>
                <div class="muted">Start: ${x.startedAt || "-"} • End: ${x.endsAt || "-"} • Exp: ${x.expiresAt || "-"}</div>
              </div>
              <div class="muted">Attempt: ${x.attempt}/${x.attemptLimit}</div>
            </div>
            ${x.result ? `<div class="muted">Score: <b>${x.result.finalScore}</b> • Marks: ${x.result.obtainedMarks}/${x.result.totalMarks}</div>` : `<div class="muted">No result yet.</div>`}
          </div>
        `).join("")}
      ` : `<div class="muted">No test sessions.</div>`)}

      ${card("Call Logs", (t.calls || []).length ? `
        ${(t.calls || []).map(x => `
          <div class="item">
            <div class="row space">
              <div class="title">${x.id} <span class="tag">${x.status}</span></div>
              <div class="muted">${x.createdAt || ""}</div>
            </div>
            <pre class="pre">${escapeHtml(JSON.stringify(x.payload || {}, null, 2))}</pre>
          </div>
        `).join("")}
      ` : `<div class="muted">No call logs.</div>`)}

      ${card("Documents", docs ? `
        <div><b>${docs.id}</b> • <span class="tag">${docs.status}</span></div>
        <pre class="pre">${escapeHtml(JSON.stringify(docs.payload || {}, null, 2))}</pre>
      ` : `<div class="muted">No documents row.</div>`)}

      ${card("Employee + Probation", emp ? `
        <div><b>${emp.id}</b> • <span class="tag">${emp.status}</span></div>
        <div class="muted">Joining: ${emp.joiningDate || "-"}</div>
        ${prob ? `<div class="muted">Probation: <b>${prob.status}</b> • ${prob.startDate} → ${prob.endDate}</div>` : `<div class="muted">No active probation.</div>`}
      ` : `<div class="muted">Not converted to employee yet.</div>`)}

      ${card("Rejections", (t.rejections || []).length ? `
        ${(t.rejections || []).map(r => `
          <div class="item">
            <div class="row space">
              <div class="title">${r.id} <span class="tag">${r.stage}</span></div>
              <div class="muted">${r.createdAt}</div>
            </div>
            <div class="muted">Reason: ${escapeHtml(r.reason || "")}</div>
            <div class="muted">Reverted: ${escapeHtml(r.reverted || "")}</div>
          </div>
        `).join("")}
      ` : `<div class="muted">No rejections.</div>`)}

      ${card("Audit Timeline", (t.audit || []).length ? `
        ${(t.audit || []).map(a => `
          <div class="item">
            <div class="row space">
              <div class="title">${a.action} <span class="tag">${a.from || ""} → ${a.to || ""}</span></div>
              <div class="muted">${a.time || ""}</div>
            </div>
            <div class="muted">${escapeHtml(a.remark || "")}</div>
          </div>
        `).join("")}
      ` : `<div class="muted">No audit entries found.</div>`)}
    `;
  }

  // Optional: auto-load from URL ?candidateId=
  const u = new URL(location.href);
  const cid = u.searchParams.get("candidateId");
  if (cid) {
    $("tlCandId").value = cid;
    await load(cid);
  }
}

function card(title, html) {
  return `
    <div class="card">
      <h3>${title}</h3>
      ${html}
    </div>
  `;
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
