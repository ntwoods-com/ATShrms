import { setUser } from "./state.js";

// Placeholder for Google OAuth integration.
// Replace with real OAuth flow on production GitHub Pages.
export const login = async () => {
  const mockUser = {
    id: "U123",
    name: "Rajesh",
    role: "HR",
    permissions: [
      "RAISE_REQUIREMENT",
      "APPROVE_REQUIREMENT",
      "JOB_POST",
      "CALL_SCREENING",
      "SHORTLIST_DECISION",
    ],
  };
  const mockToken = "demo-session-token";
  setUser(mockUser, mockToken);
  return { user: mockUser, token: mockToken };
};
