import mongoose from "mongoose";

export const memoryUsers = [];

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    return { connected: true, useMemory: false };
  } catch (error) {
    console.warn(
      "MongoDB unavailable, using in-memory fallback. Set MONGODB_URI in server/.env to connect to MongoDB.",
    );
    console.warn(error.message);
    return { connected: false, useMemory: true };
  }
}

export function createUserDocument(data) {
  return {
    _id: data._id || cryptoRandomId(),
    name: data.name || "",
    email: data.email || "",
    passwordHash: data.passwordHash || "",
    ageGroup: data.ageGroup || "teen",
    readings: Array.isArray(data.readings) ? data.readings : [],
    reminders: Array.isArray(data.reminders)
      ? data.reminders
      : [
          {
            id: 1,
            title: "Morning glucose check",
            kind: "Glucose check",
            when: "Every day, 7:00am",
            on: true,
          },
          {
            id: 2,
            title: "Lunchtime insulin",
            kind: "Insulin",
            when: "Every day, 12:30pm",
            on: true,
          },
          {
            id: 3,
            title: "Endocrinologist appointment",
            kind: "Appointment",
            when: "Thu 24 Sep, 3:00pm",
            on: false,
          },
        ],
    profile: {
      name: data.profile?.name || data.name || "",
      status: data.profile?.status || "Type 1 diabetes",
      contactName: data.profile?.contactName || "",
      contactNumber: data.profile?.contactNumber || "",
    },
    sharing: data.sharing || {
      on: false,
      perms: { glucose: true, trends: false, reminders: false },
    },
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function cryptoRandomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
