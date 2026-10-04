import test from "node:test";
import assert from "node:assert/strict";
import { collectCompletions, getReminderStatus } from "./reminders.js";

const baseReminder = {
  id: "reminder-1",
  title: "Morning check",
  when: "2026-09-21T07:00:00.000Z",
  repeat: "Daily",
  on: true,
};

test("marks a recurring reminder overdue when its occurrence is missed", () => {
  const status = getReminderStatus(
    baseReminder,
    new Date("2026-09-21T08:00:00.000Z"),
  );

  assert.equal(status.key, "overdue");
  assert.equal(status.occurrenceAt, "2026-09-21T07:00:00.000Z");
});

test("matches a completion to the current scheduled occurrence", () => {
  const reminder = {
    ...baseReminder,
    completionHistory: [
      {
        id: "completion-1",
        occurrenceAt: "2026-09-21T07:00:00.000Z",
        completedAt: "2026-09-21T06:55:00.000Z",
        what: "Checked glucose",
        notes: "Before breakfast",
      },
    ],
  };
  const status = getReminderStatus(
    reminder,
    new Date("2026-09-21T08:00:00.000Z"),
  );

  assert.equal(status.key, "completed");
  assert.equal(status.label, "Completed on time");
  assert.equal(status.completion.what, "Checked glucose");
});

test("treats a future reminder as upcoming", () => {
  const status = getReminderStatus(
    { ...baseReminder, when: "2026-09-22T07:00:00.000Z" },
    new Date("2026-09-21T08:00:00.000Z"),
  );

  assert.equal(status.key, "upcoming");
  assert.equal(status.occurrenceAt, "2026-09-22T07:00:00.000Z");
});

test("collects completions by period, reminder and sort order", () => {
  const reminders = [
    {
      id: 1,
      title: "Morning check",
      kind: "Glucose check",
      completionHistory: [
        { occurrenceAt: "2026-09-20T07:00:00.000Z", completedAt: "2026-09-20T06:50:00.000Z", what: "Checked" },
        { occurrenceAt: "2026-09-21T07:00:00.000Z", completedAt: "2026-09-21T09:00:00.000Z", what: "Checked late" },
      ],
    },
    {
      id: 2,
      title: "Insulin",
      kind: "Insulin",
      completionHistory: [
        { occurrenceAt: "2026-08-01T12:00:00.000Z", completedAt: "2026-08-01T12:00:00.000Z", what: "Dose" },
      ],
    },
  ];
  const dateRange = {
    start: new Date("2026-09-01T00:00:00.000Z"),
    end: new Date("2026-09-30T23:59:59.000Z"),
  };

  const newest = collectCompletions(reminders, { dateRange });
  assert.deepEqual(newest.map((entry) => entry.what), ["Checked late", "Checked"]);
  assert.deepEqual(
    collectCompletions(reminders, { dateRange, sortBy: "late" }).map((entry) => entry.onTime),
    [false, true],
  );
  assert.equal(collectCompletions(reminders, { reminderId: 2 }).length, 1);
  assert.equal(collectCompletions(reminders).length, 3);
});
