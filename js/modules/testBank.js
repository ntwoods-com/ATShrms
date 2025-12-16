// /js/modules/testBank.js
import { apiCall } from "../api.js";
import { getState } from "../state.js";

export async function renderTestBank(root) {
  const me = getState().me;
  if (!me || me.role !== "ADMIN") {
    root.innerHTML = `<div class="card"><h3>Not Allowed</h3><p>Only ADMIN can access Question Bank.</p></div>`;
    return;
  }

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <h2>Question Bank</h2>
        <div class="row">
          <select id="qbTestType" class="inp">
            <option value="">All Tests</option>
            <option value="EXCEL">EXCEL</option>
            <option value="TALLY">TALLY</option>
            <option value="VOICE">VOICE</option>
            <option value="GENERAL">GENERAL</option>
          </select>
          <label class="chk"><input id="qbActiveOnly" type="checkbox"> Active only</label>
          <button id="qbReload" class="btn">Reload</button>
        </div>
      </div>

      <div class="grid2">
        <div class="card">
          <h3 id="qbFormTitle">Add / Edit Question</h3>

          <div class="grid2">
            <div>
              <label class="lbl">Test Type</label>
              <select id="fTestType" class="inp">
                <option value="EXCEL">EXCEL</option>
                <option value="TALLY">TALLY</option>
                <option value="VOICE">VOICE</option>
                <option value="GENERAL">GENERAL</option>
              </select>
            </div>

            <div>
              <label class="lbl">Role Tag</label>
              <select id="fRoleTag" class="inp">
                <option value="ALL">ALL</option>
                <option value="ACCOUNTS">ACCOUNTS</option>
                <option value="CRM">CRM</option>
                <option value="CCE">CCE</option>
              </select>
            </div>

            <div>
              <label class="lbl">Section</label>
              <input id="fSection" class="inp" placeholder="e.g. VLOOKUP, GST, Excel Basics" />
            </div>

            <div>
              <label class="lbl">Difficulty</label>
              <select id="fDifficulty" class="inp">
                <option value="EASY">EASY</option>
                <option value="MEDIUM" selected>MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            <div>
              <label class="lbl">Question Type</label>
              <select id="fQType" class="inp">
                <option value="MCQ">MCQ</option>
                <option value="TEXT">TEXT</option>
              </select>
            </div>

            <div>
              <label class="lbl">Marks</label>
              <input id="fMarks" class="inp" type="number" min="1" value="1" />
            </div>
          </div>

          <label class="lbl">Question</label>
          <textarea id="fQuestion" class="inp" rows="4" placeholder="Write your question..."></textarea>

          <div id="mcqBox">
            <label class="lbl">Options (MCQ)</label>
            <div class="grid2">
              <input id="opt0" class="inp" placeholder="Option A" />
              <input id="opt1" class="inp" placeholder="Option B" />
              <input id="opt2" class="inp" placeholder="Option C" />
              <input id="opt3" class="inp" placeholder="Option D" />
            </div>
            <label class="lbl">Correct Index (0-3)</label>
            <input id="fCorrectIndex" class="inp" type="number" min="0" max="3" value="0" />
          </div>

          <div class="row">
            <label class="chk"><input id="fActive" type="checkbox" checked> Active</label>
            <button id="qbReset" class="btn btn-ghost">Reset</button>
            <button id="qbSave" class="btn btn-primary">Save</button>
          </div>

          <p class="muted">Tip: TEXT type me correctIndex/options ignore ho jayenge.</p>
        </div>

        <div class="card">
          <div class="row space">
            <h3>Questions</h3>
            <input id="qbSearch" class="inp" placeholder="Search..." />
          </div>
          <div id="qbList" class="list"></div>
        </div>
      </div>
    </div>
  `;

  const $ = (id) => document.getElementById(id);

  let all = [];
  let editingId = "";

  function toast(msg) { alert(msg); }

  function readForm() {
    const qType = $("fQType").value;
    const options = [$("opt0").value, $("opt1").value, $("opt2").value, $("opt3").value]
      .map(s => (s || "").trim())
      .filter(Boolean);

    return {
      id: editingId || "",
      testType: $("fTestType").value,
      roleTag: $("fRoleTag").value,
      section: $("fSection").value.trim(),
      difficulty: $("fDifficulty").value,
      qType,
      question: $("fQuestion").value.trim(),
      options: qType === "MCQ" ? options : [],
      correctIndex: qType === "MCQ" ? Number($("fCorrectIndex").value) : 0,
      marks: Number($("fMarks").value || 1),
      isActive: $("fActive").checked
    };
  }

  function setForm(q) {
    editingId = q?.id || "";
    $("qbFormTitle").textContent = editingId ? `Edit Question: ${editingId}` : "Add / Edit Question";

    $("fTestType").value = q?.testType || "EXCEL";
    $("fRoleTag").value = q?.roleTag || "ALL";
    $("fSection").value = q?.section || "";
    $("fDifficulty").value = (q?.answer?.difficulty || q?.difficulty || "MEDIUM").toUpperCase();
    $("fQType").value = (q?.qType || "MCQ").toUpperCase();
    $("fMarks").value = q?.marks ?? 1;
    $("fQuestion").value = q?.question || "";
    $("fActive").checked = q?.active !== false;

    const opts = Array.isArray(q?.options) ? q.options : [];
    $("opt0").value = opts[0] || "";
    $("opt1").value = opts[1] || "";
    $("opt2").value = opts[2] || "";
    $("opt3").value = opts[3] || "";

    $("fCorrectIndex").value = Number(q?.answer?.correctIndex ?? 0);

    toggleMcqBox();
  }

  function toggleMcqBox() {
    const isMcq = $("fQType").value === "MCQ";
    $("mcqBox").style.display = isMcq ? "block" : "none";
  }

  function renderList() {
    const q = ($("qbSearch").value || "").toLowerCase();
    const filtered = all.filter(x => {
      const hay = `${x.id} ${x.testType} ${x.roleTag} ${x.section} ${x.qType} ${x.question}`.toLowerCase();
      return !q || hay.includes(q);
    });

    $("qbList").innerHTML = filtered.map(item => {
      const diff = (item.answer?.difficulty || "MEDIUM").toUpperCase();
      return `
        <div class="item">
          <div class="row space">
            <div>
              <div class="title">${item.id} <span class="tag">${item.testType}</span> <span class="tag">${item.roleTag || "ALL"}</span></div>
              <div class="muted">${item.section || "GENERAL"} • ${diff} • ${item.qType} • Marks: ${item.marks}</div>
            </div>
            <div class="row">
              <button class="btn btn-ghost" data-edit="${item.id}">Edit</button>
              <button class="btn" data-toggle="${item.id}">
                ${item.active ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
          <div class="q">${escapeHtml(item.question || "")}</div>
        </div>
      `;
    }).join("");

    $("qbList").querySelectorAll("[data-edit]").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-edit");
        const found = all.find(x => x.id === id);
        setForm(found);
      });
    });

    $("qbList").querySelectorAll("[data-toggle]").forEach(b => {
      b.addEventListener("click", async () => {
        const id = b.getAttribute("data-toggle");
        const found = all.find(x => x.id === id);
        if (!found) return;
        await apiCall("TOGGLE_QUESTION", { id, isActive: !found.active });
        await load();
      });
    });
  }

  async function load() {
    const testType = $("qbTestType").value || "";
    const activeOnly = $("qbActiveOnly").checked ? "YES" : "NO";
    const res = await apiCall("LIST_QUESTION_BANK", { testType, activeOnly });
    all = res?.questions || [];
    renderList();
  }

  function resetForm() {
    editingId = "";
    setForm({ testType: "EXCEL", roleTag: "ALL", qType: "MCQ", marks: 1, active: true, answer: { correctIndex: 0, difficulty: "MEDIUM" }, options: ["","","",""] });
  }

  $("fQType").addEventListener("change", toggleMcqBox);
  $("qbReload").addEventListener("click", load);
  $("qbSearch").addEventListener("input", renderList);
  $("qbReset").addEventListener("click", resetForm);

  $("qbSave").addEventListener("click", async () => {
    const payload = readForm();
    if (!payload.question) return toast("Question required");

    if (payload.qType === "MCQ") {
      if (!payload.options || payload.options.length < 2) return toast("MCQ needs at least 2 options");
      if (!(payload.correctIndex >= 0 && payload.correctIndex <= 3)) return toast("CorrectIndex 0-3");
    }

    await apiCall("UPSERT_QUESTION", payload);
    await load();
    resetForm();
    toast("Saved ✅");
  });

  resetForm();
  await load();
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
