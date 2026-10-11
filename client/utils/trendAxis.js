export const DAY_MS = 24 * 60 * 60 * 1000;

export function dateSpanDays(points, dateRange) {
  if (dateRange?.start && dateRange?.end) {
    return Math.max(
      1,
      Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / DAY_MS),
    );
  }
  if (points.length < 2) return 1;
  const times = points.map((point) => point.x);
  return Math.max(
    1,
    Math.ceil((Math.max(...times) - Math.min(...times)) / DAY_MS) + 1,
  );
}

export function formatAxisDate(value, spanDays) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (spanDays <= 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  if (spanDays > 365) {
    return date.toLocaleDateString([], { month: "short", year: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function selectAxisTicks(points, spanDays) {
  const days = new Map();
  points.forEach((point) => {
    if (!Number.isFinite(point.x)) return;
    const date = new Date(point.x);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!days.has(key)) days.set(key, point.x);
  });
  const dates = [...days.values()].sort((first, second) => first - second);
  if (spanDays <= 7) return dates;

  const spacingDays = spanDays > 365 ? 90 : spanDays > 31 ? 30 : 7;
  const ticks = [];
  let lastTick = -Infinity;
  dates.forEach((timestamp) => {
    if (!ticks.length || timestamp - lastTick >= spacingDays * DAY_MS) {
      ticks.push(timestamp);
      lastTick = timestamp;
    }
  });
  const finalDate = dates.at(-1);
  if (
    finalDate !== undefined &&
    finalDate !== ticks.at(-1) &&
    (ticks.length < 2 || finalDate - ticks.at(-1) >= spacingDays * 0.6 * DAY_MS)
  ) {
    ticks.push(finalDate);
  }
  return ticks;
}
