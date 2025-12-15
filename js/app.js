import { initAuth } from './auth.js';
import { initRouter } from './ui-router.js';
import { loadRequirementsModule } from './modules/requirements.js';
import { loadCandidatesModule } from './modules/candidates.js';
import { loadCallsModule } from './modules/calls.js';
import { loadInterviewsModule } from './modules/interviews.js';
import { loadTestsModule } from './modules/tests.js';
import { loadAdminModule } from './modules/admin.js';
import { loadOnboardingModule } from './modules/onboarding.js';
import { state } from './state.js';

const viewRegistry = {
  dashboard: () => {
    const template = document.getElementById('dashboard-view');
    return template.content.cloneNode(true);
  },
  requirements: loadRequirementsModule,
  candidates: loadCandidatesModule,
  calls: loadCallsModule,
  interviews: loadInterviewsModule,
  tests: loadTestsModule,
  admin: loadAdminModule,
  onboarding: loadOnboardingModule,
};

const appView = document.getElementById('app-view');

function renderView(view) {
  appView.innerHTML = '';
  const renderer = viewRegistry[view];
  if (!renderer) return;
  appView.appendChild(renderer());
}

function bindNav() {
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => renderView(btn.dataset.view));
  });
}

(function bootstrap() {
  renderView('dashboard');
  bindNav();
  initAuth();
  initRouter(renderView);
  state.subscribe((current) => {
    document.getElementById('user-name').textContent = current.user?.name ?? 'Guest';
    if (!current.user) {
      document.getElementById('auth-btn').textContent = 'Sign in with Google';
    } else {
      document.getElementById('auth-btn').textContent = 'Sign out';
    }
  });
})();
