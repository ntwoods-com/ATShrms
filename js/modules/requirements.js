import { apiCall } from "../api.js";
import { state } from "../state.js";
import { routeTo } from "../ui-router.js";

export async function renderRequirementsPage({ headerEl, rootEl }) {
  headerEl.textContent = "REQUIREMENTS";
  rootEl.innerHTML = `<div class="card card-wide">Loading...</div>`;

  try {
    const [tplRes, listRes] = await Promise.all([
      apiCall("GET_JOB_TEMPLATES"),
      apiCall("LIST_REQUIREMENTS")
    ]);

    const templates = tplRes.templates || [];
    const requirements = listRes.requirements || [];

    rootEl.innerHTML = `
      <div class="grid grid-2">
        <div id="leftPane"></div>
        <div id="rightPane"></div>
      </div>
    `;

    const leftPane = rootEl.querySelector("#leftPane");
    const rightPane = rootEl.querySelector("#rightPane");

    if (state.user.role === "EA" || state.user.role === "ADMIN") {
      renderRaiseForm(leftPane, templates, async (payload) => {
        await apiCall("RAISE_REQUIREMENT", payload);
        await rerender();
      });
    } else {
      leftPane.innerHTML = `
        <div class="card card-wide">
          <h3>HR Queue</h3>
          <p class="muted">Approve / Send Back requirements.</p>
        </div>
      `;
    }

    renderList(rightPane, requirements, templates, async (action, reqId, data) => {
      if (action === "APPROVE") {
        await apiCall("APPROVE_REQUIREMENT", { requirementId: reqId, remark: data.remark || "" });
      } else if (action === "SEND_BACK") {
        await apiCall("SEND_BACK_REQUIREMENT", { requirementId: reqId, remark: data.remark || "" });
      } else if (action === "RESUBMIT") {
        await apiCall("RESUBMIT_REQUIREMENT", { requirementId: reqId, payload: data.payload });
      } else if (action === "OPEN_JOB_POSTING") {
        routeTo("job-postings", { req: reqId });
        return;
      }
      await rerender();
    });

    async function rerender() {
      await renderRequirementsPage({ headerEl, rootEl });
    }

  } catch (e) {
    rootEl.innerHTML = `
      <div class="card card-wide">
        <h3>Error</h3>
        <div class="toast">${escapeHtml(e.message || String(e))}</div>
      </div>
    `;
  }
}

