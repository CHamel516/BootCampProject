import { useState } from "react";
import { api } from "../api.js";

export default function Login({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ email, password });
      onAuth(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-brand-700 to-indigo-500 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Kickstart</h1>
          <p className="text-sm text-slate-500">
            Start something new without burning out.
          </p>
        </div>

        <div className="flex gap-2 mb-5 bg-slate-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${
              mode === "login" ? "bg-white shadow text-slate-900" : "text-slate-500"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${
              mode === "register" ? "bg-white shadow text-slate-900" : "text-slate-500"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Password {mode === "register" && "(min 8 chars)"}
            </label>
            <input
              type="password"
              required
              minLength={mode === "register" ? 8 : undefined}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            disabled={busy}
            className="w-full py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50 transition"
          >
            {busy ? "..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-xs text-slate-400 text-center">
          Demo account:{" "}
          <code className="text-slate-600">demo@kickstart.app / demo1234</code>
        </p>
      </div>
    </div>
  );
}
