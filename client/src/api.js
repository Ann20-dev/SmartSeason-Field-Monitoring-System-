const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("smartseason_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(payload.message || "Request failed.");
  }

  return response.json();
}

export const api = {
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: () => request("/auth/me"),
  getFields: () => request("/fields"),
  getDashboard: () => request("/dashboard/summary"),
  getAgents: () => request("/users/agents"),
  getUpdates: (fieldId) => request(`/fields/${fieldId}/updates`),
  createField: (payload) =>
    request("/fields", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateField: (fieldId, payload) =>
    request(`/fields/${fieldId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  addUpdate: (fieldId, payload) =>
    request(`/fields/${fieldId}/updates`, {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
