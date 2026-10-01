import mongoose from "mongoose";

const commitmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: { sparse: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Commitment", commitmentSchema);
