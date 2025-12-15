export const callsModule = {
  id: "calls",
  label: "On-Call Screening",
  description: "Structured call outcomes with scores and automatic routing to owner review.",
  badges: ["HR"],
  cards: [
    {
      title: "Call Outcomes",
      eyebrow: "Status",
      status: "OWNER_REVIEW",
      body: "Capture No Answer/Not Reachable/Reject with remark or scored call done result.",
      actions: [
        { label: "Call Done", action: "CALL_SCREENING" },
        { label: "Not Reachable", action: "CALL_SCREENING", intent: "secondary" },
      ],
    },
    {
      title: "Scores",
      eyebrow: "Communication & Experience",
      status: "RECORDED",
      body: "Numeric scores (0–10) drive subsequent owner decision routing.",
      actions: [
        { label: "Submit Scores", action: "CALL_SCREENING" },
      ],
    },
  ],
};
