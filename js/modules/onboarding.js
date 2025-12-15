import { apiRequest } from '../api.js';

function renderDocs() {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Onboarding</h1>
      <span class="badge">HR</span>
    </div>
    <form class="form" id="docs-form">
      <label>Upload Documents
        <input type="file" name="docs" multiple />
      </label>
      <label>Joining Date
        <input type="date" name="joiningDate" required />
      </label>
      <div class="action-row">
        <button class="primary" type="submit">Save & Verify</button>
      </div>
    </form>
  `;

  panel.querySelector('#docs-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await apiRequest('ONBOARDING', Object.fromEntries(formData.entries()));
    alert('Documents captured and onboarding started.');
  });

  return panel;
}

function renderProbation() {
  const panel = document.createElement('section');
  panel.className = 'panel stack';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Probation Tracking</h1>
      <span class="badge">System</span>
    </div>
    <p class="notice">System schedules induction, creates employee record, and tracks probation milestones.</p>
    <table class="table">
      <thead><tr><th>Milestone</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        <tr>
          <td>Day 1 Induction</td>
          <td><span class="status-pill success">Completed</span></td>
          <td>-</td>
        </tr>
        <tr>
          <td>30-day Review</td>
          <td><span class="status-pill warning">Upcoming</span></td>
          <td><button data-action="ACK">Acknowledge</button></td>
        </tr>
      </tbody>
    </table>
  `;

  panel.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await apiRequest('PROBATION_EVENT', { candidateId: 'C1001', event: btn.dataset.action });
      alert('Probation event acknowledged');
    });
  });

  return panel;
}

export function loadOnboardingModule() {
  const container = document.createElement('div');
  container.className = 'stack';
  container.appendChild(renderDocs());
  container.appendChild(renderProbation());
  return container;
}
