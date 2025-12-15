const SHEETS = {
  USERS: 'USERS',
  PERMISSIONS: 'PERMISSIONS',
  JOB_TEMPLATES: 'JOB_TEMPLATES',
  REQUIREMENTS: 'REQUIREMENTS',
  JOB_POSTINGS: 'JOB_POSTINGS',
  CANDIDATES: 'CANDIDATES',
  CALL_LOGS: 'CALL_LOGS',
  INTERVIEWS: 'INTERVIEWS',
  TESTS: 'TESTS',
  TEST_RESULTS: 'TEST_RESULTS',
  DOCUMENTS: 'DOCUMENTS',
  REJECTION_LOG: 'REJECTION_LOG',
  AUDIT_LOG: 'AUDIT_LOG',
};

function doPost(e) {
  const { action, token, data } = JSON.parse(e.postData.contents);
  const user = verifyToken(token);
  if (!user) return jsonError('Unauthorized');

  try {
    switch (action) {
      case 'RAISE_REQUIREMENT':
        return jsonOk(raiseRequirement(user, data));
      case 'APPROVE_REQUIREMENT':
        return jsonOk(approveRequirement(user, data));
      case 'SEND_BACK_REQUIREMENT':
        return jsonOk(sendBackRequirement(user, data));
      case 'ADD_CANDIDATE':
        return jsonOk(addCandidate(user, data));
      case 'SHORTLIST_DECISION':
        return jsonOk(shortlistDecision(user, data));
      case 'SHORTLIST_REJECT':
        return jsonOk(rejectFromShortlist(user, data));
      case 'CALL_SCREENING':
        return jsonOk(callScreening(user, data));
      case 'PRE_INTERVIEW_FEEDBACK':
        return jsonOk(preInterviewFeedback(user, data));
      case 'GENERATE_TEST_LINK':
        return jsonOk(generateTestLink(user, data));
      case 'SUBMIT_TEST':
        return jsonOk(submitTest(user, data));
      case 'ADMIN_DECISION':
        return jsonOk(adminDecision(user, data));
      case 'ADMIN_UPDATE_PERMISSIONS':
        return jsonOk(updatePermissions(user, data));
      case 'ADMIN_REVERT':
        return jsonOk(revertFromRejection(user, data));
      case 'SCHEDULE_INTERVIEW':
        return jsonOk(scheduleInterview(user, data));
      case 'ONBOARDING':
        return jsonOk(startOnboarding(user, data));
      case 'PROBATION_EVENT':
        return jsonOk(trackProbation(user, data));
      default:
        return jsonError('Invalid action');
    }
  } catch (err) {
    logAudit(user, action, 'ERROR', err.message);
    return jsonError(err.message);
  }
}

function verifyToken(token) {
  if (!token) return null;
  // TODO: implement Google token verification. Stub returns HR.
  return { id: 'U123', name: 'Rajesh', role: 'HR', permissions: ['CALL_SCREENING'] };
}

function raiseRequirement(user, data) {
  ensurePermission(user, 'RAISE_REQUIREMENT');
  // Append to REQUIREMENTS sheet with status PENDING_HR_REVIEW
  logAudit(user, 'RAISE_REQUIREMENT', 'PENDING_HR_REVIEW');
  return { status: 'PENDING_HR_REVIEW' };
}

function approveRequirement(user, data) {
  ensurePermission(user, 'REQUIREMENT_APPROVE');
  logAudit(user, 'APPROVE_REQUIREMENT', 'APPROVED');
  return { status: 'APPROVED' };
}

function sendBackRequirement(user, data) {
  ensurePermission(user, 'REQUIREMENT_APPROVE');
  if (!data.remark) throw new Error('Remark required');
  logAudit(user, 'SEND_BACK_REQUIREMENT', 'NEED_CLARIFICATION', data.remark);
  return { status: 'NEED_CLARIFICATION' };
}

