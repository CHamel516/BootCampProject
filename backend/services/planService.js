import Goal from "../models/Goal.js";
import Commitment from "../models/Commitment.js";
import Task from "../models/Task.js";
import { HttpError } from "../utils/httpError.js";
import { assertValidId } from "../utils/validation.js";
import { planSessions } from "./schedulerService.js";

export async function planGoal(userId, goalId) {
  assertValidId(goalId);
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) throw new HttpError(404, "Goal not found");

  const commitments = await Commitment.find({ userId });
  const { scheduled, tips } = planSessions({ goal, commitments });

  await Task.deleteMany({ goalId: goal._id, userId });

  const tasks = await Task.insertMany(
    scheduled.map((s) => ({
      userId,
      title: `${goal.title} session`,
      completed: false,
      goalId: goal._id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      notes: "",
    }))
  );

  return { tasks, tips };
}
