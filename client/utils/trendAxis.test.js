import test from "node:test";
import assert from "node:assert/strict";
import { dateSpanDays, formatAxisDate, selectAxisTicks } from "./trendAxis.js";

const DAY_MS = 24 * 60 * 60 * 1000;

test("uses one weekday tick for each day in a week range", () => {
  const start = new Date(2026, 9, 5);
  const points = Array.from({ length: 7 }, (_, index) => ({
    x: start.getTime() + index * DAY_MS,
  }));
  const span = dateSpanDays(points, {
    start,
    end: new Date(start.getTime() + 7 * DAY_MS - 1),
  });

  assert.equal(span, 7);
  assert.deepEqual(
    selectAxisTicks(points, span),
    points.map((point) => point.x),
  );
  assert.equal(formatAxisDate(points[0].x, span), "Mon");
});

test("deduplicates multiple readings from one day", () => {
  const points = [
    { x: new Date(2026, 9, 5, 8).getTime() },
    { x: new Date(2026, 9, 5, 18).getTime() },
    { x: new Date(2026, 9, 6, 8).getTime() },
  ];

  assert.equal(selectAxisTicks(points, 3).length, 2);
});

test("spaces month-range ticks and keeps the final observed date", () => {
  const start = new Date(2026, 0, 1).getTime();
  const points = Array.from({ length: 91 }, (_, index) => ({
    x: start + index * DAY_MS,
  }));
  const ticks = selectAxisTicks(points, 92);

  assert.ok(ticks.length <= 6);
  assert.equal(ticks.at(-1), points.at(-1).x);
  assert.match(formatAxisDate(ticks[0], 92), /\d+/);
});

test("uses quarter-spaced month and year labels beyond a year", () => {
  const start = new Date(2023, 0, 1).getTime();
  const points = Array.from({ length: 3 * 365 }, (_, index) => ({
    x: start + index * DAY_MS,
  }));
  const ticks = selectAxisTicks(points, points.length);
  const gapsInDays = ticks
    .slice(1)
    .map((tick, index) => (tick - ticks[index]) / DAY_MS);

  assert.ok(ticks.length <= 14);
  assert.ok(gapsInDays.slice(0, -1).every((gap) => gap >= 89));
  assert.match(formatAxisDate(ticks[0], points.length), /\d{2}$/);
});
