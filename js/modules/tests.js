import { apiRequest } from '../api.js';

const roleTestMap = {
  Accounts: ['Tally', 'Excel'],
  'CRM / CCE': ['Excel', 'Voice'],
};

function renderTestGeneration() {
  const panel = document.createElement('section');
  panel.className = 'panel stack';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Test Engine</h1>
      <span class="badge">Auto</span>
    </div>
    <label>Role
      <select id="role-select">
        ${Object.keys(roleTestMap).map((role) => `<option value="${role}">${role}</option>`).join('')}
      </select>
    </label>
    <button class="primary" id="generate-test">Generate 24h Link</button>
    <p class="notice">Token-based, auto-grading tests. HR has view-only access.</p>
  `;

  panel.querySelector('#generate-test').addEventListener('click', async () => {
    const role = panel.querySelector('#role-select').value;
    const tests = roleTestMap[role];
    await apiRequest('GENERATE_TEST_LINK', { candidateId: 'C1001', role, tests });
    alert(`Generated tests: ${tests.join(', ')}`);
  });

  return panel;
}

function renderResults() {
  const panel = document.createElement('section');
  panel.className = 'panel stack';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Admin Review (Test Fail)</h1>
      <span class="badge">Admin</span>
    </div>
    <table class="table">
      <thead><tr><th>Candidate</th><th>Test</th><th>Score</th><th>Action</th></tr></thead>
      <tbody>
        <tr>
          <td>Riya Singh</td>
          <td>Excel</td>
          <td>48%</td>
          <td class="action-row">
            <button data-action="EDIT">Edit Marks</button>
            <button class="primary" data-action="RESUME">Resume</button>
            <button class="danger" data-action="REJECT">Reject</button>
          </td>
        </tr>
      </tbody>
    </table>
  `;

  panel.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      await apiRequest('ADMIN_DECISION', { candidateId: 'C1001', decision: `TEST_${action}` });
      alert(`Admin decision submitted: ${action}`);
    });
  });

  return panel;
}

export function loadTestsModule() {
  const container = document.createElement('div');
  container.className = 'stack';
  container.appendChild(renderTestGeneration());
  container.appendChild(renderResults());
  return container;
}
