import { setState } from "./state.js";

const roles = {
  ADMIN: ["*"],
  EA: ["RAISE_REQUIREMENT", "EDIT_TEMPLATE", "VIEW_WAITLIST"],
  HR: [
    "APPROVE_REQUIREMENT",
    "JOB_POSTING",
    "UPLOAD_CV",
    "SHORTLIST_DECISION",
    "CALL_SCREENING",
    "INTERVIEW_SCHEDULE",
    "PRE_INTERVIEW_FEEDBACK"
  ],
  OWNER: ["OWNER_DECISION", "FINAL_INTERVIEW"]
};

export function initAuth() {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  loginBtn.addEventListener("click", () => simulateGoogleLogin());
  logoutBtn.addEventListener("click", () => handleLogout());
}

function simulateGoogleLogin() {
  // Placeholder for real Google OAuth; the backend will validate token every call.
  const token = crypto.randomUUID();
  const user = {
    id: "U123",
    name: "Rajesh",
    role: "HR",
    permissions: roles.HR
  };
  setState({ session: { token, user } });
}

function handleLogout() {
  setState({ session: null });
}
