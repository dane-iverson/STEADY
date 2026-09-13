import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { createUserDocument, memoryUsers } from "../db.js";

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "steady-dev-secret", {
    expiresIn: "7d",
  });
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

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, ageGroup } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail }).catch(
      () => null,
    );
    const memoryMatch = memoryUsers.find(
      (user) => user.email === normalizedEmail,
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
      readings: [],
      reminders: [
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
        name: name.trim(),
        status: "Type 1 diabetes",
        contactName: "",
        contactNumber: "",
      },
    });

    let savedUser;
    if (
      process.env.MONGODB_URI &&
      !process.env.MONGODB_URI.includes("placeholder")
    ) {
      savedUser = await User.create({
        name: newUser.name,
        email: newUser.email,
        passwordHash: newUser.passwordHash,
        ageGroup: newUser.ageGroup,
        readings: newUser.readings,
        reminders: newUser.reminders,
        profile: newUser.profile,
        sharing: newUser.sharing,
      });
    } else {
      savedUser = { ...newUser, passwordHash };
      memoryUsers.push(savedUser);
    }

    const token = createToken(savedUser._id);
    res.status(201).json({ token, user: sanitizeUser(savedUser) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user;
    if (
      process.env.MONGODB_URI &&
      !process.env.MONGODB_URI.includes("placeholder")
    ) {
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
