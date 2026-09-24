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
    accountType: {
      type: String,
      enum: ["patient", "caregiver"],
      default: "patient",
    },
    ageGroup: { type: String, default: "teen" },
    readings: { type: Array, default: [] },
    reminders: { type: Array, default: [] },
    sharedItems: { type: Array, default: [] },
    insulinSettings: { type: Object, default: {} },
    profile: {
      name: { type: String, default: "" },
      surname: { type: String, default: "" },
      height: { type: String, default: "" },
      weight: { type: String, default: "" },
      gender: { type: String, default: "" },
      otherMedication: { type: String, default: "" },
      allergies: { type: String, default: "" },
      dateOfBirth: { type: String, default: "" },
      status: { type: String, default: "Type 1 diabetes" },
      contactName: { type: String, default: "" },
      contactNumber: { type: String, default: "" },
      hba1c: { type: String, default: "" },
      hba1cDate: { type: String, default: "" },
      glucoseRanges: {
        veryLowMax: { type: Number, default: 3 },
        lowMax: { type: Number, default: 4 },
        targetMax: { type: Number, default: 7.8 },
        highMax: { type: Number, default: 14 },
      },
    },
    sharing: {
      on: { type: Boolean, default: false },
      perms: {
        glucose: { type: Boolean, default: true },
        trends: { type: Boolean, default: false },
        reminders: { type: Boolean, default: false },
        hba1c: { type: Boolean, default: false },
      },
      caregivers: { type: Array, default: [] },
      sharedItems: { type: Array, default: [] },
    },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
