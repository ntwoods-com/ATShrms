import { api } from "../api.js";
import { State } from "../state.js";

export async function initRequirements() {
  // permissions based UI
  document.getElementById("btnRaiseReq").classList.toggle("hidden", !State.has("REQUIREMENT_RAISE"));
  document.getElementById("btnApproveReq").classList.toggle("hidden", !State.has("REQUIREMENT_APPROVE"));
  document.getElementById("btnSendBackReq").classList.toggle("hidden", !State.has("REQUIREMENT_SEND_BACK"));

  document.getElementById("btnRaiseReq").onclick = async () => {
    const data = readReqForm();
    const out = await api("RAISE_REQUIREMENT", data);
    alert("Raised: " + out.requirementId);
  };

  document.getElementById("btnApproveReq").onclick = async () => {
    const requirementId = getSelectedRequirementId();
    const remark = document.getElementById("remark").value || "";
    const out = await api("APPROVE_REQUIREMENT", { requirementId, remark });
    alert("Approved: " + out.requirementId);
  };

  document.getElementById("btnSendBackReq").onclick = async () => {
    const requirementId = getSelectedRequirementId();
    const remark = (document.getElementById("remark").value || "").trim();
    if (!remark) return alert("Remark mandatory");
    const out = await api("SEND_BACK_REQUIREMENT", { requirementId, remark });
    alert("Sent back: " + out.requirementId);
  };
}

function readReqForm() {
  return {
    templateId: document.getElementById("templateId").value,
    jobRole: document.getElementById("jobRole").value,
    dept: document.getElementById("dept").value,
    location: document.getElementById("location").value,
    headcount: document.getElementById("headcount").value,
    ctcRange: document.getElementById("ctcRange").value,
    notes: document.getElementById("notes").value,
  };
}
function getSelectedRequirementId(){ return document.getElementById("requirementId").value; }
