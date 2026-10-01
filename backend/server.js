import "dotenv/config";
import express from "express";
import { connectDatabase } from "./db/database.js";
import authRouter from "./routes/auth.js";
import commitmentsRouter from "./routes/commitments.js";
import goalsRouter from "./routes/goals.js";
import tasksRouter from "./routes/tasks.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

if (!process.env.JWT_SECRET) {
  console.error(
    "JWT_SECRET is not set. Generate one with:\n  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"\nand add it to your .env file."
  );
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello from Kickstart!" });
});

app.use("/api/auth", authRouter);

app.use("/api/commitments", requireAuth, commitmentsRouter);
app.use("/api/goals", requireAuth, goalsRouter);
app.use("/api/tasks", requireAuth, tasksRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDatabase(process.env.DATABASE_URL);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
