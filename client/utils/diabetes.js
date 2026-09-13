export function fmt(v) {
  return Number(v).toFixed(1);
}

export function formatReadingStamp(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Reading";

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const hour12 = ((hours + 11) % 12) + 1;

  return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}, ${hour12}:${minutes}${ampm}`;
}

export function buildReadingEntry(
  value,
  context = "Random",
  dateValue = new Date(),
  explicitDate = null,
  explicitTime = null,
) {
  const baseDate =
    dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);
  const fallbackDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;

  let nextDate = fallbackDate;
  if (explicitDate || explicitTime) {
    const datePart = explicitDate || fallbackDate.toISOString().slice(0, 10);
    const timePart = explicitTime || "00:00";
    const candidate = new Date(`${datePart}T${timePart}:00`);
    if (!Number.isNaN(candidate.getTime())) {
      nextDate = candidate;
    }
  }

  return {
    id: `reading-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    v: Number(value),
    context,
    date: nextDate.toISOString(),
    time: formatReadingStamp(nextDate),
  };
}

function classifyReading(v, context = "Random") {
  if (v < 0) {
    return { label: "Very low", key: "very-low", symbol: "▼" };
  }

  if (context === "Before meal") {
    if (v < 3) return { label: "Very low", key: "very-low", symbol: "▼" };
    if (v < 4) return { label: "Low", key: "low", symbol: "▼" };
    if (v < 7.0) return { label: "In range", key: "target", symbol: "●" };
    if (v < 14) return { label: "High", key: "high", symbol: "▲" };
    return { label: "Very high", key: "very-high", symbol: "▲" };
  }

  if (context === "After meal") {
    if (v < 3) return { label: "Very low", key: "very-low", symbol: "▼" };
    if (v < 4) return { label: "Low", key: "low", symbol: "▼" };
    if (v < 4.4) return { label: "Low", key: "low", symbol: "▼" };
    if (v < 7.8) return { label: "In range", key: "target", symbol: "●" };
    if (v < 14) return { label: "High", key: "high", symbol: "▲" };
    return { label: "Very high", key: "very-high", symbol: "▲" };
  }

  if (v < 3) return { label: "Very low", key: "very-low", symbol: "▼" };
  if (v < 4) return { label: "Low", key: "low", symbol: "▼" };
  if (v < 7.8) return { label: "In range", key: "target", symbol: "●" };
  if (v < 14) return { label: "High", key: "high", symbol: "▲" };
  return { label: "Very high", key: "very-high", symbol: "▲" };
}

export function statusOf(v, context = "Random") {
  return classifyReading(Number(v), context);
}
