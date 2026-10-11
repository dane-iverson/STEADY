import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    pairKey: { type: String, required: true, unique: true },
    requesterId: { type: String, required: true },
    recipientId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "revoked"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Connection =
  mongoose.models.Connection || mongoose.model("Connection", connectionSchema);
