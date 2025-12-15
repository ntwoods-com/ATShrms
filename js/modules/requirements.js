export const requirementsModule = {
  id: "requirements",
  label: "Requirements",
  description: "EA raises roles, HR reviews and approves for posting.",
  badges: ["EA", "HR", "Owner"],
  cards: [
    {
      title: "Raise Requirement",
      eyebrow: "EA → HR",
      status: "PENDING_HR_REVIEW",
      body: "EA submits role using template-driven form; backend sets status and logs action.",
      actions: [
        { label: "Raise Requirement", action: "RAISE_REQUIREMENT" },
        { label: "Send Back", action: "SEND_BACK_REQUIREMENT", intent: "secondary" },
      ],
    },
    {
      title: "HR Review",
      eyebrow: "Approval",
      status: "APPROVED",
      body: "HR approves or sends back with mandatory remark before job posting unlocks.",
      actions: [
        { label: "Approve", action: "APPROVE_REQUIREMENT" },
        { label: "Need Clarification", action: "SEND_BACK_REQUIREMENT", intent: "secondary" },
      ],
    },
  ],
};
