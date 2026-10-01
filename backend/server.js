import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./db/database.js";

if (!process.env.JWT_SECRET) {
  console.error(
    "JWT_SECRET is not set. Generate one with:\n  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"\nand add it to your .env file."
  );
  process.exit(1);
}

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
