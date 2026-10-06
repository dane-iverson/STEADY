/**
 * Signed-in user routes: load and save the profile, connect caregivers and
 * share items with them. Every route here requires a valid login token.
 * Mounted at /api/user in server.js.
 */
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { memoryUsers } from "../db.js";
import { databaseConfigured, jwtSecret } from "../config.js";
import { ageGroupFromDateOfBirth } from "../utils/age.js";

const router = express.Router();

/** Profile used when a user has not saved one yet. Returns a fresh object each time. */
function defaultProfile() {
  return {
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
    hba1c: "",
    hba1cDate: "",
    glucoseRanges: { veryLowMax: 3, lowMax: 4, targetMax: 7.8, highMax: 14 },
  };
}

/** Caregiver-sharing settings used before the user changes anything. */
function defaultSharing() {
  return {
    on: false,
    perms: { glucose: true, trends: false, reminders: false, hba1c: false },
    caregivers: [],
    sharedItems: [],
  };
}

/** True for accounts that can receive shared items. */
function isCaregiverAccount(user) {
  return user.accountType === "caregiver" || user.ageGroup === "caregiver";
}

/** The user fields that are safe to send to the browser (no password hash). */
function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    accountType: user.accountType || "patient",
    ageGroup: user.ageGroup,
    readings: user.readings || [],
    reminders: user.reminders || [],
    sharedItems: user.sharedItems || [],
    insulinSettings: user.insulinSettings || {},
    profile: user.profile || defaultProfile(),
    sharing: user.sharing || defaultSharing(),
  };
}

/** Express middleware: reads the Bearer token and sets `req.userId`. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing auth token." });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, jwtSecret());
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid auth token." });
  }
}

router.use(requireAuth);

// GET /api/user/me - returns the signed-in user's saved data.
router.get("/me", async (req, res) => {
  try {
    let user;

    if (databaseConfigured()) {
      user = await User.findById(req.userId);
    } else {
      user = memoryUsers.find((entry) => entry._id === req.userId);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: sanitizeUser(user) });
  } catch {
    res.status(500).json({ message: "Could not load profile." });
  }
});

// PUT /api/user/me - saves readings, reminders, profile and settings.
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
      insulinSettings: updates.insulinSettings || {},
      profile: updates.profile || defaultProfile(),
      sharing: updates.sharing || defaultSharing(),
    };

    let user;
    if (databaseConfigured()) {
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
  } catch {
    res.status(500).json({ message: "Could not save profile." });
  }
});

// POST /api/user/caregivers - checks that a caregiver account exists for an email.
router.post("/caregivers", async (req, res) => {
  try {
    const normalizedEmail = req.body?.caregiverEmail?.trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Caregiver email is required." });
    }

    let caregiver;
    if (databaseConfigured()) {
      caregiver = await User.findOne({
        email: normalizedEmail,
        $or: [{ accountType: "caregiver" }, { ageGroup: "caregiver" }],
      });
    } else {
      caregiver = memoryUsers.find(
        (entry) =>
          entry.email?.trim().toLowerCase() === normalizedEmail &&
          isCaregiverAccount(entry),
      );
    }

    if (!caregiver) {
      return res
        .status(404)
        .json({ message: "No caregiver account was found with that email." });
    }

    res.json({
      caregiver: {
        _id: caregiver._id,
        name: caregiver.name,
        email: caregiver.email,
      },
    });
  } catch {
    res.status(500).json({ message: "Could not check caregiver account." });
  }
});

// POST /api/user/share - places an item in a caregiver's inbox.
router.post("/share", async (req, res) => {
  try {
    const { caregiverEmail, item } = req.body || {};
    const normalizedEmail = caregiverEmail?.trim().toLowerCase();
    if (!normalizedEmail || !item?.title || !item?.detail) {
      return res
        .status(400)
        .json({ message: "Caregiver and shared item are required." });
    }

    let patient;
    let caregiver;
    if (databaseConfigured()) {
      patient = await User.findById(req.userId);
      caregiver = await User.findOne({
        email: normalizedEmail,
        $or: [{ accountType: "caregiver" }, { ageGroup: "caregiver" }],
      });
      if (!caregiver)
        return res
          .status(404)
          .json({ message: "Caregiver account not found." });
      await User.findByIdAndUpdate(caregiver._id, {
        $push: {
          sharedItems: {
            ...item,
            senderName: patient?.name || "A patient",
            recipientEmail: normalizedEmail,
          },
        },
      });
    } else {
      patient = memoryUsers.find((entry) => entry._id === req.userId);
      caregiver = memoryUsers.find(
        (entry) =>
          entry.email?.trim().toLowerCase() === normalizedEmail &&
          isCaregiverAccount(entry),
      );
      if (!caregiver)
        return res
          .status(404)
          .json({ message: "Caregiver account not found." });
      caregiver.sharedItems = [
        {
          ...item,
          senderName: patient?.name || "A patient",
          recipientEmail: normalizedEmail,
        },
        ...(caregiver.sharedItems || []),
      ];
    }
    res.status(201).json({ item });
  } catch {
    res.status(500).json({ message: "Could not share the item." });
  }
});

export default router;
