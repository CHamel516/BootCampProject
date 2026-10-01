import Commitment from "../models/Commitment.js";
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

export async function listCommitments(userId) {
  return Commitment.find({ userId }).sort({ dayOfWeek: 1, startTime: 1 });
}

export async function getCommitment(userId, id) {
  assertValidId(id);
  const c = await Commitment.findOne({ _id: id, userId });
  if (!c) throw new HttpError(404, "Commitment not found");
  return c;
}

export async function createCommitment(userId, { title, dayOfWeek, startTime, endTime }) {
  const cleanTitle = requireTitle(title);
  assertDayOfWeek(dayOfWeek);
  assertTime(startTime, "startTime");
  assertTime(endTime, "endTime");
  assertTimeRange(startTime, endTime);
  return Commitment.create({ userId, title: cleanTitle, dayOfWeek, startTime, endTime });
}

export async function updateCommitment(userId, id, patch) {
  assertValidId(id);
  const updates = {};
  if (patch.title !== undefined) updates.title = requireTitle(patch.title);
  if (patch.dayOfWeek !== undefined) {
    assertDayOfWeek(patch.dayOfWeek);
    updates.dayOfWeek = patch.dayOfWeek;
  }
  if (patch.startTime !== undefined) {
    assertTime(patch.startTime, "startTime");
    updates.startTime = patch.startTime;
  }
  if (patch.endTime !== undefined) {
    assertTime(patch.endTime, "endTime");
    updates.endTime = patch.endTime;
  }

  if (updates.startTime !== undefined || updates.endTime !== undefined) {
    const existing = await Commitment.findOne({ _id: id, userId });
    if (!existing) throw new HttpError(404, "Commitment not found");
    const start = updates.startTime ?? existing.startTime;
    const end = updates.endTime ?? existing.endTime;
    assertTimeRange(start, end);
  }

  const c = await Commitment.findOneAndUpdate({ _id: id, userId }, updates, {
    new: true,
    runValidators: true,
  });
  if (!c) throw new HttpError(404, "Commitment not found");
  return c;
}

export async function deleteCommitment(userId, id) {
  assertValidId(id);
  const c = await Commitment.findOneAndDelete({ _id: id, userId });
  if (!c) throw new HttpError(404, "Commitment not found");
  return c;
}
