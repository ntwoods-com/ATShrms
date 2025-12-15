import { state } from './state.js';

export function initRouter(renderView) {
  state.subscribe((snapshot) => {
    renderView(snapshot.view);
  });

  window.addEventListener('hashchange', () => {
    const view = location.hash.replace('#', '') || 'dashboard';
    state.setView(view);
  });

  const initialView = location.hash.replace('#', '') || 'dashboard';
  state.setView(initialView);
}
