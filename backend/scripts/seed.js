import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../db/database.js";
import User from "../models/User.js";
import Commitment from "../models/Commitment.js";
import Goal from "../models/Goal.js";
import Task from "../models/Task.js";
import { planGoal } from "../services/planService.js";

const DEMO_EMAIL = "demo@kickstart.app";
const DEMO_PASSWORD = "demo1234";

const COMMITMENTS = [
  { title: "CS101 lecture", dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
  { title: "CS101 lecture", dayOfWeek: 3, startTime: "09:00", endTime: "12:00" },
  { title: "CS101 lecture", dayOfWeek: 5, startTime: "09:00", endTime: "12:00" },
  { title: "Work (part-time)", dayOfWeek: 2, startTime: "13:00", endTime: "17:00" },
  { title: "Work (part-time)", dayOfWeek: 4, startTime: "13:00", endTime: "17:00" },
  { title: "Gym", dayOfWeek: 1, startTime: "18:00", endTime: "19:00" },
  { title: "Gym", dayOfWeek: 3, startTime: "18:00", endTime: "19:00" },
  { title: "Gym", dayOfWeek: 5, startTime: "18:00", endTime: "19:00" },
];

const GUITAR_GOAL = {
  title: "Learn guitar",
  hoursPerWeek: 3,
  sessionMinutes: 45,
  preferredTime: "evening",
};

async function seed() {
  try {
    await connectDatabase(process.env.DATABASE_URL);
    console.log("Wiping existing data...");
    await Promise.all([
      User.deleteMany({}),
      Commitment.deleteMany({}),
      Task.deleteMany({}),
      Goal.deleteMany({}),
    ]);

    console.log(`Creating demo user (${DEMO_EMAIL})...`);
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const user = await User.create({ email: DEMO_EMAIL, passwordHash });

    console.log(`Inserting ${COMMITMENTS.length} commitments...`);
    await Commitment.insertMany(
      COMMITMENTS.map((c) => ({ ...c, userId: user._id }))
    );

    console.log("Creating guitar goal...");
    const goal = await Goal.create({ ...GUITAR_GOAL, userId: user._id });

    console.log("Planning sessions...");
    const { tasks, tips } = await planGoal(user._id, goal._id);

    console.log(
      `\n✓ Seeded ${COMMITMENTS.length} commitments, 1 goal, ${tasks.length} sessions for ${DEMO_EMAIL}.`
    );
    console.log(`  Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    console.log("Tips:");
    tips.forEach((t) => console.log(`  • ${t}`));
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();
