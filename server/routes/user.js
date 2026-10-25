/**
 * Signed-in user routes: load and save the profile, connect caregivers and
 * share items with them. Every route here requires a valid login token.
 * Mounted at /api/user in server.js.
 */
import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { User } from "../models/User.js";
import { memoryConnections, memoryUsers } from "../db.js";
import { Connection } from "../models/Connection.js";
import { databaseConfigured, jwtSecret } from "../config.js";
import { ageGroupFromDateOfBirth } from "../utils/age.js";

const router = express.Router();
const caregiverLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const shareLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const SHARE_TYPES = new Set(["glucose", "trends", "reminders", "hba1c"]);
const CAREGIVER_INBOX_LIMIT = 200;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validString(value, maxLength) {
  return typeof value === "string" && value.length <= maxLength;
}

function cleanProfile(profile) {
  const textFields = [
    "name",
    "surname",
    "height",
    "weight",
    "gender",
    "otherMedication",
    "allergies",
    "dateOfBirth",
    "status",
    "contactName",
    "contactNumber",
    "hba1c",
    "hba1cDate",
  ];
  if (!isPlainObject(profile)) return null;
  const cleaned = defaultProfile();
  for (const field of textFields) {
    const value = profile[field] ?? cleaned[field];
    if (!validString(value, 500)) return null;
    cleaned[field] = value;
  }
  const ranges = profile.glucoseRanges ?? cleaned.glucoseRanges;
  if (!isPlainObject(ranges)) return null;
  const limits = ["veryLowMax", "lowMax", "targetMax", "highMax"].map((key) =>
    Number(ranges[key] ?? cleaned.glucoseRanges[key]),
  );
  if (
    !limits.every(
      (value) => Number.isFinite(value) && value > 0 && value <= 40,
    ) ||
    !limits.every((value, index) => index === 0 || value > limits[index - 1])
  ) {
    return null;
  }
  cleaned.glucoseRanges = Object.fromEntries(
    ["veryLowMax", "lowMax", "targetMax", "highMax"].map((key, index) => [
      key,
      limits[index],
    ]),
  );
  return cleaned;
}

function cleanSharing(sharing) {
  if (!isPlainObject(sharing) || typeof sharing.on !== "boolean") return null;
  if (!isPlainObject(sharing.perms)) return null;
  const permissionKeys = [...SHARE_TYPES];
  if (
    !permissionKeys.every(
      (key) =>
        sharing.perms[key] === undefined ||
        typeof sharing.perms[key] === "boolean",
    )
  ) {
    return null;
  }
  const permissions = {
    glucose: true,
    trends: false,
    reminders: false,
    hba1c: false,
    ...sharing.perms,
  };
  if (!Array.isArray(sharing.caregivers) || sharing.caregivers.length > 50) {
    return null;
  }
  const caregivers = [];
  for (const caregiver of sharing.caregivers) {
    if (
      !isPlainObject(caregiver) ||
      !validString(caregiver.email, 254) ||
      !caregiver.email.includes("@") ||
      (caregiver.permissions !== undefined &&
        !isPlainObject(caregiver.permissions))
    ) {
      return null;
    }
    caregivers.push({
      id: validString(caregiver.id, 100) ? caregiver.id : "",
      email: caregiver.email.trim().toLowerCase(),
      name: validString(caregiver.name, 100) ? caregiver.name : "",
      status: "connected",
      addedAt: validString(caregiver.addedAt, 40) ? caregiver.addedAt : "",
      permissions: Object.fromEntries(
        permissionKeys.map((key) => [
          key,
          (caregiver.permissions || permissions)[key] === true,
        ]),
      ),
    });
  }
  if (!Array.isArray(sharing.sharedItems) || sharing.sharedItems.length > 500) {
    return null;
  }
  if (!sharing.sharedItems.every((item) => isPlainObject(item))) return null;
  return {
    on: sharing.on,
    perms: Object.fromEntries(
      permissionKeys.map((key) => [key, permissions[key]]),
    ),
    caregivers,
    sharedItems: sharing.sharedItems,
  };
}

function cleanRecordArray(value, maxLength) {
  return (
    Array.isArray(value) &&
    value.length <= maxLength &&
    value.every(isPlainObject)
  );
}

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
  return user.accountType === "caregiver";
}

