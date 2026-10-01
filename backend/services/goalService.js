import Goal from "../models/Goal.js";
import Task from "../models/Task.js";
import { HttpError } from "../utils/httpError.js";
import { assertValidId } from "../utils/validation.js";

const PREFERRED = ["morning", "afternoon", "evening", "any"];

function requireTitle(title) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new HttpError(400, "title is required");
  }
  return title.trim();
}

function requireHours(hours) {
  const n = Number(hours);
  if (!Number.isFinite(n) || n <= 0) {
    throw new HttpError(400, "hoursPerWeek must be a positive number");
  }
  return n;
}

function requireSessionMinutes(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n < 5) {
    throw new HttpError(400, "sessionMinutes must be at least 5");
  }
  return n;
}

function requirePreferredTime(value) {
  if (!PREFERRED.includes(value)) {
    throw new HttpError(
      400,
      `preferredTime must be one of ${PREFERRED.join(", ")}`
    );
  }
  return value;
}

export async function listGoals(userId) {
  return Goal.find({ userId }).sort({ createdAt: -1 });
}

export async function getGoal(userId, id) {
  assertValidId(id);
  const g = await Goal.findOne({ _id: id, userId });
  if (!g) throw new HttpError(404, "Goal not found");
  return g;
}

export async function createGoal(userId, payload) {
  const doc = {
    userId,
    title: requireTitle(payload.title),
    hoursPerWeek: requireHours(payload.hoursPerWeek),
    sessionMinutes:
      payload.sessionMinutes !== undefined
        ? requireSessionMinutes(payload.sessionMinutes)
        : 45,
    preferredTime:
      payload.preferredTime !== undefined
        ? requirePreferredTime(payload.preferredTime)
        : "any",
    startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
  };
  return Goal.create(doc);
}

export async function updateGoal(userId, id, patch) {
  assertValidId(id);
  const updates = {};
  if (patch.title !== undefined) updates.title = requireTitle(patch.title);
  if (patch.hoursPerWeek !== undefined)
    updates.hoursPerWeek = requireHours(patch.hoursPerWeek);
  if (patch.sessionMinutes !== undefined)
    updates.sessionMinutes = requireSessionMinutes(patch.sessionMinutes);
  if (patch.preferredTime !== undefined)
    updates.preferredTime = requirePreferredTime(patch.preferredTime);
  if (patch.startDate !== undefined)
    updates.startDate = new Date(patch.startDate);

  const g = await Goal.findOneAndUpdate({ _id: id, userId }, updates, {
    new: true,
    runValidators: true,
  });
  if (!g) throw new HttpError(404, "Goal not found");
  return g;
}

export async function deleteGoal(userId, id) {
  assertValidId(id);
  const g = await Goal.findOneAndDelete({ _id: id, userId });
  if (!g) throw new HttpError(404, "Goal not found");
  await Task.deleteMany({ goalId: id, userId });
  return g;
}
