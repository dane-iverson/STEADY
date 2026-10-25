import { getReadingDateRange, readingsForDateRange } from "./diabetes.js";

const RANGES = new Set([
  "Last 7 days",
  "Last 30 days",
  "Last 3 months",
  "Last 6 months",
  "This year",
  "All recordings",
  "Custom",
]);

export function selectTrendShare(readings, range, start = "", end = "") {
  const period = {
    range,
    start: range === "Custom" ? start : "",
    end: range === "Custom" ? end : "",
  };
  const dateRange = getReadingDateRange(range, start, end);
  const validCalendarDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  };
  if (
    !RANGES.has(range) ||
    (range !== "All recordings" && !dateRange) ||
    (range === "Custom" &&
      (!validCalendarDate(start) || !validCalendarDate(end)))
  ) {
    return {
      period,
      readings: [],
      error: "Choose a valid start and end date.",
    };
  }
  return {
    period,
    readings: readingsForDateRange(readings, dateRange),
    error: "",
  };
}
