const API_URL = (window.CONFIG && window.CONFIG.API_URL) ? window.CONFIG.API_URL : "";

const box = document.getElementById("box");
const token = new URLSearchParams(location.search).get("token");

if (!API_URL) {
  box.innerHTML = `<div class="toast">CONFIG.API_URL missing in js/config.js</div>`;
} else if (!token) {
  box.innerHTML = `<div class="toast">Missing token in URL</div>`;
} else {
  init();
}

async function init() {
  try {
    const session = await api("GET_TEST_SESSION", token, {});
    const data = session.data;

    const cand = data.candidate;
    const tests = data.tests || [];
    const questions = data.questions || {};
    const expiresAt = data.expiresAt || "";

    box.innerHTML = `
      <div class="row">
        <h3 style="margin:0">Test for: ${esc(cand.name)}</h3>
        <span class="pill warn">Expires: ${esc(expiresAt)}</span>
      </div>

      <div class="hr"></div>

      ${tests.map(t => renderTest(t, questions[t] || [])).join("")}

      <div class="hr"></div>
      <button class="btn" id="submitBtn">Submit Test</button>
      <div id="msg" class="muted small" style="margin-top:10px"></div>
    `;

    document.getElementById("submitBtn").onclick = async () => {
      const payload = collectAnswers(tests, questions);
      document.getElementById("msg").textContent = "Submitting...";
      const out = await api("SUBMIT_TEST", token, { answers: payload });

      const res = out.data?.result;
      document.getElementById("msg").innerHTML =
        `<span class="pill ok">Submitted ✅</span>
         <span class="pill">Score: ${esc(res.finalScore)}</span>
         <span class="pill">Correct: ${esc(res.correct)}/${esc(res.totalQuestions)}</span>`;
      document.getElementById("submitBtn").disabled = true;
    };

  } catch (e) {
    box.innerHTML = `<div class="toast">${esc(e.message || String(e))}</div>`;
  }
}

function renderTest(type, qs) {
  if (type === "VOICE") {
    return `
      <div class="card card-wide" style="margin-top:12px">
        <div class="row">
          <b>VOICE TEST</b>
          <span class="pill">Manual review</span>
        </div>
        <div class="muted small" style="margin-top:6px">Audio link + short intro text</div>
        <div class="form-row" style="margin-top:10px">
          <div class="label">Audio URL</div>
          <input class="input" id="voice_audio" placeholder="Paste audio link" />
        </div>
        <div class="form-row">
          <div class="label">Intro (2 lines)</div>
          <input class="input" id="voice_intro" placeholder="Write your intro" />
        </div>
      </div>
    `;
  }

  return `
    <div class="card card-wide" style="margin-top:12px">
      <div class="row">
        <b>${esc(type)} TEST</b>
        <span class="pill">${qs.length} Questions</span>
      </div>
      <div class="hr"></div>
      ${qs.map(q => `
        <div style="margin-bottom:14px">
          <div style="font-weight:700">${esc(q.id)}. ${esc(q.q)}</div>
          <div class="grid grid-2" style="margin-top:8px">
            ${q.options.map((opt, idx) => `
              <label class="pill" style="cursor:pointer">
                <input type="radio" name="${esc(type)}_${esc(q.id)}" value="${idx}" />
                ${esc(opt)}
              </label>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function collectAnswers(tests, questions) {
  const out = {};
  tests.forEach(t => {
    if (t === "VOICE") {
      out.VOICE = {
        audioUrl: (document.getElementById("voice_audio")?.value || "").trim(),
        introText: (document.getElementById("voice_intro")?.value || "").trim()
      };
      return;
    }

    out[t] = {};
    (questions[t] || []).forEach(q => {
      const name = `${t}_${q.id}`;
      const el = document.querySelector(`input[name="${name}"]:checked`);
      out[t][q.id] = el ? Number(el.value) : -1;
    });
  });
  return out;
}

async function api(action, token, data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token, data })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message || "API error");
  return json;
}

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]))}
