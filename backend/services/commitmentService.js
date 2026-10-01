import mongoose from "mongoose";
import Commitment from "../models/Commitment.js";
import { HttpError } from "../utils/httpError.js";
import {
  assertValidId,
  assertDayOfWeek,
  assertDaysOfWeek,
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

export async function createCommitment(
  userId,
  { title, dayOfWeek, daysOfWeek, startTime, endTime }
) {
  const cleanTitle = requireTitle(title);
  assertTime(startTime, "startTime");
  assertTime(endTime, "endTime");
  assertTimeRange(startTime, endTime);

  if (daysOfWeek !== undefined) {
    assertDaysOfWeek(daysOfWeek);
    const seriesId = new mongoose.Types.ObjectId();
    const docs = daysOfWeek.map((d) => ({
      userId,
      title: cleanTitle,
      dayOfWeek: d,
      startTime,
      endTime,
      seriesId,
    }));
    return Commitment.insertMany(docs);
  }

  assertDayOfWeek(dayOfWeek);
  return Commitment.create({
    userId,
    title: cleanTitle,
    dayOfWeek,
    startTime,
    endTime,
  });
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

// Pure helper — exported for direct testing.
export function diffSeriesDays(existingDays, desiredDays) {
  const existing = new Set(existingDays);
  const desired = new Set(desiredDays);
  const toAdd = [...desired].filter((d) => !existing.has(d));
  const toRemove = [...existing].filter((d) => !desired.has(d));
  const toKeep = [...desired].filter((d) => existing.has(d));
  return { toAdd, toRemove, toKeep };
}

export async function updateSeries(userId, seriesId, patch) {
  assertValidId(seriesId);
  const existing = await Commitment.find({ userId, seriesId });
  if (existing.length === 0) {
    throw new HttpError(404, "Series not found");
  }

  const first = existing[0];
  const nextTitle =
    patch.title !== undefined ? requireTitle(patch.title) : first.title;
  const nextStart =
    patch.startTime !== undefined ? patch.startTime : first.startTime;
  const nextEnd = patch.endTime !== undefined ? patch.endTime : first.endTime;

  if (patch.startTime !== undefined) assertTime(patch.startTime, "startTime");
  if (patch.endTime !== undefined) assertTime(patch.endTime, "endTime");
  assertTimeRange(nextStart, nextEnd);

  let desiredDays;
  if (patch.daysOfWeek !== undefined) {
    assertDaysOfWeek(patch.daysOfWeek);
    desiredDays = [...patch.daysOfWeek];
  } else {
    desiredDays = existing.map((c) => c.dayOfWeek);
  }

  const { toAdd, toRemove } = diffSeriesDays(
    existing.map((c) => c.dayOfWeek),
    desiredDays
  );

  if (toRemove.length) {
    await Commitment.deleteMany({
      userId,
      seriesId,
      dayOfWeek: { $in: toRemove },
    });
  }

  await Commitment.updateMany(
    { userId, seriesId },
    { title: nextTitle, startTime: nextStart, endTime: nextEnd }
  );

  if (toAdd.length) {
    await Commitment.insertMany(
      toAdd.map((d) => ({
        userId,
        seriesId,
        title: nextTitle,
        dayOfWeek: d,
        startTime: nextStart,
        endTime: nextEnd,
      }))
    );
  }

  return Commitment.find({ userId, seriesId }).sort({ dayOfWeek: 1 });
}

export async function deleteSeries(userId, seriesId) {
  assertValidId(seriesId);
  const result = await Commitment.deleteMany({ userId, seriesId });
  if (result.deletedCount === 0) {
    throw new HttpError(404, "Series not found");
  }
  return { deletedCount: result.deletedCount };
}
