import { apiRequest } from '../api.js';

function renderPermissions() {
  const panel = document.createElement('section');
  panel.className = 'panel stack';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Permissions & Roles</h1>
      <span class="badge">Admin</span>
    </div>
    <p class="notice">Admin can modify permissions, revert from rejection log, and edit HR marks.</p>
    <div class="form">
      <label>User ID <input type="text" id="perm-user" placeholder="U123" /></label>
      <label>Permissions (comma separated)
        <input type="text" id="perm-list" placeholder="REQUIREMENT_APPROVE,CALL_SCREENING" />
      </label>
      <button class="primary" id="save-permissions">Save</button>
    </div>
  `;

  panel.querySelector('#save-permissions').addEventListener('click', async () => {
    const userId = panel.querySelector('#perm-user').value;
    const permissions = panel.querySelector('#perm-list').value.split(',').map((p) => p.trim()).filter(Boolean);
    await apiRequest('ADMIN_UPDATE_PERMISSIONS', { userId, permissions });
    alert('Permissions updated');
  });

  return panel;
}

function renderRejectionLog() {
  const panel = document.createElement('section');
  panel.className = 'panel stack';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Rejection Log & Revert</h1>
      <span class="badge">Admin</span>
    </div>
    <table class="table">
      <thead><tr><th>Stage</th><th>Reason</th><th>Action</th></tr></thead>
      <tbody>
        <tr>
          <td>Shortlisting</td>
          <td>Lacking domain expertise</td>
          <td><button class="primary" data-revert>Revert</button></td>
        </tr>
      </tbody>
    </table>
  `;

  panel.querySelector('[data-revert]').addEventListener('click', async () => {
    await apiRequest('ADMIN_REVERT', { candidateId: 'C1001' });
    alert('Candidate reverted from rejection log');
  });

  return panel;
}

export function loadAdminModule() {
  const container = document.createElement('div');
  container.className = 'stack';
  container.appendChild(renderPermissions());
  container.appendChild(renderRejectionLog());
  return container;
}