function renderRaiseForm(container, templates, onSubmit) {
  const roleOptions = templates.map(t => `<option value="${escapeAttr(t.role)}">${escapeHtml(t.role)}</option>`).join("");

  container.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">Raise Requirement</h3>
        <span class="pill ok">EA → HR</span>
      </div>
      <p class="muted">Template select karo → fields auto fill → submit.</p>

      <div class="form-row">
        <div class="label">Job Role (Template)</div>
        <select id="tplRole" class="select">
          <option value="">Select...</option>
          ${roleOptions}
        </select>
      </div>

      <div class="hr"></div>

      <div id="dynForm" class="grid"></div>

      <div class="hr"></div>

      <div class="row">
        <button id="btnSubmit" class="btn">Submit to HR</button>
        <span id="msg" class="muted small"></span>
      </div>
    </div>
  `;

  const tplRoleEl = container.querySelector("#tplRole");
  const dynForm = container.querySelector("#dynForm");
  const msg = container.querySelector("#msg");
  const btnSubmit = container.querySelector("#btnSubmit");

  let currentTemplate = null;
  let model = {};

  tplRoleEl.onchange = () => {
    const role = tplRoleEl.value;
    currentTemplate = templates.find(t => t.role === role) || null;
    model = buildDefaults(currentTemplate);
    renderDynamicFields(dynForm, currentTemplate, model);
  };

  btnSubmit.onclick = async () => {
    try {
      msg.textContent = "Submitting...";
      if (!currentTemplate) throw new Error("Please select template role");

      const missing = validateTemplate(currentTemplate, model);
      if (missing.length) throw new Error("Missing required: " + missing.join(", "));

      await onSubmit({
        templateRole: tplRoleEl.value,
        payload: {
          ...model,
          templateTitle: currentTemplate.template?.title || tplRoleEl.value,
          raisedByName: state.user.name,
          raisedByEmail: state.user.email
        }
      });

      msg.textContent = "Submitted ✅";
      tplRoleEl.value = "";
      dynForm.innerHTML = "";
    } catch (e) {
      msg.textContent = e.message || String(e);
    }
  };
}

function renderList(container, requirements, templates, onAction) {
  container.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">Requirements</h3>
        <span class="pill">${requirements.length} items</span>
      </div>
      <div class="hr"></div>
      <div id="list"></div>
    </div>
  `;

  const listEl = container.querySelector("#list");
  if (!requirements.length) {
    listEl.innerHTML = `<div class="muted">No requirements found.</div>`;
    return;
  }

  listEl.innerHTML = requirements.map(req => {
    const pillClass =
      req.status === "PENDING_HR_REVIEW" ? "warn" :
      req.status === "NEED_CLARIFICATION" ? "bad" : "ok";

    const tpl = templates.find(t => t.role === req.templateRole);
    const title = (req.payload?.templateTitle || tpl?.template?.title || req.templateRole || "Requirement");

    const jpInfo = req.jobPosting ? `JP: ${req.jobPosting.status} | Posted: ${req.jobPosting.postedCount}` : `JP: Not created`;
    const unlock = req.addCandidateUnlocked ? `Add Candidate: UNLOCKED` : `Add Candidate: LOCKED`;

    return `
      <div class="card card-wide" style="margin-bottom:12px">
        <div class="row">
          <div class="pill ${pillClass}"><b>${escapeHtml(req.status)}</b></div>
          <div class="pill">#${escapeHtml(req.id)}</div>
          <div class="right muted small">${escapeHtml(req.createdAt || "")}</div>
        </div>

        <div style="margin-top:10px; font-weight:800">${escapeHtml(title)}</div>

        <div style="margin-top:10px" class="kv">
          <b>Role</b><div>${escapeHtml(req.templateRole || "")}</div>
          <b>Positions</b><div>${escapeHtml(String(req.payload?.positions ?? ""))}</div>
          <b>Location</b><div>${escapeHtml(req.payload?.location ?? "")}</div>
          <b>Experience</b><div>${escapeHtml(req.payload?.experience ?? "")}</div>
          <b>Urgency</b><div>${escapeHtml(req.payload?.urgency ?? "")}</div>
        </div>

        <div class="hr"></div>
        <div class="row">
          <span class="pill">${escapeHtml(jpInfo)}</span>
          <span class="pill ${req.addCandidateUnlocked ? "ok" : "bad"}">${escapeHtml(unlock)}</span>

          ${(req.ui?.canOpenJobPosting) ? `<button class="btn right" data-act="openjp" data-id="${escapeAttr(req.id)}">Open Job Posting</button>` : ""}
        </div>

        ${req.payload?.hrRemark ? `
          <div class="hr"></div>
          <div class="pill bad">HR Remark: ${escapeHtml(req.payload.hrRemark)}</div>
        ` : ""}

        <div class="hr"></div>
        <div id="actions_${escapeAttr(req.id)}"></div>
      </div>
    `;
  }).join("");

  // bind actions
  requirements.forEach(req => {
    const slot = container.querySelector(`#actions_${cssId(req.id)}`);
    slot.innerHTML = buildActionBlock(req);

    const btnOpen = container.querySelector(`[data-act="openjp"][data-id="${cssId(req.id)}"]`);
    if (btnOpen) btnOpen.onclick = async () => onAction("OPEN_JOB_POSTING", req.id, {});

    const btnAppr = slot.querySelector(`[data-act="approve"]`);
    if (btnAppr) btnAppr.onclick = async () => {
      const remark = slot.querySelector(`[data-in="remark"]`)?.value || "";
      await onAction("APPROVE", req.id, { remark });
    };

    const btnBack = slot.querySelector(`[data-act="sendback"]`);
    if (btnBack) btnBack.onclick = async () => {
      const remark = (slot.querySelector(`[data-in="remark"]`)?.value || "").trim();
      if (!remark) { alert("Remark mandatory for Send Back"); return; }
      await onAction("SEND_BACK", req.id, { remark });
    };

    const btnRes = slot.querySelector(`[data-act="resubmit"]`);
    if (btnRes) btnRes.onclick = async () => {
      const edited = collectInlineEdit(slot, req);
      await onAction("RESUBMIT", req.id, { payload: edited });
    };
  });
}

