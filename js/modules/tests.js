export const testsModule = {
  id: "tests",
  label: "Tests",
  description: "Auto-generated 24-hour test links with role-based stacks and admin overrides.",
  badges: ["HR", "Admin"],
  cards: [
    {
      title: "Generate Links",
      eyebrow: "Walk-in Appeared",
      status: "TEST_ASSIGNED",
      body: "Tokens are generated per candidate; stack auto-selects (Accounts → Tally+Excel, CRM/CCE → Excel+Voice).",
      actions: [
        { label: "Generate Test Link", action: "GENERATE_TEST_LINK" },
      ],
    },
    {
      title: "Auto Grading",
      eyebrow: "24-hour validity",
      status: "TEST_COMPLETED",
      body: "Backend grades submissions and locks HR editing; failed attempts go to admin queue for edit/resume/reject.",
      actions: [
        { label: "Submit Test", action: "SUBMIT_TEST" },
        { label: "Admin Decision", action: "ADMIN_DECISION", intent: "secondary" },
      ],
    },
  ],
};
