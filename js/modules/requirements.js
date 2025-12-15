import { apiRequest } from '../api.js';
import { state } from '../state.js';

const requirementStages = {
  EA_DRAFT: 'EA Draft',
  PENDING_HR_REVIEW: 'Pending HR Review',
  NEED_CLARIFICATION: 'Need Clarification',
  APPROVED: 'Approved (Posting Unlocked)',
};

function renderRequirementForm(templates = []) {
  const wrapper = document.createElement('section');
  wrapper.className = 'panel';
  wrapper.innerHTML = `
    <div class="section-title">
      <h1>Raise Requirement</h1>
      <span class="badge">EA</span>
    </div>
    <form class="form" id="requirement-form">
      <label>Job Role
        <select name="role" required>
          <option value="">Select a role</option>
          ${templates.map((tpl) => `<option value="${tpl.id}">${tpl.name}</option>`).join('')}
        </select>
      </label>
      <label>Openings
        <input type="number" name="headcount" min="1" required />
      </label>
      <label>Remarks
        <textarea name="remarks" placeholder="Context, budget, location..."></textarea>
      </label>
      <div class="action-row">
        <button class="primary" type="submit">Submit</button>
      </div>
    </form>
    <p class="notice">Templates auto-fill job role attributes; backend resolves permissible fields per role.</p>
  `;

  wrapper.querySelector('#requirement-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    await apiRequest('RAISE_REQUIREMENT', payload);
    alert('Requirement raised. Status: PENDING_HR_REVIEW');
  });

  return wrapper;
}

function renderHrReview() {
  const wrapper = document.createElement('section');
  wrapper.className = 'panel stack';
  wrapper.innerHTML = `
    <div class="section-title">
      <h1>HR Review</h1>
      <span class="badge">HR</span>
    </div>
    <div class="action-row">
      <button class="primary" id="approve-requirement">Approve</button>
      <button class="danger" id="sendback-requirement">Send Back</button>
    </div>
    <textarea id="sendback-remark" placeholder="Remark required when sending back"></textarea>
  `;

  wrapper.querySelector('#approve-requirement').addEventListener('click', async () => {
    await apiRequest('APPROVE_REQUIREMENT', { requirementId: 'R101' });
    alert('Requirement approved; job posting unlocked.');
  });

  wrapper.querySelector('#sendback-requirement').addEventListener('click', async () => {
    const remark = wrapper.querySelector('#sendback-remark').value.trim();
    if (!remark) {
      alert('Remark required');
      return;
    }
    await apiRequest('SEND_BACK_REQUIREMENT', { requirementId: 'R101', remark });
    alert('Requirement sent back with clarification request.');
  });

  return wrapper;
}

export function loadRequirementsModule() {
  const container = document.createElement('div');
  container.className = 'stack';
  container.appendChild(renderRequirementForm(state.get().requirementTemplates));
  container.appendChild(renderHrReview());

  const statusPanel = document.createElement('section');
  statusPanel.className = 'panel';
  statusPanel.innerHTML = `
    <div class="section-title">
      <h2>States</h2>
      <span class="badge">State-Driven</span>
    </div>
    <table class="table">
      <thead><tr><th>Code</th><th>Description</th></tr></thead>
      <tbody>
        ${Object.entries(requirementStages).map(([code, label]) => `<tr><td>${code}</td><td>${label}</td></tr>`).join('')}
      </tbody>
    </table>
  `;
  container.appendChild(statusPanel);
  return container;
}
