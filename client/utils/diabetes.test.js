import test from "node:test";
import assert from "node:assert/strict";
import {
  ageGroupFromDateOfBirth,
  buildReadingEntry,
  formatReadingStamp,
  getReadingDateRange,
  getTimeOfDayGreeting,
  glucoseRangePosition,
  GLUCOSE_RANGES,
  normalizeDecimalInput,
  statusOf,
} from "./diabetes.js";

test("derives the age group from date of birth", () => {
  const today = new Date("2026-09-14T12:00:00");

  assert.equal(ageGroupFromDateOfBirth("2015-09-14", today), "child");
  assert.equal(ageGroupFromDateOfBirth("2008-09-15", today), "teen");
  assert.equal(ageGroupFromDateOfBirth("2000-01-01", today), "young_adult");
  assert.equal(ageGroupFromDateOfBirth("2027-01-01", today), null);
});

test("normalizes comma decimal input to a period", () => {
  assert.equal(normalizeDecimalInput("5,6"), "5.6");
  assert.equal(
    buildReadingEntry("5,6", "Before meal", new Date("2026-09-10T08:35:00")).v,
    5.6,
  );
});

test("uses a time-of-day greeting", () => {
  assert.equal(
    getTimeOfDayGreeting(new Date("2026-09-14T08:00:00")),
    "Good morning",
  );
  assert.equal(
    getTimeOfDayGreeting(new Date("2026-09-14T12:00:00")),
    "Good afternoon",
  );
  assert.equal(
    getTimeOfDayGreeting(new Date("2026-09-14T18:00:00")),
    "Good evening",
  );
});

test("positions dashboard readings across the glucose range", () => {
  assert.equal(GLUCOSE_RANGES.length, 5);
  assert.equal(glucoseRangePosition(0), 0);
  assert.equal(glucoseRangePosition(9), 50);
  assert.equal(glucoseRangePosition(30), 100);
});

test("classifies before-meal mmol readings using SA ranges", () => {
  assert.deepEqual(statusOf(2.9, "Before meal"), {
    label: "Very low",
    key: "very-low",
    symbol: "▼",
  });
  assert.deepEqual(statusOf(3.4, "Before meal"), {
    label: "Low",
    key: "low",
    symbol: "▼",
  });
  assert.deepEqual(statusOf(4.2, "Before meal"), {
    label: "In range",
    key: "target",
    symbol: "●",
  });
  assert.deepEqual(statusOf(6.8, "Before meal"), {
    label: "In range",
    key: "target",
    symbol: "●",
  });
  assert.deepEqual(statusOf(7.0, "Before meal"), {
    label: "High",
    key: "high",
    symbol: "▲",
  });
  assert.deepEqual(statusOf(7.8, "Before meal"), {
    label: "High",
    key: "high",
    symbol: "▲",
  });
  assert.deepEqual(statusOf(14.0, "Before meal"), {
    label: "Very high",
    key: "very-high",
    symbol: "▲",
  });
});

test("classifies after-meal and random readings using SA ranges", () => {
  assert.deepEqual(statusOf(4.2, "After meal"), {
    label: "Low",
    key: "low",
    symbol: "▼",
  });
  assert.deepEqual(statusOf(4.4, "After meal"), {
    label: "In range",
    key: "target",
    symbol: "●",
  });
  assert.deepEqual(statusOf(5.4, "After meal"), {
    label: "In range",
    key: "target",
    symbol: "●",
  });
  assert.deepEqual(statusOf(9.5, "Random"), {
    label: "High",
    key: "high",
    symbol: "▲",
  });
  assert.deepEqual(statusOf(7.8, "Random"), {
    label: "High",
    key: "high",
    symbol: "▲",
  });
  assert.deepEqual(statusOf(14.1, "Random"), {
    label: "Very high",
    key: "very-high",
    symbol: "▲",
  });
});

test("classifies readings using patient-specific glucose limits", () => {
  const customLimits = {
    veryLowMax: 2.5,
    lowMax: 3.5,
    targetMax: 8.5,
    highMax: 15,
  };

  assert.deepEqual(statusOf(8, "Random", customLimits), {
    label: "In range",
    key: "target",
    symbol: "●",
  });
  assert.deepEqual(statusOf(14.5, "Random", customLimits), {
    label: "High",
    key: "high",
    symbol: "▲",
  });
});

test("builds persisted readings with explicit date and time values", () => {
  const date = new Date("2026-09-10T08:35:00");
  const reading = buildReadingEntry(
    5.6,
    "Before meal",
    date,
    "2026-09-10",
    "08:35",
  );

  assert.equal(reading.v, 5.6);
  assert.equal(reading.context, "Before meal");
  assert.equal(reading.date, date.toISOString());
  assert.match(reading.time, /2026|Thu|Sep|8:35/);
  assert.equal(typeof reading.id, "string");
  assert.equal(formatReadingStamp(date), "Thu, 10 Sep 2026, 8:35am");
});

test("supports three and six month reading ranges", () => {
  const now = new Date("2026-09-14T12:00:00");
  const threeMonths = getReadingDateRange("Last 3 months", "", "", now);
  const sixMonths = getReadingDateRange("Last 6 months", "", "", now);

  assert.deepEqual(
    [
      threeMonths.start.getFullYear(),
      threeMonths.start.getMonth(),
      threeMonths.start.getDate(),
    ],
    [2026, 5, 14],
  );
  assert.deepEqual(
    [
      sixMonths.start.getFullYear(),
      sixMonths.start.getMonth(),
      sixMonths.start.getDate(),
    ],
    [2026, 2, 14],
  );
  assert.equal(threeMonths.end.getHours(), 23);
  assert.equal(threeMonths.end.getMinutes(), 59);
});
