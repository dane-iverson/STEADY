import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import userRoutes from "./user.js";
import { memoryUsers, memoryConnections, createUserDocument } from "../db.js";
import { jwtSecret, setDatabaseAvailable } from "../config.js";

test("caregiver glucose feed respects current consent and pairing; messages are bounded", async () => {
  setDatabaseAvailable(false);
  const patient = createUserDocument({
    _id: "feed-patient",
    name: "Patient",
    email: "patient@example.test",
    accountType: "patient",
  });
  const caregiver = createUserDocument({
    _id: "feed-caregiver",
    name: "Caregiver",
    email: "caregiver@example.test",
    accountType: "caregiver",
  });
  const reading = {
    id: 1,
    v: 7.2,
    date: "2026-10-25T12:00:00.000Z",
    context: "After meal",
  };
  patient.readings = [reading];
  patient.sharing = {
    on: true,
    perms: { glucose: true },
    caregivers: [{ email: caregiver.email, permissions: { glucose: true } }],
    sharedItems: [],
  };
  const pairing = {
    id: "feed-pair",
    pairKey: [patient._id, caregiver._id].sort().join(":"),
    requesterId: patient._id,
    recipientId: caregiver._id,
    status: "pending",
  };
  memoryUsers.push(patient, caregiver);
  memoryConnections.push(pairing);
  const app = express();
  app.use(express.json());
  app.use("/user", userRoutes);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/user`;
  const token = (user) => jwt.sign({ userId: user._id }, jwtSecret());
  const load = async () => {
    const response = await fetch(`${base}/me`, {
      headers: { authorization: `Bearer ${token(caregiver)}` },
    });
    assert.equal(response.status, 200);
    return (await response.json()).user.sharedItems;
  };
  try {
    assert.equal((await load()).length, 0);
    pairing.status = "accepted";
    let items = await load();
    assert.equal(items.length, 1);
    assert.equal(items[0].data.value, 7.2);
    const stableId = items[0].id;
    reading.v = 8.1;
    items = await load();
    assert.equal(items[0].id, stableId);
    assert.equal(items[0].data.value, 8.1);
    assert.equal(items.length, 1);
    patient.sharing.on = false;
    assert.equal((await load()).length, 0);
    patient.sharing.on = true;
    patient.sharing.perms.glucose = false;
    assert.equal((await load()).length, 0);
    patient.sharing.perms.glucose = true;
    patient.sharing.caregivers[0].permissions.glucose = false;
    assert.equal((await load()).length, 0);
    patient.sharing.caregivers[0].permissions.glucose = true;
    pairing.status = "revoked";
    assert.equal((await load()).length, 0);
    pairing.status = "accepted";
    patient.readings = [];
    assert.equal((await load()).length, 0);
    patient.readings = [reading];
    const send = (message) =>
      fetch(`${base}/share`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token(patient)}`,
        },
        body: JSON.stringify({
          caregiverEmail: caregiver.email,
          item: {
            id: "manual-reading",
            type: "glucose",
            title: "Reading with message",
            detail: "8.1 mmol/L",
            message,
            data: { readingId: 1, value: 8.1 },
          },
        }),
      });
    assert.equal((await send("  Had lunch earlier today.  ")).status, 201);
    items = await load();
    assert.equal(
      items.find((item) => item.id === "manual-reading").message,
      "Had lunch earlier today.",
    );
    assert.equal(items.filter((item) => item.automatic).length, 1);
    assert.equal((await send("x".repeat(1001))).status, 400);
    assert.equal((await send({ text: "invalid" })).status, 400);
    const sendRange = (readings) =>
      fetch(`${base}/share`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token(patient)}`,
        },
        body: JSON.stringify({
          caregiverEmail: caregiver.email,
          item: {
            id: "range-message",
            type: "glucose",
            title: "Glucose readings",
            detail: "Two readings",
            message: "After lunch this week.",
            data: {
              selection: "range",
              rangeLabel: "Last 7 days",
              unit: "mmol/L",
              readings,
            },
          },
        }),
      });
    const rangeReadings = [
      { value: 8.1, readingAt: reading.date, context: "After meal" },
      { value: 6.3, readingAt: reading.date, context: "Random" },
    ];
    assert.equal((await sendRange(rangeReadings)).status, 201);
    items = await load();
    const rangeMessage = items.find((item) => item.id === "range-message");
    assert.deepEqual(rangeMessage.data.readings, rangeReadings);
    assert.equal(rangeMessage.message, "After lunch this week.");
    assert.equal((await sendRange([])).status, 400);
    assert.equal((await sendRange([{ value: "invalid" }])).status, 400);
    assert.equal(
      (await sendRange(Array.from({ length: 51 }, () => rangeReadings[0])))
        .status,
      400,
    );
    const nextReading = { ...reading, id: 2, v: 5.8 };
    const save = () =>
      fetch(`${base}/me`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token(patient)}`,
        },
        body: JSON.stringify({
          name: patient.name,
          profile: patient.profile,
          sharing: patient.sharing,
          readings: [reading, nextReading],
          reminders: [],
          insulinSettings: {},
        }),
      });
    assert.equal((await save()).status, 200);
    assert.equal((await save()).status, 200);
    items = await load();
    assert.equal(items.filter((item) => item.automatic).length, 2);
    assert.equal(
      items.find((item) => item.automatic && item.data.readingId === 2).data
        .value,
      5.8,
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    memoryUsers.splice(
      memoryUsers.findIndex((entry) => entry._id === patient._id),
      1,
    );
    memoryUsers.splice(
      memoryUsers.findIndex((entry) => entry._id === caregiver._id),
      1,
    );
    memoryConnections.splice(memoryConnections.indexOf(pairing), 1);
  }
});
