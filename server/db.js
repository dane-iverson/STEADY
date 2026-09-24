import mongoose from "mongoose";

export const memoryUsers = [];

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    return { connected: false, useMemory: true };
  }

  if (mongoose.connection.readyState === 1) {
    return { connected: true, useMemory: false };
  }

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
    accountType: data.accountType || "patient",
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
    sharedItems: Array.isArray(data.sharedItems) ? data.sharedItems : [],
    profile: {
      name: data.profile?.name || data.name || "",
      surname: data.profile?.surname || "",
      height: data.profile?.height || "",
      weight: data.profile?.weight || "",
      gender: data.profile?.gender || "",
      otherMedication: data.profile?.otherMedication || "",
      allergies: data.profile?.allergies || "",
      dateOfBirth: data.profile?.dateOfBirth || "",
      status: data.profile?.status || "Type 1 diabetes",
      contactName: data.profile?.contactName || "",
      contactNumber: data.profile?.contactNumber || "",
      hba1c: data.profile?.hba1c || "",
      hba1cDate: data.profile?.hba1cDate || "",
      glucoseRanges: {
        veryLowMax: data.profile?.glucoseRanges?.veryLowMax ?? 3,
        lowMax: data.profile?.glucoseRanges?.lowMax ?? 4,
        targetMax: data.profile?.glucoseRanges?.targetMax ?? 7.8,
        highMax: data.profile?.glucoseRanges?.highMax ?? 14,
      },
    },
    sharing: data.sharing || {
      on: false,
      perms: { glucose: true, trends: false, reminders: false, hba1c: false },
      caregivers: [],
      sharedItems: [],
    },
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function cryptoRandomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
