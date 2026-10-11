/**
 * Authentication routes: sign up and log in.
 * Mounted at /api/auth in server.js.
 */
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { User } from "../models/User.js";
import { createUserDocument, memoryUsers } from "../db.js";
import { databaseConfigured, jwtSecret } from "../config.js";
import { ageGroupFromDateOfBirth } from "../utils/age.js";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." },
});
router.use(authLimiter);

/** Signs a login token that is valid for seven days. */
function createToken(userId) {
  return jwt.sign({ userId }, jwtSecret(), {
    expiresIn: "7d",
  });
}

/** The user fields that are safe to send to the browser (no password hash). */
function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    accountType: user.accountType || "patient",
    onboardingComplete: user.onboardingComplete ?? true,
    ageGroup: user.ageGroup,
    readings: user.readings || [],
    reminders: user.reminders || [],
    sharedItems: user.sharedItems || [],
    profile: user.profile || {
      name: "",
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

// POST /api/auth/signup - creates a patient or caregiver account and returns a token.
router.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      profile,
      accountType = "patient",
    } = req.body;
    const isCaregiver = accountType === "caregiver";
    const ageGroup = isCaregiver
      ? "caregiver"
      : ageGroupFromDateOfBirth(profile?.dateOfBirth);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 100 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.length > 254 ||
      typeof password !== "string" ||
      !ageGroup ||
      (isCaregiver &&
        (typeof profile?.surname !== "string" || !profile.surname.trim()))
    ) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }

    if (password.length < 12 || password.length > 128) {
      return res
        .status(400)
        .json({ message: "Password must be between 12 and 128 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = databaseConfigured()
      ? await User.findOne({ email: normalizedEmail })
      : null;
    const memoryMatch = memoryUsers.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (existingUser || memoryMatch) {
      return res
        .status(409)
        .json({ message: "An account already exists with that email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = createUserDocument({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      ageGroup: ageGroup || "teen",
      accountType: isCaregiver ? "caregiver" : "patient",
      onboardingComplete: false,
      readings: [],
      reminders: [],
      profile: {
        name: name.trim(),
        surname: profile?.surname,
        height: profile?.height,
        weight: profile?.weight,
        gender: profile?.gender,
        otherMedication: profile?.otherMedication,
        allergies: profile?.allergies,
        dateOfBirth: profile?.dateOfBirth,
        status: "Type 1 diabetes",
        contactName: "",
        contactNumber: "",
      },
    });

    let savedUser;
    if (databaseConfigured()) {
      try {
        savedUser = await User.create({
          name: newUser.name,
          email: newUser.email,
          passwordHash: newUser.passwordHash,
          accountType: newUser.accountType,
          onboardingComplete: false,
          ageGroup: newUser.ageGroup,
          readings: newUser.readings,
          reminders: newUser.reminders,
          sharedItems: newUser.sharedItems,
          insulinSettings: newUser.insulinSettings,
          profile: newUser.profile,
          sharing: newUser.sharing,
        });
      } catch (error) {
        if (error?.code === 11000) {
          return res
            .status(409)
            .json({ message: "An account already exists with that email." });
        }
        throw error;
      }
    } else {
      savedUser = { ...newUser, passwordHash };
      memoryUsers.push(savedUser);
    }

    const token = createToken(savedUser._id);
    res.status(201).json({
      token,
      user: sanitizeUser(savedUser),
      isNewAccount: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed." });
  }
});
// POST /api/auth/login - checks the password and returns a token.

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.length > 254 ||
      typeof password !== "string" ||
      password.length > 128
    ) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user;
    if (databaseConfigured()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = memoryUsers.find((entry) => entry.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = createToken(user._id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed." });
  }
});

export default router;
