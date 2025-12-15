/**
 * Google Apps Script backend for ATS / HRMS
 * Single-entry doPost router with action-based handlers.
 */

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const { action, data, token } = payload;
  const user = verifyToken(token);
  if (!user) {
    return jsonError("Invalid token");
  }

  switch (action) {
    case "RAISE_REQUIREMENT":
      return jsonSuccess(raiseRequirement(data, user));
    case "APPROVE_REQUIREMENT":
      return jsonSuccess(approveRequirement(data, user));
    case "SEND_BACK_REQUIREMENT":
      return jsonSuccess(sendBackRequirement(data, user));
    case "ADD_CANDIDATE":
      return jsonSuccess(addCandidate(data, user));
    case "SHORTLIST_DECISION":
      return jsonSuccess(shortlistDecision(data, user));
    case "CALL_SCREENING":
      return jsonSuccess(callScreening(data, user));
    case "PRE_INTERVIEW_FEEDBACK":
      return jsonSuccess(preInterviewFeedback(data, user));
    case "GENERATE_TEST_LINK":
      return jsonSuccess(generateTestLink(data, user));
    case "SUBMIT_TEST":
      return jsonSuccess(submitTest(data, user));
    case "ADMIN_DECISION":
      return jsonSuccess(adminDecision(data, user));
    case "SCHEDULE_INTERVIEW":
      return jsonSuccess(scheduleInterview(data, user));
    case "FINAL_INTERVIEW":
      return jsonSuccess(finalInterview(data, user));
    case "UPDATE_PERMISSIONS":
      return jsonSuccess(updatePermissions(data, user));
    case "REJECTION_REVERT":
      return jsonSuccess(rejectionRevert(data, user));
    case "EXPORT_AUDIT":
      return jsonSuccess(exportAudit(data, user));
    default:
      return jsonError(`Invalid action: ${action}`);
  }
}

function verifyToken(token) {
  // TODO: integrate with Google Identity for production.
  if (!token) return null;
  return {
    id: "U123",
    name: "Rajesh",
    role: "HR",
    permissions: ["APPROVE_REQUIREMENT", "CALL_SCREENING", "PRE_INTERVIEW_FEEDBACK"],
  };
}

function ensurePermission(user, required) {
  if (!user.permissions || user.permissions.indexOf(required) === -1) {
    throw new Error(`Missing permission: ${required}`);
  }
}

function logAudit(entry) {
  // Append to AUDIT_LOG sheet with fields: id, from, to, who, time, remark.
  return entry;
}

function logRejection(entry) {
  // Append to REJECTION_LOG sheet with stage, reason, remark, and actor.
  return entry;
}

function raiseRequirement(data, user) {
  ensurePermission(user, "RAISE_REQUIREMENT");
  const row = { ...data, status: "PENDING_HR_REVIEW" };
  logAudit({ action: "RAISE_REQUIREMENT", user, to: row.status });
  return row;
}

function approveRequirement(data, user) {
  ensurePermission(user, "APPROVE_REQUIREMENT");
  const row = { id: data.requirementId, status: "APPROVED" };
  logAudit({ action: "APPROVE_REQUIREMENT", user, to: row.status });
  return row;
}

function sendBackRequirement(data, user) {
  ensurePermission(user, "APPROVE_REQUIREMENT");
  logRejection({ stage: "REQUIREMENT", reason: data.remark, user });
  return { id: data.requirementId, status: "NEED_CLARIFICATION" };
}

function addCandidate(data, user) {
  ensurePermission(user, "ADD_CANDIDATE");
  const status = data.isRelevant ? "SHORTLISTED" : "REJECTED";
  logAudit({ action: "ADD_CANDIDATE", user, to: status });
  if (status === "REJECTED") {
    logRejection({ stage: "SHORTLISTING", reason: data.remark, user });
  }
  return { status };
}

function shortlistDecision(data, user) {
  ensurePermission(user, "SHORTLIST_DECISION");
  const status = data.approved ? "ON_CALL" : "REJECTED";
  if (!data.approved) logRejection({ stage: "SHORTLISTING", reason: data.remark, user });
  logAudit({ action: "SHORTLIST_DECISION", user, to: status });
  return { status };
}

function callScreening(data, user) {
  ensurePermission(user, "CALL_SCREENING");
  const status = data.outcome === "CALL_DONE" ? "OWNER_REVIEW" : "CALL_RETRY";
  logAudit({ action: "CALL_SCREENING", user, to: status });
  return { status };
}

function preInterviewFeedback(data, user) {
  ensurePermission(user, "PRE_INTERVIEW_FEEDBACK");
  const overall = Math.round((data.communication + data.roleFit) / 2);
  const status = overall >= 6 ? "PRE_INTERVIEW_PASS" : "PRE_INTERVIEW_FAIL";
  if (status === "PRE_INTERVIEW_FAIL") {
    logRejection({ stage: "PRE_INTERVIEW", reason: data.remark, user });
  }
  logAudit({ action: "PRE_INTERVIEW_FEEDBACK", user, to: status });
  return { overall, status };
}

function generateTestLink(data, user) {
  ensurePermission(user, "GENERATE_TEST_LINK");
  const link = `https://tests.example.com/${data.candidateId}?token=${Date.now()}`;
  logAudit({ action: "GENERATE_TEST_LINK", user, to: "TEST_ASSIGNED" });
  return { link, expiresInHours: 24 };
}

function submitTest(data, user) {
  ensurePermission(user, "SUBMIT_TEST");
  const status = data.score >= 6 ? "TEST_PASS" : "TEST_FAIL";
  logAudit({ action: "SUBMIT_TEST", user, to: status });
  if (status === "TEST_FAIL") {
    logRejection({ stage: "TEST", reason: "AUTO_GRADE_FAIL", user });
  }
  return { status };
}

function adminDecision(data, user) {
  ensurePermission(user, "ADMIN_DECISION");
  logAudit({ action: "ADMIN_DECISION", user, to: data.status });
  if (data.status === "REJECTED") {
    logRejection({ stage: "ADMIN", reason: data.remark, user });
  }
  return { status: data.status };
}

function scheduleInterview(data, user) {
  ensurePermission(user, "SCHEDULE_INTERVIEW");
  logAudit({ action: "SCHEDULE_INTERVIEW", user, to: "INTERVIEW_SCHEDULE" });
  return { scheduledAt: data.dateTime };
}

function finalInterview(data, user) {
  ensurePermission(user, "FINAL_INTERVIEW");
  logAudit({ action: "FINAL_INTERVIEW", user, to: data.status });
  if (data.status === "REJECTED") logRejection({ stage: "FINAL", reason: data.remark, user });
  return { status: data.status };
}

function updatePermissions(data, user) {
  ensurePermission(user, "UPDATE_PERMISSIONS");
  logAudit({ action: "UPDATE_PERMISSIONS", user, to: "PERMISSIONS_UPDATED" });
  return { role: data.role, permissions: data.permissions };
}

function rejectionRevert(data, user) {
  ensurePermission(user, "ADMIN_DECISION");
  logAudit({ action: "REJECTION_REVERT", user, to: data.previousStatus });
  return { status: data.previousStatus };
}

function exportAudit(_data, user) {
  ensurePermission(user, "ADMIN_DECISION");
  return { exported: true };
}

function jsonSuccess(payload) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, data: payload })
  ).setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, error: message })
  ).setMimeType(ContentService.MimeType.JSON);
}
