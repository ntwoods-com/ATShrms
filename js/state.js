export const state = {
  user: null,
  sessionToken: null,
  currentModule: "requirements",
};

export const setUser = (user, token) => {
  state.user = user;
  state.sessionToken = token;
};

export const setModule = (moduleId) => {
  state.currentModule = moduleId;
};
