const listeners = new Set();

const initialState = {
  user: null,
  view: 'dashboard',
  requirementTemplates: [],
};

let currentState = { ...initialState };

function notify() {
  listeners.forEach((fn) => fn({ ...currentState }));
}

export const state = {
  get: () => currentState,
  subscribe: (fn) => {
    listeners.add(fn);
    fn({ ...currentState });
    return () => listeners.delete(fn);
  },
  setUser: (user) => {
    currentState = { ...currentState, user };
    notify();
  },
  clearUser: () => {
    currentState = { ...currentState, user: null };
    notify();
  },
  setTemplates: (templates) => {
    currentState = { ...currentState, requirementTemplates: templates };
    notify();
  },
  setView: (view) => {
    currentState = { ...currentState, view };
    notify();
  },
};
