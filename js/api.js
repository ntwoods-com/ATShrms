import { state } from './state.js';

const API_URL = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';

export async function apiRequest(action, data = {}) {
  const token = state.get().user?.token;
  const payload = { action, token, data };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Network error while calling backend');
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Backend error');
  }

  return json;
}
