import mongoose from "mongoose";
import { HttpError } from "./httpError.js";
import { isValidTime, timeToMinutes } from "./time.js";

export function assertValidId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, "Invalid id");
  }
}

export function assertDayOfWeek(day, field = "dayOfWeek") {
  if (!Number.isInteger(day) || day < 0 || day > 6) {
    throw new HttpError(400, `${field} must be an integer 0-6`);
  }
}

export function assertDaysOfWeek(days, field = "daysOfWeek") {
  if (!Array.isArray(days) || days.length === 0) {
    throw new HttpError(400, `${field} must be a non-empty array`);
  }
  const seen = new Set();
  for (const d of days) {
    if (!Number.isInteger(d) || d < 0 || d > 6) {
      throw new HttpError(400, `${field} values must be integers 0-6`);
    }
    if (seen.has(d)) {
      throw new HttpError(400, `${field} must not contain duplicates`);
    }
    seen.add(d);
  }
}

export function assertTime(value, field) {
  if (!isValidTime(value)) {
    throw new HttpError(400, `${field} must be in HH:MM format`);
  }
}

export function assertTimeRange(startTime, endTime) {
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    throw new HttpError(400, "endTime must be after startTime");
  }
}
