const API_ENDPOINT = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

export const callApi = async (action, data = {}, token) => {
  const payload = {
    action,
    token,
    data,
  };

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};
