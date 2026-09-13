import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    ageGroup: { type: String, default: "teen" },
    readings: { type: Array, default: [] },
    reminders: { type: Array, default: [] },
    profile: {
      name: { type: String, default: "" },
      status: { type: String, default: "Type 1 diabetes" },
      contactName: { type: String, default: "" },
      contactNumber: { type: String, default: "" },
    },
    sharing: {
      on: { type: Boolean, default: false },
      perms: {
        glucose: { type: Boolean, default: true },
        trends: { type: Boolean, default: false },
        reminders: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
