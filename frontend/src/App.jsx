import { useEffect, useState } from "react";
import { api } from "./api.js";
import { auth } from "./auth.js";
import WeekCalendar from "./components/WeekCalendar.jsx";
import CommitmentPanel from "./components/CommitmentPanel.jsx";
import GoalForm from "./components/GoalForm.jsx";
import TodoList from "./components/TodoList.jsx";
import TipsCard from "./components/TipsCard.jsx";
import Login from "./components/Login.jsx";

export default function App() {
  const [user, setUser] = useState(() => auth.getUser());
  const [commitments, setCommitments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    function onLogout() {
      setUser(null);
    }
    window.addEventListener("kickstart:logout", onLogout);
    return () => window.removeEventListener("kickstart:logout", onLogout);
  }, []);

  async function loadAll() {
    try {
      setError("");
      const [c, g, t] = await Promise.all([
        api.listCommitments(),
        api.listGoals(),
        api.listTasks(),
      ]);
      setCommitments(c);
      setGoals(g);
      setTasks(t);
    } catch (err) {
      if (err.status !== 401) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadAll();
    }
  }, [user]);

  function handleAuth(result) {
    auth.save(result);
    setUser(result.user);
  }

  function handleLogout() {
    auth.clear();
    setUser(null);
    setCommitments([]);
    setGoals([]);
    setTasks([]);
    setTips([]);
  }

  if (!user) {
    return <Login onAuth={handleAuth} />;
  }

  async function handleCreateCommitment(body) {
    await api.createCommitment(body);
    await loadAll();
  }
  async function handleUpdateCommitment(id, body) {
    await api.updateCommitment(id, body);
    await loadAll();
  }
  async function handleDeleteCommitment(id) {
    await api.deleteCommitment(id);
    await loadAll();
  }

  async function handleCreateAndPlan(goalBody) {
    const goal = await api.createGoal(goalBody);
    const result = await api.planGoal(goal._id);
    setTips(result.tips || []);
    await loadAll();
  }

  async function handleToggleTask(task) {
    await api.updateTask(task._id, { completed: !task.completed });
    setTasks((prev) =>
      prev.map((t) =>
        t._id === task._id ? { ...t, completed: !task.completed } : t
      )
    );
  }

  async function handleUpdateTask(id, patch) {
    await api.updateTask(id, patch);
    await loadAll();
  }
  async function handleDeleteTask(id) {
    await api.deleteTask(id);
    await loadAll();
  }
  async function handleCreateTask(body) {
    await api.createTask(body);
    await loadAll();
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="bg-gradient-to-r from-brand-700 to-indigo-500 text-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kickstart</h1>
            <p className="text-brand-100 text-sm">
              Start something new without burning out.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-brand-100">
            <span>
              {loading
                ? "Loading…"
                : `${goals.length} goal${goals.length === 1 ? "" : "s"} · ${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
            </span>
            <span className="opacity-75">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="rounded border border-rose-300 bg-rose-50 text-rose-800 px-4 py-2 text-sm">
            Something went wrong: {error}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400">
              Loading your week…
            </div>
          ) : (
            <WeekCalendar
              commitments={commitments}
              tasks={tasks}
              goals={goals}
              onToggleTask={handleToggleTask}
            />
          )}
          <TodoList
            tasks={tasks}
            goals={goals}
            onToggle={handleToggleTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            onCreate={handleCreateTask}
          />
        </div>

        <div className="space-y-6">
          <GoalForm onCreateAndPlan={handleCreateAndPlan} />
          <TipsCard tips={tips} />
          <CommitmentPanel
            commitments={commitments}
            onCreate={handleCreateCommitment}
            onUpdate={handleUpdateCommitment}
            onDelete={handleDeleteCommitment}
          />
        </div>
      </main>
    </div>
  );
}
