import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";
import Commitment from "../models/Commitment.js";
import {
  createCommitment,
  updateSeries,
  deleteSeries,
  diffSeriesDays,
} from "./commitmentService.js";

const USER_ID = new mongoose.Types.ObjectId();
const SERIES_ID = new mongoose.Types.ObjectId();

function fakeDoc({ dayOfWeek, title = "Calc 3", startTime = "07:00", endTime = "08:00" }) {
  return {
    _id: new mongoose.Types.ObjectId(),
    userId: USER_ID,
    seriesId: SERIES_ID,
    title,
    dayOfWeek,
    startTime,
    endTime,
  };
}

test("diffSeriesDays: computes add/remove/keep sets", () => {
  const { toAdd, toRemove, toKeep } = diffSeriesDays([1, 3, 5], [1, 2, 5]);
  assert.deepEqual(toAdd.sort(), [2]);
  assert.deepEqual(toRemove.sort(), [3]);
  assert.deepEqual(toKeep.sort(), [1, 5]);
});

test("diffSeriesDays: identical sets produce no changes", () => {
  const { toAdd, toRemove, toKeep } = diffSeriesDays([1, 3, 5], [1, 3, 5]);
  assert.deepEqual(toAdd, []);
  assert.deepEqual(toRemove, []);
  assert.deepEqual(toKeep.sort(), [1, 3, 5]);
});

test("createCommitment with daysOfWeek inserts one doc per day with a shared seriesId", async (t) => {
  let captured;
  t.mock.method(Commitment, "insertMany", async (docs) => {
    captured = docs;
    return docs;
  });

  await createCommitment(USER_ID, {
    title: "  Calc 3  ",
    daysOfWeek: [1, 3, 5],
    startTime: "07:00",
    endTime: "08:00",
  });

  assert.equal(captured.length, 3);
  assert.deepEqual(captured.map((d) => d.dayOfWeek), [1, 3, 5]);
  assert.ok(captured.every((d) => d.title === "Calc 3"));
  assert.ok(captured.every((d) => String(d.userId) === String(USER_ID)));
  const seriesIds = new Set(captured.map((d) => String(d.seriesId)));
  assert.equal(seriesIds.size, 1, "all docs share one seriesId");
});

test("createCommitment with dayOfWeek still creates a single doc (back-compat)", async (t) => {
  let captured;
  t.mock.method(Commitment, "create", async (doc) => {
    captured = doc;
    return doc;
  });

  await createCommitment(USER_ID, {
    title: "Office hours",
    dayOfWeek: 2,
    startTime: "14:00",
    endTime: "15:00",
  });

  assert.equal(captured.dayOfWeek, 2);
  assert.equal(captured.seriesId, undefined);
});

test("createCommitment rejects empty daysOfWeek", async () => {
  await assert.rejects(
    createCommitment(USER_ID, {
      title: "x",
      daysOfWeek: [],
      startTime: "07:00",
      endTime: "08:00",
    }),
    /daysOfWeek must be a non-empty array/
  );
});

test("createCommitment rejects duplicate daysOfWeek", async () => {
  await assert.rejects(
    createCommitment(USER_ID, {
      title: "x",
      daysOfWeek: [1, 1, 3],
      startTime: "07:00",
      endTime: "08:00",
    }),
    /must not contain duplicates/
  );
});

test("createCommitment rejects daysOfWeek with out-of-range values", async () => {
  await assert.rejects(
    createCommitment(USER_ID, {
      title: "x",
      daysOfWeek: [1, 7],
      startTime: "07:00",
      endTime: "08:00",
    }),
    /values must be integers 0-6/
  );
});

test("createCommitment rejects endTime <= startTime", async () => {
  await assert.rejects(
    createCommitment(USER_ID, {
      title: "x",
      daysOfWeek: [1],
      startTime: "09:00",
      endTime: "09:00",
    }),
    /endTime must be after startTime/
  );
});

