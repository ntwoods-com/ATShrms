export const candidatesModule = {
  id: "candidates",
  label: "Candidates",
  description: "Bulk upload, shortlist, and log rejections with transparent audit trail.",
  badges: ["HR"],
  cards: [
    {
      title: "Upload & Parse",
      eyebrow: "Bulk CVs",
      status: "UPLOADED",
      body: "File names follow Name_Mobile_Source.pdf; backend parses, creates candidate rows, and audits action.",
      actions: [
        { label: "Add Candidate", action: "ADD_CANDIDATE" },
      ],
    },
    {
      title: "Shortlisting",
      eyebrow: "HR",
      status: "SHORTLISTED",
      body: "Preview CV relevance; non-fit candidates go to rejection log with stage context.",
      actions: [
        { label: "Approve", action: "SHORTLIST_DECISION" },
        { label: "Reject", action: "REJECTION_LOG", intent: "secondary" },
      ],
    },
  ],
};
