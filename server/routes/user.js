import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { createUserDocument, memoryUsers } from "../db.js";

const router = express.Router();

function ageGroupFromDateOfBirth(dateOfBirth) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (
    !dateOfBirth ||
    Number.isNaN(birthDate.getTime()) ||
    birthDate > new Date()
  ) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
  );
  if (birthday > today) age -= 1;
  if (age <= 12) return "child";
  if (age <= 18) return "teen";
  return "young_adult";
}

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    ageGroup: user.ageGroup,
    readings: user.readings || [],
    reminders: user.reminders || [],
    profile: user.profile || {
      name: "",
      surname: "",
      height: "",
      weight: "",
      gender: "",
      otherMedication: "",
      allergies: "",
      dateOfBirth: "",
      status: "Type 1 diabetes",
      contactName: "",
      contactNumber: "",
    },
    sharing: user.sharing || {
      on: false,
      perms: { glucose: true, trends: false, reminders: false },
    },
  };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing auth token." });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "steady-dev-secret",
    );
    req.userId = payload.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid auth token." });
  }
}

router.use(requireAuth);

router.get("/me", async (req, res) => {
  try {
    let user;

    if (
      process.env.MONGODB_URI &&
      !process.env.MONGODB_URI.includes("placeholder")
    ) {
      user = await User.findById(req.userId);
    } else {
      user = memoryUsers.find((entry) => entry._id === req.userId);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Could not load profile." });
  }
});

router.put("/me", async (req, res) => {
  try {
    const updates = req.body || {};
    const profile = updates.profile || {};
    const derivedAgeGroup = ageGroupFromDateOfBirth(profile.dateOfBirth);
    const safeUpdate = {
      name: updates.name || "",
      ageGroup: derivedAgeGroup || updates.ageGroup || "teen",
      readings: Array.isArray(updates.readings) ? updates.readings : [],
      reminders: Array.isArray(updates.reminders) ? updates.reminders : [],
      profile: updates.profile || {
        name: "",
        surname: "",
        height: "",
        weight: "",
        gender: "",
        otherMedication: "",
        allergies: "",
        dateOfBirth: "",
        status: "Type 1 diabetes",
        contactName: "",
        contactNumber: "",
      },
      sharing: updates.sharing || {
        on: false,
        perms: { glucose: true, trends: false, reminders: false },
      },
    };

    let user;
    if (
      process.env.MONGODB_URI &&
      !process.env.MONGODB_URI.includes("placeholder")
    ) {
      user = await User.findByIdAndUpdate(req.userId, safeUpdate, {
        new: true,
      });
    } else {
      const index = memoryUsers.findIndex((entry) => entry._id === req.userId);
      if (index === -1) {
        return res.status(404).json({ message: "User not found." });
      }
      memoryUsers[index] = { ...memoryUsers[index], ...safeUpdate };
      user = memoryUsers[index];
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Could not save profile." });
  }
});

export default router;