function connectionPairKey(firstId, secondId) {
  return [String(firstId), String(secondId)].sort().join(":");
}

async function findUserById(id) {
  return databaseConfigured()
    ? User.findById(id)
    : memoryUsers.find((entry) => String(entry._id) === String(id));
}

function connectionSummary(connection, otherUser) {
  return {
    id: String(connection._id || connection.id),
    status: connection.status,
    requestedAt: connection.createdAt,
    user: {
      id: String(otherUser._id),
      name: otherUser.name,
      email: otherUser.email,
      accountType: otherUser.accountType,
    },
  };
}

/** The user fields that are safe to send to the browser (no password hash). */
function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    accountType: user.accountType || "patient",
    onboardingComplete: user.onboardingComplete ?? true,
    revision: user.revision ?? 0,
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

async function caregiverGlucoseFeed(caregiver) {
  const caregiverId = String(caregiver._id);
  const connections = databaseConfigured()
    ? await Connection.find({
        status: "accepted",
        $or: [{ requesterId: caregiverId }, { recipientId: caregiverId }],
      }).lean()
    : memoryConnections.filter(
        (entry) =>
          entry.status === "accepted" &&
          [entry.requesterId, entry.recipientId].includes(caregiverId),
      );
  const items = [];
  for (const connection of connections) {
    const patientId =
      String(connection.requesterId) === caregiverId
        ? connection.recipientId
        : connection.requesterId;
    const patient = await findUserById(patientId);
    const permission = patient?.sharing?.caregivers?.find(
      (entry) =>
        entry.email?.trim().toLowerCase() ===
        caregiver.email.trim().toLowerCase(),
    );
    if (
      !patient ||
      patient.accountType !== "patient" ||
      !patient.sharing?.on ||
      patient.sharing?.perms?.glucose !== true ||
      !permission ||
      permission.permissions?.glucose === false
    )
      continue;
    for (const reading of patient.readings || []) {
      const value = Number(reading.v);
      if (
        reading.id == null ||
        !Number.isFinite(value) ||
        value <= 0 ||
        !reading.date ||
        Number.isNaN(new Date(reading.date).getTime())
      )
        continue;
      items.push({
        id: `auto-glucose-${patient._id}-${reading.id}`,
        type: "glucose",
        automatic: true,
        title: "Glucose reading",
        detail: `${value.toFixed(1)} mmol/L (${reading.context || "Random"})`,
        sharedAt: reading.date,
        senderId: String(patient._id),
        senderName: patient.name || "A patient",
        data: {
          readingId: reading.id,
          value,
          unit: "mmol/L",
          context: reading.context || "Random",
          readingAt: reading.date,
          glucoseRanges: patient.profile?.glucoseRanges,
        },
      });
    }
  }
  return items;
}

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

    const responseUser = sanitizeUser(user);
    if (isCaregiverAccount(user)) {
      responseUser.sharedItems = [
        ...responseUser.sharedItems,
        ...(await caregiverGlucoseFeed(user)),
      ]
        .sort(
          (first, second) =>
            new Date(second.sharedAt) - new Date(first.sharedAt),
        )
        .slice(0, CAREGIVER_INBOX_LIMIT);
    }
    res.json({ user: responseUser });
  } catch {
    res.status(500).json({ message: "Could not load profile." });
  }
});

