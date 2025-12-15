export const interviewsModule = {
  id: "interviews",
  label: "Interviews & Walk-ins",
  description: "Owner decisions, scheduling, pre-interview feedback, and onboarding triggers.",
  badges: ["HR", "Owner", "Admin"],
  cards: [
    {
      title: "Owner Decision",
      eyebrow: "Post Call",
      status: "INTERVIEW_SCHEDULE",
      body: "Owner can approve for walk-in, hold, or reject with remark; audit log records transition.",
      actions: [
        { label: "Approve for Walk-in", action: "ADMIN_DECISION" },
        { label: "Hold", action: "ADMIN_DECISION", intent: "secondary" },
        { label: "Reject", action: "ADMIN_DECISION", intent: "secondary" },
      ],
    },
    {
      title: "Schedule",
      eyebrow: "HR",
      status: "SCHEDULED",
      body: "Set interview date/time/location; appearance captured on the day for downstream test generation.",
      actions: [
        { label: "Schedule", action: "SCHEDULE_INTERVIEW" },
      ],
    },
    {
      title: "Pre-Interview Feedback",
      eyebrow: "Critical Gate",
      status: "PRE_INTERVIEW_PASS / FAIL",
      body: "HR marks communication, role fit, and auto-calculated overall; <6 locks HR edits and goes to admin queue.",
      actions: [
        { label: "Submit Feedback", action: "PRE_INTERVIEW_FEEDBACK" },
        { label: "Send to Admin", action: "ADMIN_DECISION", intent: "secondary" },
      ],
    },
    {
      title: "Final Interview",
      eyebrow: "Owner",
      status: "SELECTED / HOLD / REJECTED",
      body: "Owner selects, holds, or rejects; selection triggers document upload and joining for onboarding.",
      actions: [
        { label: "Select", action: "FINAL_INTERVIEW" },
        { label: "Hold", action: "FINAL_INTERVIEW", intent: "secondary" },
        { label: "Reject", action: "FINAL_INTERVIEW", intent: "secondary" },
      ],
    },
  ],
};