function addCandidate(user, data) {
  ensurePermission(user, 'ADD_CANDIDATE');
  logAudit(user, 'ADD_CANDIDATE', 'SHORTLISTED');
  return { status: 'SHORTLISTED' };
}

function shortlistDecision(user, data) {
  ensurePermission(user, 'CALL_SCREENING');
  logAudit(user, 'SHORTLIST_DECISION', 'ON_CALL');
  return { status: 'ON_CALL' };
}

function rejectFromShortlist(user, data) {
  ensurePermission(user, 'CALL_SCREENING');
  logRejection('SHORTLISTING', data.candidateId, data.remark || '');
  return { status: 'REJECTED' };
}

function callScreening(user, data) {
  ensurePermission(user, 'CALL_SCREENING');
  logAudit(user, 'CALL_SCREENING', data.outcome, data.remark);
  const status = data.outcome === 'CALL_DONE' ? data.nextStatus || 'OWNER_REVIEW' : 'CALL_RETRY';
  return { status };
}

function preInterviewFeedback(user, data) {
  ensurePermission(user, 'PRE_INTERVIEW_FEEDBACK');
  const status = data.status;
  logAudit(user, 'PRE_INTERVIEW_FEEDBACK', status, data.overall);
  if (status === 'PRE_INTERVIEW_FAIL' && data.sendToAdmin) {
    logRejection('PRE_INTERVIEW', data.candidateId, 'Admin review');
  }
  return { status };
}

function generateTestLink(user, data) {
  ensurePermission(user, 'GENERATE_TEST_LINK');
  logAudit(user, 'GENERATE_TEST_LINK', 'TEST_ASSIGNED', data.tests.join(','));
  return { testUrl: 'https://example.com/token', expiresInHours: 24 };
}

function submitTest(user, data) {
  logAudit(user, 'SUBMIT_TEST', data.result >= 60 ? 'TEST_PASS' : 'TEST_FAIL');
  return { status: data.result >= 60 ? 'TEST_PASS' : 'TEST_FAIL' };
}

function adminDecision(user, data) {
  ensureRole(user, 'ADMIN', 'OWNER');
  logAudit(user, 'ADMIN_DECISION', data.decision, data.remark);
  return { status: data.decision };
}

function scheduleInterview(user, data) {
  ensurePermission(user, 'SCHEDULE_INTERVIEW');
  logAudit(user, 'SCHEDULE_INTERVIEW', 'INTERVIEW_SCHEDULE', `${data.date} ${data.time}`);
  return { status: 'INTERVIEW_SCHEDULE' };
}

function startOnboarding(user, data) {
  ensurePermission(user, 'ONBOARDING');
  logAudit(user, 'ONBOARDING', 'ONBOARDING_START', data.joiningDate);
  return { status: 'ONBOARDING' };
}

function trackProbation(user, data) {
  ensurePermission(user, 'ONBOARDING');
  logAudit(user, 'PROBATION_EVENT', data.event, data.candidateId);
  return { status: 'ACKNOWLEDGED' };
}

function updatePermissions(user, data) {
  ensureRole(user, 'ADMIN');
  logAudit(user, 'ADMIN_UPDATE_PERMISSIONS', 'UPDATED', data.userId);
  return { success: true };
}

function revertFromRejection(user, data) {
  ensureRole(user, 'ADMIN');
  logAudit(user, 'ADMIN_REVERT', 'REVERTED', data.candidateId);
  return { status: 'REVERTED' };
}

function ensurePermission(user, permission) {
  if (user.role === 'ADMIN') return;
  if (!user.permissions || user.permissions.indexOf(permission) === -1) {
    throw new Error('Forbidden');
  }
}

function ensureRole(user, ...roles) {
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
}

function logAudit(user, action, status, remark) {
  // Append to AUDIT_LOG with user.id, action, status, remark, timestamp.
}

function logRejection(stage, candidateId, reason) {
  // Append to REJECTION_LOG with revert capability.
}

function jsonOk(payload) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, ...payload })).setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, message })).setMimeType(ContentService.MimeType.JSON);
}