// PUT /api/user/me - saves readings, reminders, profile and settings.
router.put("/me", async (req, res) => {
  try {
    const updates = req.body;
    const allowedFields = new Set([
      "revision", "name", "ageGroup", "onboardingComplete", "readings",
      "reminders", "insulinSettings", "profile", "sharing",
    ]);
    if (
      !isPlainObject(updates) ||
      !Number.isInteger(updates.revision) ||
      updates.revision < 0 ||
      Object.keys(updates).some((key) => !allowedFields.has(key)) ||
      Object.keys(updates).length === 1
    ) {
      return res.status(400).json({ message: "Invalid profile data." });
    }
    const has = (key) => Object.hasOwn(updates, key);
    const profile = has("profile") ? cleanProfile(updates.profile) : null;
    const sharing = has("sharing") ? cleanSharing(updates.sharing) : null;
    const insulinSettings = has("insulinSettings") ? updates.insulinSettings : {};
    const settingKeys = [
      "insulinType",
      "deliveryMethod",
      "carbRatio",
      "sensitivity",
      "targetGlucose",
      "doseIncrement",
      "maxBolus",
      "lowThreshold",
      "insulinDuration",
    ];
    if (
      (has("name") && !validString(updates.name, 100)) ||
      (has("ageGroup") && !validString(updates.ageGroup, 30)) ||
      (has("onboardingComplete") &&
        typeof updates.onboardingComplete !== "boolean") ||
      (has("profile") && !profile) ||
      (has("sharing") && !sharing) ||
      !isPlainObject(insulinSettings) ||
      !settingKeys.every(
        (key) =>
          insulinSettings[key] === undefined ||
          validString(String(insulinSettings[key]), 100),
      ) ||
      (has("readings") && !cleanRecordArray(updates.readings, 10000)) ||
      (has("reminders") && !cleanRecordArray(updates.reminders, 1000))
    ) {
      return res.status(400).json({ message: "Invalid profile data." });
    }
    let currentUser;
    if (databaseConfigured()) {
      currentUser = await User.findById(req.userId);
    } else {
      currentUser = memoryUsers.find((entry) => entry._id === req.userId);
    }
    if (!currentUser) {
      return res.status(404).json({ message: "User not found." });
    }
    if ((currentUser.revision ?? 0) !== updates.revision) {
      return res.status(409).json({
        message: "This account changed elsewhere. Reload the latest data before saving again.",
        revision: currentUser.revision ?? 0,
      });
    }

    const safeUpdate = {};
    if (has("name")) safeUpdate.name = updates.name;
    if (has("onboardingComplete")) {
      safeUpdate.onboardingComplete = updates.onboardingComplete;
    }
    if (has("readings")) safeUpdate.readings = updates.readings;
    if (has("reminders")) safeUpdate.reminders = updates.reminders;
    if (has("profile")) {
      safeUpdate.profile = profile;
      if (!has("name")) safeUpdate.name = profile.name || "";
      if (!has("ageGroup")) {
        safeUpdate.ageGroup =
          currentUser.accountType === "caregiver"
            ? "caregiver"
            : ageGroupFromDateOfBirth(profile.dateOfBirth) ||
              currentUser.ageGroup ||
              "teen";
      }
    }
    if (has("ageGroup")) safeUpdate.ageGroup = updates.ageGroup;
    if (has("sharing")) safeUpdate.sharing = sharing;
    if (has("insulinSettings")) {
      for (const key of settingKeys) {
        if (insulinSettings[key] !== undefined) {
          safeUpdate[`insulinSettings.${key}`] = String(insulinSettings[key]);
        }
      }
    }
    if (Object.keys(safeUpdate).length === 0) {
      return res.status(400).json({ message: "No profile fields to update." });
    }

    let user;
    if (databaseConfigured()) {
      user = await User.findOneAndUpdate(
        {
          _id: req.userId,
          $or: [
            { revision: updates.revision },
            ...(updates.revision === 0 ? [{ revision: { $exists: false } }] : []),
          ],
        },
        { $set: safeUpdate, $inc: { revision: 1 } },
        { new: true, runValidators: true },
      );
    } else {
      const index = memoryUsers.findIndex((entry) => entry._id === req.userId);
      if (index === -1) {
        return res.status(404).json({ message: "User not found." });
      }
      const nestedSettings = Object.fromEntries(
        Object.entries(safeUpdate)
          .filter(([key]) => key.startsWith("insulinSettings."))
          .map(([key, value]) => [key.slice("insulinSettings.".length), value]),
      );
      for (const key of Object.keys(safeUpdate)) {
        if (!key.startsWith("insulinSettings.")) {
          memoryUsers[index][key] = safeUpdate[key];
        }
      }
      memoryUsers[index].insulinSettings = {
        ...(memoryUsers[index].insulinSettings || {}),
        ...nestedSettings,
      };
      memoryUsers[index].revision = updates.revision + 1;
      memoryUsers[index].updatedAt = new Date().toISOString();
      user = memoryUsers[index];
    }

    if (!user) {
      return res.status(409).json({
        message: "This account changed elsewhere. Reload the latest data before saving again.",
      });
    }

    res.json({ user: sanitizeUser(user) });
  } catch {
    res.status(500).json({ message: "Could not save profile." });
  }
});

