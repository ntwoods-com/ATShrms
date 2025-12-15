import { apiRequest } from '../api.js';

function renderOwnerDecision() {
  const panel = document.createElement('section');
  panel.className = 'panel stack';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Owner Decision</h1>
      <span class="badge">OWNER</span>
    </div>
    <div class="action-row">
      <button class="primary" data-decision="APPROVE_WALKIN">Approve for Walk-in</button>
      <button data-decision="HOLD">Hold</button>
      <button class="danger" data-decision="REJECT">Reject</button>
    </div>
    <textarea id="owner-remark" placeholder="Remark for hold/reject"></textarea>
  `;

  panel.querySelectorAll('[data-decision]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const decision = btn.dataset.decision;
      const remark = panel.querySelector('#owner-remark').value.trim();
      await apiRequest('ADMIN_DECISION', { candidateId: 'C1001', decision, remark });
      alert(`Owner decision recorded: ${decision}`);
    });
  });

  return panel;
}

function renderSchedule() {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Interview & Walk-in</h1>
      <span class="badge">HR</span>
    </div>
    <form class="form" id="interview-form">
      <label>Date <input type="date" name="date" required /></label>
      <label>Time <input type="time" name="time" required /></label>
      <label>Location <input type="text" name="location" required placeholder="Office / VC link" /></label>
      <div class="action-row">
        <button class="primary" type="submit">Schedule</button>
      </div>
    </form>
    <p class="notice">Appeared status unlocks pre-interview feedback and test generation.</p>
  `;

  panel.querySelector('#interview-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await apiRequest('SCHEDULE_INTERVIEW', Object.fromEntries(formData.entries()));
    alert('Interview scheduled. Status: INTERVIEW_SCHEDULE.');
  });

  return panel;
}

function renderPreInterview() {
  const panel = document.createElement('section');
  panel.className = 'panel stack';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Pre-Interview Feedback</h1>
      <span class="badge">HR</span>
    </div>
    <div class="form">
      <label>Communication (0-10)
        <input type="number" name="comm" min="0" max="10" />
      </label>
      <label>Role Fit (0-10)
        <input type="number" name="roleFit" min="0" max="10" />
      </label>
      <label>Remark
        <textarea name="remark"></textarea>
      </label>
      <div class="action-row">
        <button class="primary" id="submit-pre">Submit</button>
        <button id="send-admin">Send to Admin</button>
      </div>
    </div>
  `;

  const submitPre = async (sendToAdmin = false) => {
    const comm = Number(panel.querySelector('[name="comm"]').value);
    const roleFit = Number(panel.querySelector('[name="roleFit"]').value);
    const overall = Number(((comm + roleFit) / 2).toFixed(1));
    const remark = panel.querySelector('[name="remark"]').value;
    const status = overall >= 6 ? 'PRE_INTERVIEW_PASS' : 'PRE_INTERVIEW_FAIL';

    await apiRequest('PRE_INTERVIEW_FEEDBACK', {
      candidateId: 'C1001',
      comm,
      roleFit,
      overall,
      sendToAdmin,
      status,
    });
    alert(`Pre-interview captured. Status: ${status}${sendToAdmin ? ' (Admin review)' : ''}`);
  };

  panel.querySelector('#submit-pre').addEventListener('click', () => submitPre(false));
  panel.querySelector('#send-admin').addEventListener('click', () => submitPre(true));

  return panel;
}

export function loadInterviewsModule() {
  const container = document.createElement('div');
  container.className = 'stack';
  container.appendChild(renderOwnerDecision());
  container.appendChild(renderSchedule());
  container.appendChild(renderPreInterview());
  return container;
}
