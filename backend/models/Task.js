import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    completed: { type: Boolean, default: false },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", default: null },
    dayOfWeek: { type: Number, min: 0, max: 6, default: null },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
    notes: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