router.get("/connections", async (req, res) => {
  try {
    const records = databaseConfigured()
      ? await Connection.find({
          $or: [{ requesterId: req.userId }, { recipientId: req.userId }],
          status: { $in: ["pending", "accepted"] },
        }).lean()
      : memoryConnections.filter(
          (entry) =>
            (entry.requesterId === req.userId ||
              entry.recipientId === req.userId) &&
            ["pending", "accepted"].includes(entry.status),
        );
    const received = [];
    const sent = [];
    const connected = [];
    for (const connection of records) {
      const incoming = String(connection.recipientId) === String(req.userId);
      const otherId = incoming
        ? connection.requesterId
        : connection.recipientId;
      const otherUser = await findUserById(otherId);
      if (!otherUser) continue;
      const summary = connectionSummary(connection, otherUser);
      if (connection.status === "accepted") connected.push(summary);
      else if (incoming) received.push(summary);
      else sent.push(summary);
    }
    res.json({ received, sent, connected });
  } catch {
    res.status(500).json({ message: "Could not load pairing requests." });
  }
});

router.post("/connections", caregiverLookupLimiter, async (req, res) => {
  try {
    const email = req.body?.email;
    if (
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    const requester = await findUserById(req.userId);
    if (!requester) {
      return res
        .status(404)
        .json({ message: "Your account could not be found." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const recipient = databaseConfigured()
      ? await User.findOne({ email: normalizedEmail })
      : memoryUsers.find(
          (entry) => entry.email?.trim().toLowerCase() === normalizedEmail,
        );
    if (!recipient) {
      return res
        .status(404)
        .json({ message: "No account exists for that email address." });
    }
    if (String(recipient._id) === String(requester._id)) {
      return res
        .status(400)
        .json({ message: "You cannot send a request to yourself." });
    }
    if (recipient.accountType === requester.accountType) {
      return res.status(400).json({
        message: `Pairing requests must be between a patient and a caregiver.`,
      });
    }
    const pairKey = connectionPairKey(requester._id, recipient._id);
    let connection;
    if (databaseConfigured()) {
      const existing = await Connection.findOne({ pairKey });
      if (existing?.status === "accepted") {
        return res
          .status(409)
          .json({ message: "These accounts are already paired." });
      }
      if (existing?.status === "pending") {
        return res.status(409).json({
          message:
            String(existing.recipientId) === String(requester._id)
              ? "This account has already sent you a request. Review it in your requests."
              : "A pairing request is already waiting for a response.",
        });
      }
      connection = await Connection.findOneAndUpdate(
        { pairKey },
        {
          $set: {
            pairKey,
            requesterId: String(requester._id),
            recipientId: String(recipient._id),
            status: "pending",
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    } else {
      const existing = memoryConnections.find(
        (entry) => entry.pairKey === pairKey,
      );
      if (existing?.status === "accepted") {
        return res
          .status(409)
          .json({ message: "These accounts are already paired." });
      }
      if (existing?.status === "pending") {
        return res.status(409).json({
          message:
            existing.recipientId === req.userId
              ? "This account has already sent you a request. Review it in your requests."
              : "A pairing request is already waiting for a response.",
        });
      }
      connection = existing || { id: `connection-${Date.now()}`, pairKey };
      Object.assign(connection, {
        requesterId: String(requester._id),
        recipientId: String(recipient._id),
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      if (!existing) memoryConnections.push(connection);
    }
    res.status(201).json({
      request: connectionSummary(connection, recipient),
      message: "Pairing request sent.",
    });
  } catch {
    res.status(500).json({ message: "Could not send pairing request." });
  }
});

router.patch("/connections/:connectionId", async (req, res) => {
  try {
    const accepted = req.body?.decision === "accept";
    if (!accepted && req.body?.decision !== "decline") {
      return res.status(400).json({ message: "Choose accept or decline." });
    }
    let connection = databaseConfigured()
      ? await Connection.findById(req.params.connectionId)
      : memoryConnections.find((entry) => entry.id === req.params.connectionId);
    if (
      !connection ||
      String(connection.recipientId) !== String(req.userId) ||
      connection.status !== "pending"
    ) {
      return res.status(404).json({ message: "Pairing request not found." });
    }
    connection.status = accepted ? "accepted" : "declined";
    if (databaseConfigured()) await connection.save();
    const requester = await findUserById(connection.requesterId);
    const recipient = await findUserById(connection.recipientId);
    if (accepted && requester && recipient) {
      const patient =
        requester.accountType === "patient" ? requester : recipient;
      const caregiver =
        requester.accountType === "caregiver" ? requester : recipient;
      const sharing = patient.sharing || defaultSharing();
      const caregivers = Array.isArray(sharing.caregivers)
        ? sharing.caregivers
        : [];
      if (!caregivers.some((entry) => entry.email === caregiver.email)) {
        caregivers.push({
          id: String(caregiver._id),
          email: caregiver.email,
          name: caregiver.name,
          status: "connected",
          addedAt: new Date().toISOString(),
          permissions: { ...sharing.perms },
        });
      }
      const updatedSharing = { ...sharing, caregivers };
      if (databaseConfigured()) {
        await User.findByIdAndUpdate(
          patient._id,
          { $set: { sharing: updatedSharing }, $inc: { revision: 1 } },
        );
      } else {
        patient.sharing = updatedSharing;
        patient.revision = (patient.revision ?? 0) + 1;
      }
    }
    res.json({ status: connection.status });
  } catch {
    res.status(500).json({ message: "Could not update pairing request." });
  }
});

router.delete("/connections/:connectionId", async (req, res) => {
  try {
    const connection = databaseConfigured()
      ? await Connection.findById(req.params.connectionId)
      : memoryConnections.find((entry) => entry.id === req.params.connectionId);
    if (
      !connection ||
      ![connection.requesterId, connection.recipientId].some(
        (id) => String(id) === String(req.userId),
      ) ||
      connection.status !== "accepted"
    ) {
      return res.status(404).json({ message: "Active pairing not found." });
    }
    const first = await findUserById(connection.requesterId);
    const second = await findUserById(connection.recipientId);
    const patient = first?.accountType === "patient" ? first : second;
    const caregiver = first?.accountType === "caregiver" ? first : second;
    if (patient && caregiver) {
      const sharing = patient.sharing || defaultSharing();
      const updatedSharing = {
        ...sharing,
        caregivers: (sharing.caregivers || []).filter(
          (entry) => entry.email !== caregiver.email,
        ),
      };
      if (databaseConfigured()) {
        await User.findByIdAndUpdate(
          patient._id,
          { $set: { sharing: updatedSharing }, $inc: { revision: 1 } },
        );
        await User.findByIdAndUpdate(caregiver._id, {
          $pull: { sharedItems: { senderId: String(patient._id) } },
        });
      } else {
        patient.sharing = updatedSharing;
        patient.revision = (patient.revision ?? 0) + 1;
        caregiver.sharedItems = (caregiver.sharedItems || []).filter(
          (item) => item.senderId !== String(patient._id),
        );
      }
    }
    connection.status = "revoked";
    if (databaseConfigured()) await connection.save();
    res.json({ status: "revoked" });
  } catch {
    res.status(500).json({ message: "Could not remove pairing." });
  }
});

// POST /api/user/share - places an item in a caregiver's inbox.
router.post("/share", shareLimiter, async (req, res) => {
  try {
    const { caregiverEmail, item } = req.body || {};
    const normalizedEmail =
      typeof caregiverEmail === "string"
        ? caregiverEmail.trim().toLowerCase()
        : "";
    if (
      !normalizedEmail ||
      !isPlainObject(item) ||
      !SHARE_TYPES.has(item.type) ||
      !validString(item.title, 100) ||
      !validString(item.detail, 2000) ||
      (item.message !== undefined && !validString(item.message, 1000)) ||
      (item.data !== undefined &&
        (!isPlainObject(item.data) || JSON.stringify(item.data).length > 8192))
    ) {
      return res
        .status(400)
        .json({ message: "Caregiver and shared item are required." });
    }

    if (item.type === "trends") {
      const period = item.data?.period;
      const ranges = [
        "Last 7 days",
        "Last 30 days",
        "Last 3 months",
        "Last 6 months",
        "This year",
        "All recordings",
        "Custom",
      ];
      const validDate = (value) => {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
          return false;
        const date = new Date(`${value}T00:00:00.000Z`);
        return (
          Number.isFinite(date.getTime()) &&
          date.toISOString().slice(0, 10) === value
        );
      };
      if (
        !isPlainObject(period) ||
        !ranges.includes(period.range) ||
        (period.range === "Custom" &&
          (!validDate(period.start) ||
            !validDate(period.end) ||
            period.start > period.end))
      ) {
        return res
          .status(400)
          .json({ message: "Choose a valid date range for the trend report." });
      }
    }

    if (item.type === "glucose" && item.data?.selection === "range") {
      const data = item.data;
      if (
        !validString(data.rangeLabel, 100) ||
        !Array.isArray(data.readings) ||
        data.readings.length < 1 ||
        data.readings.length > 50 ||
        !data.readings.every(
          (reading) =>
            isPlainObject(reading) &&
            typeof reading.value === "number" &&
            Number.isFinite(reading.value) &&
            reading.value > 0 &&
            validString(reading.readingAt, 40) &&
            Number.isFinite(new Date(reading.readingAt).getTime()) &&
            validString(reading.context, 100),
        )
      ) {
        return res.status(400).json({
          message: "Select a valid range of 1 to 50 glucose readings.",
        });
      }
    }

    let patient;
    let caregiver;
    if (databaseConfigured()) {
      patient = await User.findById(req.userId);
      caregiver = await User.findOne({
        email: normalizedEmail,
        accountType: "caregiver",
      });
      const paired =
        patient && caregiver
          ? await Connection.exists({
              pairKey: connectionPairKey(patient._id, caregiver._id),
              status: "accepted",
            })
          : false;
      const connection = patient?.sharing?.caregivers?.find(
        (entry) => entry.email?.trim().toLowerCase() === normalizedEmail,
      );
      if (
        !patient ||
        !paired ||
        patient.accountType === "caregiver" ||
        !patient.sharing?.on ||
        patient.sharing?.perms?.[item.type] !== true ||
        !connection ||
        connection.permissions?.[item.type] === false
      ) {
        return res
          .status(403)
          .json({ message: "Sharing is not enabled for this caregiver." });
      }
      if (!caregiver)
        return res
          .status(404)
          .json({ message: "Caregiver account not found." });
      const sharedItem = {
        id: validString(item.id, 100) ? item.id : `share-${Date.now()}`,
        type: item.type,
        title: item.title,
        detail: item.detail,
        message: item.message?.trim() || "",
        sharedAt: new Date().toISOString(),
        viewedAt: null,
        senderId: String(patient._id),
        senderName: patient.name || "A patient",
        recipientEmail: normalizedEmail,
        data: item.data,
      };
      await User.findByIdAndUpdate(caregiver._id, {
        $push: {
          sharedItems: {
            $each: [sharedItem],
            $position: 0,
            $slice: CAREGIVER_INBOX_LIMIT,
          },
        },
      });
    } else {
      patient = memoryUsers.find((entry) => entry._id === req.userId);
      const caregiverAccount = memoryUsers.find(
        (entry) => entry.email?.trim().toLowerCase() === normalizedEmail,
      );
      const paired = caregiverAccount
        ? memoryConnections.some(
            (entry) =>
              entry.pairKey ===
                connectionPairKey(patient?._id, caregiverAccount._id) &&
              entry.status === "accepted",
          )
        : false;
      const connection = patient?.sharing?.caregivers?.find(
        (entry) => entry.email?.trim().toLowerCase() === normalizedEmail,
      );
      if (
        !patient ||
        !paired ||
        patient.accountType === "caregiver" ||
        !patient.sharing?.on ||
        patient.sharing?.perms?.[item.type] !== true ||
        !connection ||
        connection.permissions?.[item.type] === false
      ) {
        return res
          .status(403)
          .json({ message: "Sharing is not enabled for this caregiver." });
      }
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
          id: validString(item.id, 100) ? item.id : `share-${Date.now()}`,
          type: item.type,
          title: item.title,
          detail: item.detail,
          message: item.message?.trim() || "",
          sharedAt: new Date().toISOString(),
          viewedAt: null,
          senderId: String(patient._id),
          senderName: patient.name || "A patient",
          recipientEmail: normalizedEmail,
          data: item.data,
        },
        ...(caregiver.sharedItems || []),
      ].slice(0, CAREGIVER_INBOX_LIMIT);
    }
    res.status(201).json({ item });
  } catch {
    res.status(500).json({ message: "Could not share the item." });
  }
});

export default router;
