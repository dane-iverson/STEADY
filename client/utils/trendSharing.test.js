import test from "node:test";
import assert from "node:assert/strict";
import { selectTrendShare } from "./trendSharing.js";

const readings = [
  { id: 1, v: 5, date: "2026-10-01T12:00:00Z" },
  { id: 2, v: 6, date: "2026-10-02T12:00:00Z" },
  { id: 3, v: 7, date: "2026-10-03T12:00:00Z" },
];

test("invalid custom trend periods never fall back to all readings", () => {
  for (const [start, end] of [
    ["", ""],
    ["2026-10-01", ""],
    ["", "2026-10-02"],
    ["bad", "2026-10-02"],
    ["2026-10-03", "2026-10-01"],
    ["2026-02-31", "2026-03-10"],
  ]) {
    const report = selectTrendShare(readings, "Custom", start, end);
    assert.ok(report.error);
    assert.deepEqual(report.readings, []);
  }
  assert.ok(selectTrendShare(readings, "Unknown range").error);
});

test("valid custom trend periods select exactly their inclusive dates", () => {
  const report = selectTrendShare(
    readings,
    "Custom",
    "2026-10-01",
    "2026-10-02",
  );
  assert.equal(report.error, "");
  assert.deepEqual(
    report.readings.map((reading) => reading.id),
    [1, 2],
  );
  assert.equal(
    selectTrendShare(readings, "Custom", "2026-10-02", "2026-10-02").readings
      .length,
    1,
  );
  assert.equal(
    selectTrendShare(readings, "Custom", "2020-01-01", "2020-01-02").readings
      .length,
    0,
  );
});

test("all recordings is an explicit unrestricted selection", () => {
  assert.deepEqual(
    selectTrendShare(readings, "All recordings").readings,
    readings,
  );
  assert.equal(selectTrendShare(readings, "Last 7 days").error, "");
});
