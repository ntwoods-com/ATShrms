export const state = {
  user: null,
  sessionToken: localStorage.getItem("hrms_sessionToken") || ""
};

export function setSession(sessionToken, user) {
  state.sessionToken = sessionToken || "";
  state.user = user || null;
  if (sessionToken) localStorage.setItem("hrms_sessionToken", sessionToken);
  else localStorage.removeItem("hrms_sessionToken");
}

export function clearSession() {
  setSession("", null);
}
