import { apiCall } from "../api.js";

export async function renderTestBankPage({ headerEl, rootEl }) {
  headerEl.textContent = "TEST BANK (ADMIN)";

  rootEl.innerHTML = `
    <div class="card card-wide">
      <div class="row">
        <h3 style="margin:0">Question Bank</h3>
        <button class="btn btn-sm right" id="btnRefresh">Refresh</button>
      </div>
      <p class="muted">Role + TestType based questions manage karo. MCQ only (Phase-2).</p>
      <div class="hr"></div>

      <div class="row" style="gap:10px; flex-wrap:wrap">
        <input class="input" id="qSearch" placeholder="Search question text..." style="min-width:260px" />
        <select class="input" id="fType">
          <option value="">All Test Types</option>
          <option value="EXCEL">EXCEL</option>
          <option value="TALLY">TALLY</option>
          <option value="VOICE">VOICE</option>
          <option value="GENERAL">GENERAL</option>
        </select>
        <select class="input" id="fRole">
          <option value="">All Roles</option>
          <option value="ALL">ALL</option>
          <option value="ACCOUNTS">ACCOUNTS</option>
          <option value="CRM">CRM</option>
          <option value="CCE">CCE</option>
        </select>
        <select class="input" id="fActive">
          <option value="">All</option>
          <option value="YES">Active</option>
          <option value="NO">Disabled</option>
        </select>

        <button class="btn btn-sm" id="btnNew">+ New Question</button>
        <button class="btn btn-sm" id="btnSeed">Seed Demo</button>

        <label class="pill" style="cursor:pointer">
          Bulk CSV Import
          <input type="file" id="csvFile" accept=".csv" style="display:none" />
        </label>

        <button class="btn btn-sm right" id="btnTemplate">CSV Template</button>
      </div>

      <div class="hr"></div>

      <div id="stats" class="muted small"></div>
      <div id="list" class="muted">Loading...</div>
    </div>

    <div class="card card-wide" id="editor" style="display:none">
      <div class="row">
        <h3 style="margin:0">Editor</h3>
        <span class="muted small right" id="editHint"></span>
      </div>
      <div class="hr"></div>

      <div class="row" style="gap:10px; flex-wrap:wrap">
        <div style="min-width:220px">
          <div class="muted small">Test Type</div>
          <select class="input" id="eType">
            <option value="EXCEL">EXCEL</option>
            <option value="TALLY">TALLY</option>
            <option value="VOICE">VOICE</option>
            <option value="GENERAL">GENERAL</option>
          </select>
        </div>

        <div style="min-width:220px">
          <div class="muted small">Role</div>
          <select class="input" id="eRole">
            <option value="ALL">ALL</option>
            <option value="ACCOUNTS">ACCOUNTS</option>
            <option value="CRM">CRM</option>
            <option value="CCE">CCE</option>
          </select>
        </div>

        <div style="min-width:160px">
          <div class="muted small">Marks</div>
          <input class="input" id="eMarks" type="number" min="1" max="10" value="1" />
        </div>

        <div style="min-width:160px">
          <div class="muted small">Active</div>
          <select class="input" id="eActive">
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </div>
      </div>

      <div class="hr"></div>

      <div>
        <div class="muted small">Question</div>
        <textarea class="input" id="eQ" rows="3" style="width:100%"></textarea>
      </div>

      <div class="hr"></div>

      <div class="muted small">Options (MCQ)</div>
      <div class="row" style="gap:10px; flex-wrap:wrap; margin-top:8px">
        <input class="input" id="o0" placeholder="Option A" style="min-width:220px" />
        <input class="input" id="o1" placeholder="Option B" style="min-width:220px" />
        <input class="input" id="o2" placeholder="Option C" style="min-width:220px" />
        <input class="input" id="o3" placeholder="Option D" style="min-width:220px" />
      </div>

      <div class="row" style="gap:10px; flex-wrap:wrap; margin-top:10px">
        <div style="min-width:200px">
          <div class="muted small">Correct Option Index</div>
          <select class="input" id="eCorrect">
            <option value="0">0 (A)</option>
            <option value="1">1 (B)</option>
            <option value="2">2 (C)</option>
            <option value="3">3 (D)</option>
          </select>
        </div>

        <div class="right row" style="gap:8px">
          <button class="btn btn-sm" id="btnCancel">Cancel</button>
          <button class="btn btn-sm" id="btnSave">Save</button>
        </div>
      </div>

      <div class="muted small" style="margin-top:8px" id="saveMsg"></div>
    </div>
  `;

  const el = (sel) => rootEl.querySelector(sel);

  const listEl = el("#list");
  const statsEl = el("#stats");
  const editorEl = el("#editor");

  const qSearch = el("#qSearch");
  const fType = el("#fType");
  const fRole = el("#fRole");
  const fActive = el("#fActive");

  const btnRefresh = el("#btnRefresh");
  const btnNew = el("#btnNew");
  const btnSeed = el("#btnSeed");
  const csvFile = el("#csvFile");
  const btnTemplate = el("#btnTemplate");

  const eHint = el("#editHint");
  const eType = el("#eType");
  const eRole = el("#eRole");
  const eMarks = el("#eMarks");
  const eActive = el("#eActive");
  const eQ = el("#eQ");
  const o0 = el("#o0"), o1 = el("#o1"), o2 = el("#o2"), o3 = el("#o3");
  const eCorrect = el("#eCorrect");
  const btnCancel = el("#btnCancel");
  const btnSave = el("#btnSave");
  const saveMsg = el("#saveMsg");

  let bank = [];
  let editing = null;

  btnRefresh.onclick = () => load();
  btnNew.onclick = () => openEditor(null);
  btnSeed.onclick = () => seedDemo();
  btnTemplate.onclick = () => downloadCsvTemplate();

  [qSearch, fType, fRole, fActive].forEach(x => x.addEventListener("input", render));
  btnCancel.onclick = () => closeEditor();
  btnSave.onclick = () => saveQuestion();

  csvFile.addEventListener("change", async () => {
    const f = csvFile.files && csvFile.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      const rows = parseCsv(text);
      if (!rows.length) return alert("CSV empty");

      // expected columns:
      // testType,role,question,optionA,optionB,optionC,optionD,correctIndex,marks,active
      const header = rows[0].map(h => String(h).trim().toLowerCase());
      const idx = (name) => header.indexOf(name);

      const need = ["testtype","role","question","optiona","optionb","optionc","optiond","correctindex","marks","active"];
      for (const n of need) if (idx(n) === -1) return alert("CSV columns missing: " + n);

      const items = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;

        const item = {
          testType: String(r[idx("testtype")] || "").trim().toUpperCase(),
          role: String(r[idx("role")] || "").trim().toUpperCase(),
          qType: "MCQ",
          question: String(r[idx("question")] || "").trim(),
          options: [
            String(r[idx("optiona")] || "").trim(),
            String(r[idx("optionb")] || "").trim(),
            String(r[idx("optionc")] || "").trim(),
            String(r[idx("optiond")] || "").trim(),
          ].filter(Boolean),
          correctIndex: Number(r[idx("correctindex")]),
          marks: Number(r[idx("marks")] || 1),
          isActive: String(r[idx("active")] || "YES").trim().toUpperCase() === "YES"
        };

        if (!item.testType || !item.role || !item.question || item.options.length < 2) continue;
        items.push(item);
      }

      if (!items.length) return alert("No valid rows found");

      // bulk import using multiple UPSERT calls (no extra backend action needed)
      let ok = 0, fail = 0;
      for (const it of items) {
        try {
          await apiCall("UPSERT_QUESTION", { question: it });
          ok++;
        } catch {
          fail++;
        }
      }

      alert(`Import done ✅  OK: ${ok}  Fail: ${fail}`);
      await load();
    } catch (e2) {
      alert("CSV import error: " + (e2.message || String(e2)));
    } finally {
      csvFile.value = "";
    }
  });

  await load();

  async function load() {
    listEl.innerHTML = `<div class="muted">Loading...</div>`;
    try {
      const res = await apiCall("LIST_QUESTION_BANK", {});
      bank = (res.questions || res.bank || []).map(normalizeQuestionRow);
      render();
    } catch (e) {
      listEl.innerHTML = `<div class="toast">${esc(e.message || String(e))}</div>`;
    }
  }

  function render() {
    const s = String(qSearch.value || "").trim().toLowerCase();
    const t = String(fType.value || "").trim().toUpperCase();
    const r = String(fRole.value || "").trim().toUpperCase();
    const a = String(fActive.value || "").trim().toUpperCase();

    const filtered = bank.filter(q => {
      if (t && q.testType !== t) return false;
      if (r && q.role !== r) return false;
      if (a && (q.isActive ? "YES" : "NO") !== a) return false;
      if (s && !(`${q.question} ${q.id} ${q.testType} ${q.role}`.toLowerCase().includes(s))) return false;
      return true;
    });

    statsEl.textContent = `Total: ${bank.length} | Showing: ${filtered.length}`;

    if (!filtered.length) {
      listEl.innerHTML = `<div class="muted">No questions found.</div>`;
      return;
    }

    listEl.innerHTML = filtered.map(q => `
      <div class="card card-wide" style="margin-bottom:10px">
        <div class="row">
          <span class="pill"><b>${esc(q.id || "")}</b></span>
          <span class="pill">${esc(q.testType)}</span>
          <span class="pill warn">${esc(q.role)}</span>
          <span class="pill">${q.isActive ? "Active" : "Disabled"}</span>
          <span class="right muted small">${esc(q.updatedAt || "")}</span>
        </div>

        <div style="margin-top:10px; font-weight:900">${esc(q.question)}</div>
        <div class="muted small" style="margin-top:6px">Marks: ${esc(q.marks)} • Correct: ${esc(q.correctIndex)}</div>

        <div class="row" style="margin-top:10px; gap:8px; flex-wrap:wrap">
          <button class="btn btn-sm" data-edit="${esc(q.id)}">Edit</button>
          <button class="btn btn-sm" data-toggle="${esc(q.id)}">${q.isActive ? "Disable" : "Enable"}</button>
          <span class="muted small right">Options: ${(q.options||[]).length}</span>
        </div>
      </div>
    `).join("");

    listEl.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => {
      const id = b.getAttribute("data-edit");
      const q = bank.find(x => x.id === id);
      openEditor(q || null);
    });

    listEl.querySelectorAll("[data-toggle]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-toggle");
      const q = bank.find(x => x.id === id);
      if (!q) return;

      await apiCall("TOGGLE_QUESTION", { id, isActive: !q.isActive });
      await load();
    });
  }

  function openEditor(q) {
    editing = q ? { ...q } : null;
    editorEl.style.display = "block";
    saveMsg.textContent = "";

    if (!q) {
      eHint.textContent = "New Question";
      eType.value = "EXCEL";
      eRole.value = "ALL";
      eMarks.value = 1;
      eActive.value = "YES";
      eQ.value = "";
      o0.value = ""; o1.value = ""; o2.value = ""; o3.value = "";
      eCorrect.value = "0";
      return;
    }

    eHint.textContent = `Editing: ${q.id}`;
    eType.value = q.testType || "EXCEL";
    eRole.value = q.role || "ALL";
    eMarks.value = Number(q.marks || 1);
    eActive.value = q.isActive ? "YES" : "NO";
    eQ.value = q.question || "";
    o0.value = q.options?.[0] || "";
    o1.value = q.options?.[1] || "";
    o2.value = q.options?.[2] || "";
    o3.value = q.options?.[3] || "";
    eCorrect.value = String(q.correctIndex ?? 0);
  }

  function closeEditor() {
    editorEl.style.display = "none";
    editing = null;
  }

  async function saveQuestion() {
    try {
      saveMsg.textContent = "Saving...";
      const question = String(eQ.value || "").trim();
      const options = [o0.value, o1.value, o2.value, o3.value].map(x => String(x||"").trim()).filter(Boolean);
      if (!question) throw new Error("Question required");
      if (options.length < 2) throw new Error("At least 2 options required");

      const payload = {
        id: editing?.id || "", // blank => backend should create
        testType: String(eType.value || "EXCEL").trim().toUpperCase(),
        role: String(eRole.value || "ALL").trim().toUpperCase(),
        qType: "MCQ",
        question,
        options,
        correctIndex: Number(eCorrect.value || 0),
        marks: Number(eMarks.value || 1),
        isActive: String(eActive.value) === "YES"
      };

      await apiCall("UPSERT_QUESTION", { question: payload });
      saveMsg.textContent = "Saved ✅";
      closeEditor();
      await load();
    } catch (e) {
      saveMsg.textContent = "Error: " + (e.message || String(e));
    }
  }

  async function seedDemo() {
    if (!confirm("Seed demo questions? (duplicates possible if you run multiple times)")) return;
    const demo = [
      // EXCEL (ACCOUNTS)
      mk("EXCEL","ACCOUNTS","Excel me VLOOKUP ka main use kya hai?", ["Lookup value se table me match", "Image edit", "Audio record", "PDF compress"], 0, 1),
      mk("EXCEL","ACCOUNTS","Pivot Table kis purpose ke liye hoti hai?", ["Data summarize/analysis", "Video render", "Email send", "Drive backup"], 0, 1),

      // TALLY (ACCOUNTS)
      mk("TALLY","ACCOUNTS","Tally me Voucher Type ka use?", ["Entries categorize", "Camera access", "GPS", "Browser cache"], 0, 1),

      // EXCEL (CRM)
      mk("EXCEL","CRM","Excel me Filter ka use?", ["Rows filter/sort", "CPU boost", "Wifi connect", "Virus remove"], 0, 1),

      // VOICE (ALL) - still MCQ + extra voice block is separate
      mk("VOICE","ALL","Customer se baat karte time sabse pehle kya confirm karna chahiye?", ["Name + requirement", "GPU model", "Instagram bio", "Laptop charger"], 0, 1),
    ];

    let ok = 0;
    for (const q of demo) {
      await apiCall("UPSERT_QUESTION", { question: q });
      ok++;
    }
    alert(`Seed done ✅ (${ok} questions)`);
    await load();
  }

  function mk(testType, role, question, options, correctIndex, marks) {
    return { id:"", testType, role, qType:"MCQ", question, options, correctIndex, marks, isActive:true };
  }
}

