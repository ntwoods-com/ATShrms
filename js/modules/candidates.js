import { apiRequest } from '../api.js';

function renderUpload() {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Add / Bulk Candidate</h1>
      <span class="badge">HR</span>
    </div>
    <p class="notice">Filename format: Name_Mobile_Source.pdf. Backend parses and enforces naming.</p>
    <form class="form" id="candidate-upload">
      <label>Upload CVs
        <input type="file" name="cvs" accept="application/pdf" multiple required />
      </label>
      <div class="action-row">
        <button class="primary" type="submit">Preview & Create</button>
      </div>
    </form>
  `;

  panel.querySelector('#candidate-upload').addEventListener('submit', async (e) => {
    e.preventDefault();
    alert('Frontend previews selected files. Backend parses and creates candidates.');
    await apiRequest('ADD_CANDIDATE', { requirementId: 'R101', files: [] });
  });

  return panel;
}

function renderShortlisting() {
  const panel = document.createElement('section');
  panel.className = 'panel stack';
  panel.innerHTML = `
    <div class="section-title">
      <h1>Shortlisting</h1>
      <span class="badge">HR</span>
    </div>
    <table class="table">
      <thead><tr><th>Candidate</th><th>Stage</th><th>Actions</th></tr></thead>
      <tbody>
        <tr>
          <td>Riya Singh</td>
          <td><span class="status-pill warning">Review Pending</span></td>
          <td class="action-row">
            <button class="primary" data-action="approve">Approve → On-Call</button>
            <button class="danger" data-action="reject">Reject</button>
          </td>
        </tr>
      </tbody>
    </table>
  `;

  panel.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action === 'approve' ? 'SHORTLIST_DECISION' : 'SHORTLIST_REJECT';
      await apiRequest(action, { candidateId: 'C1001' });
      alert(`Action ${action} submitted.`);
    });
  });

  return panel;
}

export function loadCandidatesModule() {
  const container = document.createElement('div');
  container.className = 'stack';
  container.appendChild(renderUpload());
  container.appendChild(renderShortlisting());
  return container;
}
