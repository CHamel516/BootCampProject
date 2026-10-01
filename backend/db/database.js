import mongoose from "mongoose";

// Reuse one connection across requests (important on serverless, where
// each warm function instance would otherwise open a new connection).
let connectionPromise = null;

export async function connectDatabase(url) {
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(url, { serverSelectionTimeoutMS: 8000 })
      .then((m) => {
        console.log("Connected to MongoDB");
        return m.connection;
      })
      .catch((err) => {
        connectionPromise = null; // allow a retry on the next request
        throw err;
      });
  }
  return connectionPromise;
}
