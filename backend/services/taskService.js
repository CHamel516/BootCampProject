import mongoose from "mongoose";
import Task from "../models/Task.js";
import Goal from "../models/Goal.js";
import { HttpError } from "../utils/httpError.js";
import {
  assertValidId,
  assertDayOfWeek,
  assertTime,
  assertTimeRange,
} from "../utils/validation.js";

function requireTitle(title) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new HttpError(400, "title is required");
  }
  return title.trim();
}

async function normalizeGoalId(userId, goalId) {
  if (goalId === undefined || goalId === null || goalId === "") return null;
  if (!mongoose.isValidObjectId(goalId)) {
    throw new HttpError(400, "Invalid goalId");
  }
  const exists = await Goal.exists({ _id: goalId, userId });
  if (!exists) throw new HttpError(400, "Goal not found for goalId");
  return goalId;
}

function normalizeScheduleFields(patch, updates) {
  if (patch.dayOfWeek !== undefined) {
    if (patch.dayOfWeek === null) updates.dayOfWeek = null;
    else {
      assertDayOfWeek(patch.dayOfWeek);
      updates.dayOfWeek = patch.dayOfWeek;
    }
  }
  if (patch.startTime !== undefined) {
    if (patch.startTime === null) updates.startTime = null;
    else {
      assertTime(patch.startTime, "startTime");
      updates.startTime = patch.startTime;
    }
  }
  if (patch.endTime !== undefined) {
    if (patch.endTime === null) updates.endTime = null;
    else {
      assertTime(patch.endTime, "endTime");
      updates.endTime = patch.endTime;
    }
  }
}

export async function listTasks(userId, filter = {}) {
  const q = { userId };
  if (filter.goalId) {
    if (!mongoose.isValidObjectId(filter.goalId)) {
      throw new HttpError(400, "Invalid goalId");
    }
    q.goalId = filter.goalId;
  }
  return Task.find(q).sort({ dayOfWeek: 1, startTime: 1, createdAt: 1 });
}

export async function getTask(userId, id) {
  assertValidId(id);
  const t = await Task.findOne({ _id: id, userId });
  if (!t) throw new HttpError(404, "Task not found");
  return t;
}

export async function createTask(userId, payload) {
  const doc = {
    userId,
    title: requireTitle(payload.title),
    completed: !!payload.completed,
    goalId: await normalizeGoalId(userId, payload.goalId),
    dayOfWeek: null,
    startTime: null,
    endTime: null,
    notes: typeof payload.notes === "string" ? payload.notes : "",
  };
  normalizeScheduleFields(payload, doc);
  if (doc.startTime && doc.endTime) assertTimeRange(doc.startTime, doc.endTime);
  return Task.create(doc);
}

export async function updateTask(userId, id, patch) {
  assertValidId(id);
  const updates = {};
  if (patch.title !== undefined) updates.title = requireTitle(patch.title);
  if (patch.completed !== undefined) updates.completed = !!patch.completed;
  if (patch.goalId !== undefined)
    updates.goalId = await normalizeGoalId(userId, patch.goalId);
  if (patch.notes !== undefined)
    updates.notes = typeof patch.notes === "string" ? patch.notes : "";
  normalizeScheduleFields(patch, updates);

  if (updates.startTime && updates.endTime) {
    assertTimeRange(updates.startTime, updates.endTime);
  } else if (updates.startTime || updates.endTime) {
    const existing = await Task.findOne({ _id: id, userId });
    if (!existing) throw new HttpError(404, "Task not found");
    const start = updates.startTime ?? existing.startTime;
    const end = updates.endTime ?? existing.endTime;
    if (start && end) assertTimeRange(start, end);
  }

  const t = await Task.findOneAndUpdate({ _id: id, userId }, updates, {
    new: true,
    runValidators: true,
  });
  if (!t) throw new HttpError(404, "Task not found");
  return t;
}

export async function deleteTask(userId, id) {
  assertValidId(id);
  const t = await Task.findOneAndDelete({ _id: id, userId });
  if (!t) throw new HttpError(404, "Task not found");
  return t;
}
