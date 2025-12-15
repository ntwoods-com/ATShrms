export const adminModule = {
  id: "admin",
  label: "Admin & Logs",
  description: "Permission governance, rejection log reversals, and full audit visibility.",
  badges: ["Admin", "Owner"],
  cards: [
    {
      title: "Permissions",
      eyebrow: "RBAC",
      status: "ACTIVE",
      body: "Manage role permissions; backend validates every request regardless of frontend visibility.",
      actions: [
        { label: "Update Permissions", action: "UPDATE_PERMISSIONS" },
      ],
    },
    {
      title: "Rejection Log",
      eyebrow: "Stage-aware",
      status: "REVERSIBLE",
      body: "Every reject stores stage + remark; admin can revert to prior stage with audit trail.",
      actions: [
        { label: "Revert Candidate", action: "REJECTION_REVERT" },
      ],
    },
    {
      title: "Audit Trail",
      eyebrow: "System-wide",
      status: "IMMUTABLE",
      body: "All actions recorded with from→to, who, when, and remark for compliance reporting.",
      actions: [
        { label: "Export Audit", action: "EXPORT_AUDIT" },
      ],
    },
  ],
};
