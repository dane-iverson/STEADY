import test from "node:test";
import assert from "node:assert/strict";
import { glucoseRangeShare } from "./glucoseSharing.js";

const readings = [
  { id: 1, v: 6, date: "2026-10-01T12:00:00Z" },
  { id: 2, v: 8, date: "2026-10-02T12:00:00Z", context: "After meal" },
  { id: 3, v: 7, date: "2026-10-03T12:00:00Z" },
];

test("glucose range snapshots include only selected dates in chronological order", () => {
  const result = glucoseRangeShare(
    [...readings].reverse(),
    "Custom",
    "2026-10-01",
    "2026-10-02",
  );
  assert.equal(result.error, "");
  assert.deepEqual(
    result.readings.map((reading) => reading.value),
    [6, 8],
  );
  assert.equal(result.readings[1].context, "After meal");
  assert.equal(result.rangeLabel, "2026-10-01 to 2026-10-02");
});

test("glucose range snapshots reject invalid, empty and oversized selections", () => {
  assert.ok(
    glucoseRangeShare(readings, "Custom", "2026-10-03", "2026-10-01").error,
  );
  assert.ok(glucoseRangeShare([], "All recordings").error);
  assert.ok(
    glucoseRangeShare(
      Array.from({ length: 51 }, () => readings[0]),
      "All recordings",
    ).error,
  );
  assert.equal(
    glucoseRangeShare([{ v: "bad", date: readings[0].date }], "All recordings")
      .readings.length,
    0,
  );
});
