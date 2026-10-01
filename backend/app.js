import "dotenv/config";
import express from "express";
import { connectDatabase } from "./db/database.js";
import authRouter from "./routes/auth.js";
import commitmentsRouter from "./routes/commitments.js";
import goalsRouter from "./routes/goals.js";
import tasksRouter from "./routes/tasks.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Builds the Express app without starting a listener, so it can run
// locally (backend/server.js) or as a Vercel serverless function (api/index.js).
const app = express();
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello from Kickstart!" });
});

// Ensure the (cached) MongoDB connection is ready before any API route runs.
app.use("/api", async (req, res, next) => {
  try {
    await connectDatabase(process.env.DATABASE_URL);
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api/auth", authRouter);
app.use("/api/commitments", requireAuth, commitmentsRouter);
app.use("/api/goals", requireAuth, goalsRouter);
app.use("/api/tasks", requireAuth, tasksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