/* ---------------- Helpers ---------------- */

function normalizeQuestionRow(q) {
  // backend different shapes handle
  return {
    id: q.id || q.qId || q.questionId || "",
    testType: String(q.testType || q.type || q.section || "").toUpperCase(),
    role: String(q.role || q.forRole || q.roleTag || "ALL").toUpperCase(),
    qType: String(q.qType || q.questionType || "MCQ").toUpperCase(),
    question: q.question || q.text || "",
    options: Array.isArray(q.options) ? q.options : (q.optionsCsv ? String(q.optionsCsv).split("||") : []),
    correctIndex: Number(q.correctIndex ?? q.correct ?? 0),
    marks: Number(q.marks ?? 1),
    isActive: Boolean(q.isActive ?? (String(q.active||"YES").toUpperCase()==="YES")),
    updatedAt: q.updatedAt || q.updatedOn || ""
  };
}

// Minimal CSV parser (supports quoted values)
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') { cur += '"'; i++; continue; }
    if (ch === '"') { inQuotes = !inQuotes; continue; }

    if (!inQuotes && (ch === ",")) { row.push(cur); cur = ""; continue; }
    if (!inQuotes && (ch === "\n")) { row.push(cur); rows.push(row); row = []; cur = ""; continue; }
    if (ch === "\r") continue;

    cur += ch;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }

  // remove empty trailing rows
  return rows.filter(r => r.some(x => String(x).trim() !== ""));
}

function downloadCsvTemplate() {
  const csv =
`testType,role,question,optionA,optionB,optionC,optionD,correctIndex,marks,active
EXCEL,ACCOUNTS,Excel me VLOOKUP ka use?,Lookup value se match,Chart banana,Mail bhejna,File delete,0,1,YES
TALLY,ACCOUNTS,Tally me Voucher ka use?,Entries record,Gaming,Typing,Painting,0,1,YES
EXCEL,CRM,Excel filter ka use?,Rows filter/sort,WIFI,BIOS,SSD clean,0,1,YES
VOICE,ALL,Customer se pehle kya confirm?,Name + requirement,CPU,GPU,Instagram,0,1,YES
`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "question_bank_template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
