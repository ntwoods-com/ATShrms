import { apiCallPublic } from "./api.js";

const token = new URLSearchParams(location.search).get("token") || "";
const elApp = document.querySelector("#app");
const elMeta = document.querySelector("#meta");
const elTimer = document.querySelector("#timer");
const elMsg = document.querySelector("#msg");
const btnSubmit = document.querySelector("#btnSubmit");

if (!token) {
  elMeta.textContent = "Missing token in URL";
  btnSubmit.disabled = true;
} else {
  boot();
}

let session = null;
let answers = loadLocalAnswers(token);

async function boot() {
  try {
    btnSubmit.disabled = true;
    elMeta.textContent = "Loading session...";
    session = await apiCallPublic("GET_TEST_SESSION", token, {});
    btnSubmit.disabled = false;

    elMeta.textContent = `${session.candidate?.name || ""} • Expires: ${fmt(session.expiresAt)} • Ends: ${fmt(session.endsAt)}`;
    renderQuestions(session.questions || {});
    startTimer(session.endsAt);

    btnSubmit.onclick = submit;
  } catch (e) {
    elMeta.textContent = "Error: " + e.message;
    btnSubmit.disabled = true;
  }
}

function renderQuestions(qpack) {
  const types = Object.keys(qpack || {});
  if (!types.length) {
    elApp.innerHTML = `<div class="muted">No questions found (Question bank empty?)</div>`;
    return;
  }

  elApp.innerHTML = types.map(t => {
    const qs = qpack[t] || [];
    return `
      <div class="hr"></div>
      <h3 class="secTitle">${esc(t)} <span>(${qs.length} Q)</span></h3>
      ${qs.map((q, idx) => renderQuestion(t, q, idx)).join("")}
      ${t === "VOICE" ? renderVoiceBlock() : ""}
    `;
  }).join("");
}

function renderQuestion(testType, q, idx) {
  const qid = q.id;
  const selected = (answers[testType] && answers[testType][qid] != null) ? Number(answers[testType][qid]) : null;

  if (String(q.qType || "").toUpperCase() !== "MCQ") {
    return `
      <div class="q">
        <b>${idx + 1}. ${esc(q.question || "")}</b>
        <div class="muted">Non-MCQ type currently not enabled</div>
      </div>
    `;
  }

  const opts = Array.isArray(q.options) ? q.options : [];
  return `
    <div class="q" data-test="${esc(testType)}" data-qid="${esc(qid)}">
      <b>${idx + 1}. ${esc(q.question || "")} <span class="muted">(${Number(q.marks||1)} marks)</span></b>
      ${opts.map((op, oi) => `
        <label class="opt">
          <input type="radio" name="${esc(testType)}_${esc(qid)}" value="${oi}" ${selected===oi?"checked":""} />
          <div>${esc(op)}</div>
        </label>
      `).join("")}
    </div>
  `;
}

function renderVoiceBlock() {
  const v = answers.VOICE || {};
  return `
    <div class="q">
      <b>Voice Task</b>
      <div class="muted">Audio URL + Short intro (2-3 lines)</div>
      <div class="hr"></div>
      <div class="muted">Audio URL</div>
      <input class="input" id="voiceUrl" value="${esc(v.audioUrl||"")}" placeholder="https://drive.google.com/..." />
      <div class="hr"></div>
      <div class="muted">Intro Text</div>
      <textarea class="input" id="voiceIntro" rows="4" placeholder="Apna intro..." >${esc(v.introText||"")}</textarea>
    </div>
  `;
}

document.addEventListener("change", (e) => {
  const inp = e.target;
  if (inp && inp.type === "radio") {
    const box = inp.closest(".q");
    const testType = box.getAttribute("data-test");
    const qid = box.getAttribute("data-qid");
    answers[testType] = answers[testType] || {};
    answers[testType][qid] = Number(inp.value);
    saveLocalAnswers(token, answers);
  }
});

async function submit() {
  try {
    // VOICE capture
    const vu = document.querySelector("#voiceUrl");
    const vi = document.querySelector("#voiceIntro");
    if (vu || vi) {
      answers.VOICE = answers.VOICE || {};
      answers.VOICE.audioUrl = vu ? vu.value.trim() : (answers.VOICE.audioUrl || "");
      answers.VOICE.introText = vi ? vi.value.trim() : (answers.VOICE.introText || "");
      saveLocalAnswers(token, answers);
    }

    btnSubmit.disabled = true;
    elMsg.textContent = "Submitting...";
    const res = await apiCallPublic("SUBMIT_TEST", token, { answers });
    elMsg.textContent = `Submitted ✅ Score: ${res.result?.finalScore ?? "--"}%`;
    elApp.innerHTML = `<div><b>Test Submitted ✅</b><div class="muted">Score: ${res.result?.finalScore ?? "--"}%</div></div>`;
  } catch (e) {
    elMsg.textContent = "Error: " + e.message;
    btnSubmit.disabled = false;
  }
}

function startTimer(endsAtIso) {
  const tick = () => {
    if (!endsAtIso) { elTimer.textContent = "--:--"; return; }
    const ms = new Date(endsAtIso).getTime() - Date.now();
    if (ms <= 0) {
      elTimer.textContent = "00:00";
      btnSubmit.disabled = true;
      elMsg.textContent = "Time over";
      return;
    }
    const s = Math.floor(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2,"0");
    const ss = String(s % 60).padStart(2,"0");
    elTimer.textContent = `${mm}:${ss}`;
    requestAnimationFrame(()=>{}); // smooth
  };
  tick();
  setInterval(tick, 1000);
}

function loadLocalAnswers(t) {
  try { return JSON.parse(localStorage.getItem("hrms_test_answers_" + t) || "{}"); }
  catch { return {}; }
}
function saveLocalAnswers(t, obj) {
  localStorage.setItem("hrms_test_answers_" + t, JSON.stringify(obj || {}));
}
function fmt(iso){ return iso ? new Date(iso).toLocaleString() : ""; }
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
