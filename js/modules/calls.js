import { apiRequest } from '../api.js';

const callOutcomes = ['NO_ANSWER', 'NOT_REACHABLE', 'REJECT', 'CALL_DONE'];

function renderCallPanel() {
  const panel = document.createElement('section');
  panel.className = 'panel stack';
  panel.innerHTML = `
    <div class="section-title">
      <h1>On-Call Screening</h1>
      <span class="badge">HR</span>
    </div>
    <div class="action-row">
      ${callOutcomes.map((outcome) => `<button data-outcome="${outcome}">${outcome.replaceAll('_', ' ')}</button>`).join('')}
    </div>
    <div class="form" id="call-done-fields" style="display:none;">
      <label>Communication (0-10)
        <input type="number" name="communication" min="0" max="10" />
      </label>
      <label>Experience (0-10)
        <input type="number" name="experience" min="0" max="10" />
      </label>
      <label>Recommend for Owner Review?
        <select name="recommend">
          <option value="OWNER_REVIEW">Yes</option>
          <option value="REJECT">Reject</option>
        </select>
      </label>
      <button class="primary" id="submit-call-done">Submit scores</button>
    </div>
  `;

  const callDoneFields = panel.querySelector('#call-done-fields');
  panel.querySelectorAll('[data-outcome]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const outcome = btn.dataset.outcome;
      if (outcome === 'CALL_DONE') {
        callDoneFields.style.display = 'grid';
        return;
      }
      await apiRequest('CALL_SCREENING', { candidateId: 'C1001', outcome });
      alert(`Call outcome submitted: ${outcome}`);
    });
  });

  panel.querySelector('#submit-call-done').addEventListener('click', async () => {
    const communication = Number(panel.querySelector('[name="communication"]').value);
    const experience = Number(panel.querySelector('[name="experience"]').value);
    const recommend = panel.querySelector('[name="recommend"]').value;
    await apiRequest('CALL_SCREENING', {
      candidateId: 'C1001',
      outcome: 'CALL_DONE',
      communication,
      experience,
      nextStatus: recommend,
    });
    alert('Scores recorded; moving to owner review.');
  });

  return panel;
}

export function loadCallsModule() {
  const container = document.createElement('div');
  container.className = 'stack';
  container.appendChild(renderCallPanel());
  return container;
}