function buildActionBlock(req) {
  const ui = req.ui || {};

  if (ui.canApprove || ui.canSendBack) {
    return `
      <div class="row">
        <input class="input" data-in="remark" placeholder="Remark (optional for approve, mandatory for send back)" />
        ${ui.canApprove ? `<button class="btn" data-act="approve">Approve</button>` : ""}
        ${ui.canSendBack ? `<button class="btn" data-act="sendback">Send Back</button>` : ""}
      </div>
    `;
  }

  if (ui.canResubmit) {
    return `
      <div class="grid">
        <div class="pill bad">Need Clarification → Edit & Resubmit</div>
        <div class="grid grid-2">
          <div class="form-row">
            <div class="label">Positions</div>
            <input class="input" data-edit="positions" value="${escapeAttr(String(req.payload?.positions ?? ""))}" />
          </div>
          <div class="form-row">
            <div class="label">Location</div>
            <input class="input" data-edit="location" value="${escapeAttr(req.payload?.location ?? "")}" />
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-row">
            <div class="label">Experience</div>
            <input class="input" data-edit="experience" value="${escapeAttr(req.payload?.experience ?? "")}" />
          </div>
          <div class="form-row">
            <div class="label">Urgency</div>
            <input class="input" data-edit="urgency" value="${escapeAttr(req.payload?.urgency ?? "")}" />
          </div>
        </div>
        <div class="form-row">
          <div class="label">Notes</div>
          <textarea class="textarea" data-edit="notes">${escapeHtml(req.payload?.notes ?? "")}</textarea>
        </div>
        <div class="row">
          <button class="btn" data-act="resubmit">Resubmit to HR</button>
        </div>
      </div>
    `;
  }

  return `<div class="muted small">No actions available.</div>`;
}

function collectInlineEdit(slot, req) {
  const payload = { ...(req.payload || {}) };
  slot.querySelectorAll("[data-edit]").forEach(el => {
    const key = el.getAttribute("data-edit");
    let val = el.value;
    if (key === "positions") {
      const n = Number(val);
      payload[key] = Number.isFinite(n) ? n : val;
    } else payload[key] = val;
  });

  payload.resubmittedByName = state.user.name;
  payload.resubmittedByEmail = state.user.email;
  payload.resubmittedAtClient = new Date().toISOString();
  return payload;
}

function buildDefaults(tpl) {
  const model = {};
  const fields = tpl?.template?.fields || [];
  fields.forEach(f => {
    if (typeof f.default !== "undefined") model[f.key] = f.default;
    else model[f.key] = (f.type === "number") ? 0 : "";
  });
  model.templateTitle = tpl?.template?.title || "";
  return model;
}

function validateTemplate(tpl, model) {
  const fields = tpl?.template?.fields || [];
  const missing = [];
  fields.forEach(f => {
    if (!f.required) return;
    const v = model[f.key];
    if (v === null || typeof v === "undefined" || String(v).trim() === "") missing.push(f.label || f.key);
  });
  return missing;
}

function renderDynamicFields(root, tpl, model) {
  if (!tpl) {
    root.innerHTML = `<div class="muted">Select template to load fields.</div>`;
    return;
  }
  const fields = tpl.template?.fields || [];
  root.innerHTML = fields.map(f => renderField(f, model[f.key])).join("");

  fields.forEach(f => {
    const el = root.querySelector(`[data-key="${cssId(f.key)}"]`);
    if (!el) return;
    el.oninput = () => model[f.key] = (f.type === "number") ? Number(el.value) : el.value;
    el.onchange = () => model[f.key] = (f.type === "number") ? Number(el.value) : el.value;
  });
}

function renderField(f, value) {
  const req = f.required ? `<span class="muted"> *</span>` : "";
  const v = (value === null || typeof value === "undefined") ? "" : String(value);

  if (f.type === "select") {
    const opts = (f.options || []).map(o => {
      const sel = String(o) === v ? "selected" : "";
      return `<option ${sel} value="${escapeAttr(String(o))}">${escapeHtml(String(o))}</option>`;
    }).join("");
    return `
      <div class="form-row">
        <div class="label">${escapeHtml(f.label || f.key)}${req}</div>
        <select class="select" data-key="${escapeAttr(f.key)}">${opts}</select>
      </div>
    `;
  }

  if (f.type === "textarea") {
    return `
      <div class="form-row">
        <div class="label">${escapeHtml(f.label || f.key)}${req}</div>
        <textarea class="textarea" data-key="${escapeAttr(f.key)}">${escapeHtml(v)}</textarea>
      </div>
    `;
  }

  const type = f.type === "number" ? "number" : "text";
  return `
    <div class="form-row">
      <div class="label">${escapeHtml(f.label || f.key)}${req}</div>
      <input class="input" type="${type}" data-key="${escapeAttr(f.key)}" value="${escapeAttr(v)}" />
    </div>
  `;
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
function escapeAttr(s){return escapeHtml(s)}
function cssId(s){return String(s).replace(/[^a-zA-Z0-9_-]/g,"_")}
