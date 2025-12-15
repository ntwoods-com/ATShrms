import { state } from './state.js';

const authBtn = document.getElementById('auth-btn');

function mockGoogleLogin() {
  // Placeholder for Google OAuth. Swap with real client integration.
  const demoUser = {
    id: 'U123',
    name: 'Rajesh',
    role: 'HR',
    permissions: ['REQUIREMENT_REVIEW', 'JOB_POSTING', 'CALL_SCREENING'],
    token: 'demo-session-token',
  };
  state.setUser(demoUser);
}

function signOut() {
  state.clearUser();
}

export function initAuth() {
  authBtn.addEventListener('click', () => {
    if (state.get().user) {
      signOut();
    } else {
      mockGoogleLogin();
    }
  });
}