test("updateSeries diffs days: removes dropped, inserts added, updates kept", async (t) => {
  const existing = [fakeDoc({ dayOfWeek: 1 }), fakeDoc({ dayOfWeek: 3 }), fakeDoc({ dayOfWeek: 5 })];
  const findCall = { query: null };
  const deleteCall = { query: null };
  const updateCall = { query: null, patch: null };
  const insertCall = { docs: null };

  let findCount = 0;
  t.mock.method(Commitment, "find", (query) => {
    findCount++;
    if (findCount === 1) {
      findCall.query = query;
      return Promise.resolve(existing);
    }
    return { sort: async () => existing };
  });
  t.mock.method(Commitment, "deleteMany", async (query) => {
    deleteCall.query = query;
    return { deletedCount: 1 };
  });
  t.mock.method(Commitment, "updateMany", async (query, patch) => {
    updateCall.query = query;
    updateCall.patch = patch;
    return { modifiedCount: 2 };
  });
  t.mock.method(Commitment, "insertMany", async (docs) => {
    insertCall.docs = docs;
    return docs;
  });

  await updateSeries(USER_ID, SERIES_ID, {
    title: "Calc 3 (renamed)",
    daysOfWeek: [1, 2, 5], // drop 3, add 2, keep 1 and 5
    startTime: "07:30",
    endTime: "08:30",
  });

  assert.deepEqual(deleteCall.query.dayOfWeek, { $in: [3] });
  assert.equal(String(deleteCall.query.userId), String(USER_ID));
  assert.equal(String(deleteCall.query.seriesId), String(SERIES_ID));

  assert.equal(updateCall.patch.title, "Calc 3 (renamed)");
  assert.equal(updateCall.patch.startTime, "07:30");
  assert.equal(updateCall.patch.endTime, "08:30");
  assert.equal(String(updateCall.query.userId), String(USER_ID));
  assert.equal(String(updateCall.query.seriesId), String(SERIES_ID));

  assert.equal(insertCall.docs.length, 1);
  assert.equal(insertCall.docs[0].dayOfWeek, 2);
  assert.equal(insertCall.docs[0].title, "Calc 3 (renamed)");
  assert.equal(String(insertCall.docs[0].seriesId), String(SERIES_ID));
});

test("updateSeries 404s when no docs match the user+series", async (t) => {
  t.mock.method(Commitment, "find", async () => []);

  await assert.rejects(
    updateSeries(USER_ID, SERIES_ID, { title: "x" }),
    /Series not found/
  );
});

test("updateSeries scopes queries to the userId", async (t) => {
  const existing = [fakeDoc({ dayOfWeek: 1 })];
  const seenUserIds = [];
  t.mock.method(Commitment, "find", (q) => {
    if (q) seenUserIds.push(String(q.userId));
    if (seenUserIds.length === 1) return Promise.resolve(existing);
    return { sort: async () => existing };
  });
  t.mock.method(Commitment, "updateMany", async (q) => {
    seenUserIds.push(String(q.userId));
    return { modifiedCount: 1 };
  });

  await updateSeries(USER_ID, SERIES_ID, { title: "x" });
  assert.ok(seenUserIds.every((u) => u === String(USER_ID)));
});

test("deleteSeries removes all matching docs and returns the count", async (t) => {
  let captured;
  t.mock.method(Commitment, "deleteMany", async (q) => {
    captured = q;
    return { deletedCount: 3 };
  });

  const result = await deleteSeries(USER_ID, SERIES_ID);
  assert.equal(result.deletedCount, 3);
  assert.equal(String(captured.userId), String(USER_ID));
  assert.equal(String(captured.seriesId), String(SERIES_ID));
});

test("deleteSeries 404s when nothing was removed", async (t) => {
  t.mock.method(Commitment, "deleteMany", async () => ({ deletedCount: 0 }));
  await assert.rejects(deleteSeries(USER_ID, SERIES_ID), /Series not found/);
});
