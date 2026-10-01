import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    hoursPerWeek: { type: Number, required: true, min: 0.5 },
    sessionMinutes: { type: Number, default: 45, min: 5 },
    preferredTime: {
      type: String,
      enum: ["morning", "afternoon", "evening", "any"],
      default: "any",
    },
    startDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);
