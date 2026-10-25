import { getReadingDateRange, readingsForDateRange } from "./diabetes.js";

export function glucoseRangeShare(readings, range, start = "", end = "") {
  const dateRange = getReadingDateRange(range, start, end);
  if (range === "Custom" && !dateRange) {
    return { error: "Choose a valid start and end date.", readings: [] };
  }
  const selected = readingsForDateRange(readings, dateRange)
    .filter(
      (reading) =>
        Number.isFinite(Number(reading.v)) &&
        Number(reading.v) > 0 &&
        reading.date &&
        Number.isFinite(new Date(reading.date).getTime()),
    )
    .sort((first, second) => new Date(first.date) - new Date(second.date))
    .map((reading) => ({
      value: Number(reading.v),
      readingAt: new Date(reading.date).toISOString(),
      context: String(reading.context || "Random").slice(0, 100),
    }));
  const data = {
    selection: "range",
    rangeLabel: range === "Custom" ? `${start} to ${end}` : range,
    unit: "mmol/L",
    readings: selected,
  };
  const error = !selected.length
    ? "No glucose readings in this period."
    : selected.length > 50 || JSON.stringify(data).length > 8192
      ? "Choose a shorter period (up to 50 readings per update)."
      : "";
  return { ...data, error };
}
