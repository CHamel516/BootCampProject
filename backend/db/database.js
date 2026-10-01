import mongoose from "mongoose";

export async function connectDatabase(url) {
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }
  await mongoose.connect(url);
  console.log("Connected to MongoDB");
}
