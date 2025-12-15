/**
 * Google Apps Script backend for ATS/HRMS
 * Single entry point doPost(e) with switch-case router.
 */
function doPost(e) {
  const { action, token, data } = parsePayload(e);
  const user = verifyToken(token);
  if (!user) return errorResponse("Invalid token");

  const ctx = { user, data };
  switch (action) {
    case "RAISE_REQUIREMENT":
      return raiseRequirement(ctx);
    case "APPROVE_REQUIREMENT":
      return approveRequirement(ctx);
    case "SEND_BACK_REQUIREMENT":
      return sendBackRequirement(ctx);
    case "JOB_POSTING":
      return markJobPosted(ctx);
    case "ADD_CANDIDATE":
      return addCandidate(ctx);
    case "SHORTLIST_DECISION":
      return shortlistDecision(ctx);
    case "CALL_SCREENING":
      return callScreening(ctx);
    case "PRE_INTERVIEW_FEEDBACK":
      return preInterviewFeedback(ctx);
    case "GENERATE_TEST_LINK":
      return generateTestLink(ctx);
    case "SUBMIT_TEST":
      return submitTest(ctx);
    case "ADMIN_DECISION":
      return adminDecision(ctx);
    case "INTERVIEW_SCHEDULE":
      return scheduleInterview(ctx);
    default:
      return errorResponse("Invalid action");
  }
}

function parsePayload(e) {
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return {};
  }
}

function verifyToken(token) {
  // TODO: integrate with Google Identity / Directory; returning mock user for now.
  if (!token) return null;
  return { id: "U123", role: "HR", permissions: ["*"] };
}

function withAudit(entry) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("AUDIT_LOG");
  const now = new Date();
  sheet.appendRow([entry.action, entry.from || "", entry.to || "", entry.user?.id, entry.remark || "", now]);
}

function okResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message) {
  return okResponse({ error: message });
}

// ==== Requirement ====
function raiseRequirement({ user, data }) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("REQUIREMENTS");
  const id = `R${sheet.getLastRow() + 100}`;
  const row = [id, "PENDING_HR_REVIEW", new Date(), new Date(), data.jobRole, data.locations?.join(","), data.salaryBand, data.experience, data.jd];
  sheet.appendRow(row);
  withAudit({ action: "RAISE_REQUIREMENT", user });
  return okResponse({ requirement: { id, status: "PENDING_HR_REVIEW" } });
}

function approveRequirement({ user, data }) {
  updateStatus("REQUIREMENTS", data.requirementId, "APPROVED");
  withAudit({ action: "APPROVE_REQUIREMENT", user });
  return okResponse({ status: "APPROVED" });
}

function sendBackRequirement({ user, data }) {
  updateStatus("REQUIREMENTS", data.requirementId, "NEED_CLARIFICATION", data.remark);
  withAudit({ action: "SEND_BACK_REQUIREMENT", user, remark: data.remark });
  return okResponse({ status: "NEED_CLARIFICATION" });
}

function markJobPosted({ user, data }) {
  updateStatus("JOB_POSTINGS", data.requirementId, "POSTED");
  withAudit({ action: "JOB_POSTING", user });
  return okResponse({ status: "POSTED" });
}

// ==== Candidate Funnel ====
function addCandidate({ user, data }) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("CANDIDATES");
  const id = `C${sheet.getLastRow() + 100}`;
  sheet.appendRow([id, "SHORTLISTED", new Date(), new Date(), data.name, data.mobile, data.source]);
  withAudit({ action: "ADD_CANDIDATE", user });
  return okResponse({ id, status: "SHORTLISTED" });
}

function shortlistDecision({ user, data }) {
  const status = data.action === "REJECT" ? "REJECTED" : "ON_CALL";
  updateStatus("CANDIDATES", data.id, status, data.remark);
  if (status === "REJECTED") logRejection("Shortlisting", data);
  withAudit({ action: "SHORTLIST_DECISION", user, remark: data.remark });
  return okResponse({ status });
}

function callScreening({ user, data }) {
  const status = data.status === "OWNER_REVIEW" ? "OWNER_REVIEW" : data.status === "REJECTED" ? "REJECTED" : "ON_CALL";
  updateStatus("CALL_LOGS", data.id, status, data.remark, data.communication, data.experience);
  if (status === "REJECTED") logRejection("Call Screening", data);
  withAudit({ action: "CALL_SCREENING", user, remark: data.remark });
  return okResponse({ status });
}

function preInterviewFeedback({ user, data }) {
  const status = data.overall >= 6 ? "PRE_INTERVIEW_PASS" : "PRE_INTERVIEW_FAIL";
  updateStatus("INTERVIEWS", data.id, status, data.remark, data.communication, data.roleFit, data.overall);
  if (status === "PRE_INTERVIEW_FAIL") logRejection("Pre-Interview", data);
  withAudit({ action: "PRE_INTERVIEW_FEEDBACK", user, remark: data.remark });
  return okResponse({ status });
}

function generateTestLink({ user, data }) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("TESTS");
  const token = Utilities.getUuid();
  sheet.appendRow([data.id, token, data.role, data.tests?.join(","), new Date(), "TEST_ASSIGNED"]);
  withAudit({ action: "GENERATE_TEST_LINK", user });
  return okResponse({ token });
}

function submitTest({ user, data }) {
  const status = data.overall >= 6 ? "READY_FOR_FINAL" : "TEST_FAIL";
  updateStatus("TEST_RESULTS", data.id, status, data.overall, data.tally, data.excel, data.voice);
  if (status === "TEST_FAIL") logRejection("Tests", data);
  withAudit({ action: "SUBMIT_TEST", user });
  return okResponse({ status });
}

function adminDecision({ user, data }) {
  const status = data.decision === "REVERT" ? "OWNER_REVIEW" : data.decision === "REJECT" ? "REJECTED" : data.status || "UPDATED";
  updateStatus("CANDIDATES", data.id, status, data.remark, data.overrideMarks);
  if (status === "REJECTED") logRejection("Admin", data);
  withAudit({ action: "ADMIN_DECISION", user, remark: data.remark });
  return okResponse({ status });
}

function scheduleInterview({ user, data }) {
  updateStatus("INTERVIEWS", data.id, "INTERVIEW_SCHEDULE", `${data.date} ${data.time}`);
  withAudit({ action: "INTERVIEW_SCHEDULE", user });
  return okResponse({ status: "INTERVIEW_SCHEDULE" });
}

// ==== Helpers ====
function updateStatus(sheetName, id, status, remark, extra1, extra2, extra3) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  const header = rows.shift();
  const idIndex = header.indexOf("id");
  const statusIndex = header.indexOf("status");
  let rowIndex = -1;
  rows.forEach((r, idx) => {
    if (r[idIndex] === id) rowIndex = idx + 2; // offset header
  });
  if (rowIndex === -1) return;
  sheet.getRange(rowIndex, statusIndex + 1).setValue(status);
  sheet.getRange(rowIndex, statusIndex + 2).setValue(new Date());
  if (remark) sheet.getRange(rowIndex, statusIndex + 3).setValue(remark);
  if (extra1) sheet.getRange(rowIndex, statusIndex + 4).setValue(extra1);
  if (extra2) sheet.getRange(rowIndex, statusIndex + 5).setValue(extra2);
  if (extra3) sheet.getRange(rowIndex, statusIndex + 6).setValue(extra3);
}

function logRejection(stage, data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("REJECTION_LOG");
  sheet.appendRow([data.id, stage, data.remark, new Date()]);
}
