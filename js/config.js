export const statusMap = {
  REQUIREMENT: {
    NEW: { label: "Draft", tone: "warn" },
    PENDING_HR_REVIEW: { label: "Pending HR Review", tone: "warn" },
    NEED_CLARIFICATION: { label: "Need Clarification", tone: "warn" },
    APPROVED: { label: "Approved", tone: "" }
  },
  CANDIDATE: {
    SHORTLISTED: { label: "Shortlisted", tone: "" },
    REJECTED: { label: "Rejected", tone: "danger" },
    ON_CALL: { label: "On-Call", tone: "warn" },
    OWNER_REVIEW: { label: "Owner Review", tone: "warn" },
    INTERVIEW_SCHEDULE: { label: "Interview Scheduled", tone: "" },
    PRE_INTERVIEW_PASS: { label: "Pre-Interview Pass", tone: "" },
    PRE_INTERVIEW_FAIL: { label: "Pre-Interview Fail", tone: "danger" },
    TEST_ASSIGNED: { label: "Tests Assigned", tone: "" },
    TEST_FAIL: { label: "Test Fail", tone: "danger" },
    READY_FOR_FINAL: { label: "Ready for Final", tone: "" },
    SELECTED: { label: "Selected", tone: "" },
    ONBOARDING: { label: "Onboarding", tone: "" }
  }
};

export const moduleOrder = [
  { id: "requirements", label: "Requirements" },
  { id: "jobPosting", label: "Job Posting" },
  { id: "candidates", label: "Candidates" },
  { id: "calls", label: "Call Screening" },
  { id: "interviews", label: "Interviews & Walk-in" },
  { id: "tests", label: "Tests" },
  { id: "admin", label: "Admin" }
];

export const defaultRequirementTemplate = {
  jobRole: "Customer Care Executive",
  locations: ["Mumbai", "Remote"],
  salaryBand: "3 - 4.5 LPA",
  experience: "1 - 3 years",
  jd: "Handle inbound/outbound calls, maintain CRM hygiene, escalate blockers early."
};

export const scoringBands = {
  preInterviewPassMark: 6,
  communicationScale: { min: 0, max: 10 },
  experienceScale: { min: 0, max: 10 }
};
