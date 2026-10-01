import { auth } from "./auth.js";

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(path, opts);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON reply (e.g. a hosting 404 page) — the API isn't reachable.
      const err = new Error(
        `Can't reach the Kickstart API (HTTP ${res.status}). Is the backend running/deployed?`
      );
      err.status = res.status;
      throw err;
    }
  }

  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    auth.clear();
    window.dispatchEvent(new Event("kickstart:logout"));
  }

  if (!res.ok) {
    const message = (data && data.error) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (body) => request("POST", "/api/auth/register", body),
  login: (body) => request("POST", "/api/auth/login", body),

  listCommitments: () => request("GET", "/api/commitments"),
  createCommitment: (body) => request("POST", "/api/commitments", body),
  updateCommitment: (id, body) => request("PUT", `/api/commitments/${id}`, body),
  deleteCommitment: (id) => request("DELETE", `/api/commitments/${id}`),
  updateCommitmentSeries: (seriesId, body) =>
    request("PUT", `/api/commitments/series/${seriesId}`, body),
  deleteCommitmentSeries: (seriesId) =>
    request("DELETE", `/api/commitments/series/${seriesId}`),

  listGoals: () => request("GET", "/api/goals"),
  createGoal: (body) => request("POST", "/api/goals", body),
  updateGoal: (id, body) => request("PUT", `/api/goals/${id}`, body),
  deleteGoal: (id) => request("DELETE", `/api/goals/${id}`),
  planGoal: (id) => request("POST", `/api/goals/${id}/plan`),

  listTasks: () => request("GET", "/api/tasks"),
  createTask: (body) => request("POST", "/api/tasks", body),
  updateTask: (id, body) => request("PUT", `/api/tasks/${id}`, body),
  deleteTask: (id) => request("DELETE", `/api/tasks/${id}`),
};
