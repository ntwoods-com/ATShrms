const endpoint = "https://script.google.com/macros/s/DEPLOYMENT_ID/exec";

export async function callApi(action, token, data = {}) {
  const payload = { action, token, data };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    return { ok: false, message: `HTTP ${res.status}` };
  }

  const json = await res.json();
  if (json.error) {
    return { ok: false, message: json.error };
  }

  return { ok: true, data: json };
}

export function mockApi(action, data = {}) {
  // Used for offline demo; replace with callApi in production.
  const now = new Date().toISOString();
  switch (action) {
    case "RAISE_REQUIREMENT":
      return Promise.resolve({
        ok: true,
        data: {
          requirement: {
            id: "R101",
            status: "PENDING_HR_REVIEW",
            createdAt: now,
            updatedAt: now,
            ...data
          },
          message: "Requirement raised"
        }
      });
    default:
      return Promise.resolve({ ok: true, data: { message: "Action simulated" } });
  }
}
