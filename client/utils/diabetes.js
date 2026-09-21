export const GLUCOSE_RANGES = [
  {
    key: "very-low",
    label: "Very low",
    min: 0,
    max: 3,
    color: "#B94747",
    fill: "#FDECEC",
  },
  {
    key: "low",
    label: "Low",
    min: 3,
    max: 4,
    color: "#3E7CB8",
    fill: "#E5EFF8",
  },
  {
    key: "target",
    label: "In range",
    min: 4,
    max: 7.8,
    color: "#2F9E6E",
    fill: "#E3F2EC",
  },
  {
    key: "high",
    label: "High",
    min: 7.8,
    max: 14,
    color: "#C1622B",
    fill: "#F7E9E0",
  },
  {
    key: "very-high",
    label: "Very high",
    min: 14,
    max: 18,
    color: "#A6531C",
    fill: "#FBE6D8",
  },
];

export function glucoseRangePosition(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(100, Math.max(0, (numericValue / 18) * 100));
}

export function ageGroupFromDateOfBirth(dateOfBirth, today = new Date()) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (!dateOfBirth || Number.isNaN(birthDate.getTime()) || birthDate > today) {
    return null;
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayThisYear = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
  );
  if (birthdayThisYear > today) age -= 1;

  if (age <= 12) return "child";
  if (age <= 18) return "teen";
  return "young_adult";
}

export function getTimeOfDayGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function fmt(v) {
  return Number(v).toFixed(1);
}

export function normalizeDecimalInput(value) {
  return String(value ?? "").replace(/,/g, ".");
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
    v: Number(normalizeDecimalInput(value)),
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getReadingDateRange(
  range = "All recordings",
  customStart = "",
  customEnd = "",
  now = new Date(),
) {
  if (range === "Custom") {
    const start = customStart ? new Date(`${customStart}T00:00:00`) : null;
    const end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : null;
    if (
      !start ||
      !end ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return null;
    }
    return { start, end };
  }

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "Today") return { start, end };
  if (range === "This week") {
    start.setDate(start.getDate() - start.getDay());
    return { start, end };
  }
  if (range === "This month") {
    start.setDate(1);
    return { start, end };
  }
  if (range === "Last 7 days") {
    start.setDate(start.getDate() - 6);
    return { start, end };
  }
  if (range === "Last 30 days") {
    start.setDate(start.getDate() - 29);
    return { start, end };
  }
  if (range === "Last 3 months") {
    start.setMonth(start.getMonth() - 3);
    return { start, end };
  }
  if (range === "Last 6 months") {
    start.setMonth(start.getMonth() - 6);
    return { start, end };
  }
  if (range === "This year") {
    start.setMonth(0, 1);
    return { start, end };
  }

  return null;
}

export function readingsForDateRange(readings = [], dateRange) {
  if (!dateRange) return [...readings];
  return readings.filter((reading) => {
    const date = new Date(reading.date);
    return (
      !Number.isNaN(date.getTime()) &&
      date >= dateRange.start &&
      date <= dateRange.end
    );
  });
}

export function exportReadingsToPdf({
  readings = [],
  profile = {},
  reminders = [],
  dateRange = null,
  rangeLabel = "All recordings",
}) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return false;

  const filteredReadings = readingsForDateRange(readings, dateRange);
  const sortedReadings = [...filteredReadings].reverse();
  const displayValue = (value) => escapeHtml(value || "Not provided");
  const readingRows = sortedReadings.length
    ? sortedReadings
        .map((reading) => {
          const status = statusOf(reading.v, reading.context || "Random");
          return `<tr><td>${escapeHtml(reading.time || formatReadingStamp(reading.date))}</td><td>${Number(reading.v).toFixed(1)} mmol/L</td><td>${escapeHtml(reading.context || "Random")}</td><td><span class="status status-${status.key}">${escapeHtml(status.label)}</span></td></tr>`;
        })
        .join("")
    : '<tr><td colspan="4" class="empty">No saved readings.</td></tr>';
  const reminderRows = reminders.length
    ? reminders
        .map(
          (reminder) =>
            `<tr><td>${displayValue(reminder.title)}</td><td>${displayValue(reminder.kind)}</td><td>${displayValue(reminder.repeat)}</td><td>${reminder.on ? "Active" : "Off"}</td></tr>`,
        )
        .join("")
    : '<tr><td colspan="4" class="empty">No reminders saved.</td></tr>';
  const generatedAt = formatReadingStamp(new Date());

  printWindow.document
    .write(`<!doctype html><html><head><title>Steady glucose report</title><style>
    @page { size: A4; margin: 16mm; }
    :root { color-scheme: light; font-family: Arial, sans-serif; color: #1e2a22; }
    body { margin: 0; font-size: 11px; line-height: 1.45; }
    header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #176b5b; padding-bottom: 14px; margin-bottom: 18px; }
    h1 { color: #176b5b; font-size: 25px; margin: 0 0 3px; } h2 { font-size: 15px; margin: 22px 0 8px; color: #0e4c42; }
    p { margin: 0; color: #5b675e; } .generated { text-align: right; font-size: 10px; }
    .details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 18px; background: #eef4f2; padding: 12px; }
    .detail label { display: block; color: #5b675e; font-size: 9px; text-transform: uppercase; letter-spacing: .6px; } .detail strong { font-size: 11px; }
    table { width: 100%; border-collapse: collapse; } th { background: #dcefea; color: #0e4c42; text-align: left; font-size: 10px; } th, td { padding: 8px 7px; border-bottom: 1px solid #d7e3df; } tr { page-break-inside: avoid; }
    .status { display: inline-block; border-radius: 12px; padding: 2px 7px; background: #e3f2ec; color: #2f9e6e; } .status-low { background: #e5eff8; color: #3e7cb8; } .status-very-low { background: #fdecec; color: #b94747; } .status-high, .status-very-high { background: #f7e9e0; color: #a6531c; } .empty { text-align: center; color: #5b675e; }
    footer { margin-top: 24px; padding-top: 9px; border-top: 1px solid #d7e3df; color: #5b675e; font-size: 9px; }
  </style></head><body><header><div><h1>Steady</h1><p>Glucose and care record</p></div><div class="generated">Generated<br>${escapeHtml(generatedAt)}</div></header>
  <h2>Patient details</h2><div class="details"><div class="detail"><label>Name</label><strong>${displayValue(`${profile.name || ""} ${profile.surname || ""}`.trim())}</strong></div><div class="detail"><label>Date of birth</label><strong>${displayValue(profile.dateOfBirth)}</strong></div><div class="detail"><label>Diabetes status</label><strong>${displayValue(profile.status)}</strong></div><div class="detail"><label>Height</label><strong>${displayValue(profile.height)}</strong></div><div class="detail"><label>Weight</label><strong>${displayValue(profile.weight)}</strong></div><div class="detail"><label>Gender</label><strong>${displayValue(profile.gender)}</strong></div><div class="detail"><label>Allergies</label><strong>${displayValue(profile.allergies)}</strong></div><div class="detail"><label>Other medication</label><strong>${displayValue(profile.otherMedication)}</strong></div><div class="detail"><label>Emergency contact</label><strong>${displayValue(`${profile.contactName || ""} ${profile.contactNumber || ""}`.trim())}</strong></div></div>
  <h2>Saved glucose readings (${filteredReadings.length})</h2><p>Export range: ${escapeHtml(rangeLabel)}</p><table><thead><tr><th>Date and time</th><th>Reading</th><th>Context</th><th>Status</th></tr></thead><tbody>${readingRows}</tbody></table>
  <h2>Saved reminders</h2><table><thead><tr><th>Reminder</th><th>Type</th><th>Repeats</th><th>Status</th></tr></thead><tbody>${reminderRows}</tbody></table>
  <footer>This report contains data stored in Steady. It is intended to support conversations with your healthcare team and does not replace medical advice.</footer></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.addEventListener("load", () => printWindow.print(), {
    once: true,
  });
  return true;
}

function trendChartSvg(points, title) {
  const width = 760;
  const height = 250;
  const left = 54;
  const right = 18;
  const top = 22;
  const bottom = 46;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const xStep =
    points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
  const y = (value) =>
    top + chartHeight - (Math.min(18, Math.max(0, value)) / 18) * chartHeight;
  const yTicks = [0, 3, 4, 7.8, 14, 18];
  const pointCoordinates = points.map((point, index) => [
    left + (points.length > 1 ? index * xStep : chartWidth / 2),
    y(point.v),
  ]);
  const path = pointCoordinates
    .map(
      ([x, pointY], index) =>
        `${index ? "L" : "M"}${x.toFixed(1)},${pointY.toFixed(1)}`,
    )
    .join(" ");
  const labelStep = points.length > 8 ? Math.ceil((points.length - 1) / 7) : 1;
  const labelIndexes = points.reduce((indexes, point, index) => {
    if (index === 0 || index === points.length - 1 || index % labelStep === 0) {
      indexes.push(index);
    }
    return indexes;
  }, []);
  const labels = labelIndexes
    .map((index) => {
      const point = points[index];
      const [x] = pointCoordinates[index];
      return `<text x="${x.toFixed(1)}" y="${height - 14}" text-anchor="middle">${escapeHtml(point.t)}</text>`;
    })
    .join("");
  const dots = pointCoordinates
    .map(
      ([x, pointY], index) =>
        `<circle cx="${x.toFixed(1)}" cy="${pointY.toFixed(1)}" r="4" fill="#176b5b"><title>${escapeHtml(points[index].t)}: ${Number(points[index].v).toFixed(1)} mmol/L</title></circle>`,
    )
    .join("");
  const rangeBands = GLUCOSE_RANGES.map(
    (band) =>
      `<rect x="${left}" y="${y(band.max)}" width="${chartWidth}" height="${y(band.min) - y(band.max)}" fill="${band.fill}" fill-opacity=".82"/>`,
  ).join("");
  const gridLines = yTicks
    .map(
      (tick) =>
        `<line x1="${left}" y1="${y(tick)}" x2="${width - right}" y2="${y(tick)}" stroke="#d7e3df" stroke-width="1"/><text x="${left - 9}" y="${y(tick) + 3.5}" text-anchor="end">${tick}</text>`,
    )
    .join("");

  return `<div class="chartBlock"><h3>${escapeHtml(title)}</h3><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)} glucose trend">${rangeBands}${gridLines}<path d="${path}" fill="none" stroke="#176b5b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}${labels}</svg></div>`;
}

export function exportTrendsToPdf({
  readings = [],
  profile = {},
  dailyPoints = [],
  weeklyPoints = [],
  exportMode = "both",
  rangeLabel = "Selected period",
}) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return false;

  const selectedCharts = [];
  if (exportMode === "daily" || exportMode === "both") {
    selectedCharts.push(trendChartSvg(dailyPoints, "Daily readings"));
  }
  if (exportMode === "weekly" || exportMode === "both") {
    selectedCharts.push(trendChartSvg(weeklyPoints, "Weekly averages"));
  }
  const sortedReadings = [...readings].sort(
    (first, second) => new Date(second.date) - new Date(first.date),
  );
  const readingRows = sortedReadings.length
    ? sortedReadings
        .map((reading) => {
          const status = statusOf(reading.v, reading.context || "Random");
          return `<tr><td>${escapeHtml(reading.time || formatReadingStamp(reading.date))}</td><td>${Number(reading.v).toFixed(1)} mmol/L</td><td>${escapeHtml(reading.context || "Random")}</td><td>${escapeHtml(status.label)}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="4" class="empty">No readings in this period.</td></tr>';
  const generatedAt = formatReadingStamp(new Date());
  const displayValue = (value) => escapeHtml(value || "Not provided");

  printWindow.document
    .write(`<!doctype html><html><head><title>Steady trends report</title><style>
    @page { size: A4; margin: 14mm; } :root { color-scheme: light; font-family: Arial, sans-serif; color: #1e2a22; } body { margin: 0; font-size: 11px; line-height: 1.45; } header { display: flex; justify-content: space-between; border-bottom: 3px solid #176b5b; padding-bottom: 14px; margin-bottom: 16px; } h1 { color: #176b5b; font-size: 25px; margin: 0 0 3px; } h2 { color: #0e4c42; font-size: 15px; margin: 20px 0 8px; } h3 { color: #0e4c42; font-size: 13px; margin: 0 0 5px; } p { margin: 0; color: #5b675e; } .generated { text-align: right; color: #5b675e; font-size: 10px; } .details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 18px; background: #eef4f2; padding: 12px; } .detail label { display: block; color: #5b675e; font-size: 9px; text-transform: uppercase; letter-spacing: .6px; } .detail strong { font-size: 11px; } .chartBlock { margin: 12px 0 18px; border: 1px solid #d7e3df; padding: 10px; page-break-inside: avoid; } svg { display: block; width: 100%; height: auto; } svg text { fill: #5b675e; font-size: 10px; } table { width: 100%; border-collapse: collapse; } th { background: #dcefea; color: #0e4c42; text-align: left; font-size: 10px; } th, td { padding: 7px; border-bottom: 1px solid #d7e3df; } .empty { text-align: center; color: #5b675e; } footer { margin-top: 20px; padding-top: 9px; border-top: 1px solid #d7e3df; color: #5b675e; font-size: 9px; }
  </style></head><body><header><div><h1>Steady</h1><p>Glucose trends report</p></div><div class="generated">Generated<br>${escapeHtml(generatedAt)}</div></header><h2>Report period</h2><p>${escapeHtml(rangeLabel)}</p><div class="details"><div class="detail"><label>Name</label><strong>${displayValue(`${profile.name || ""} ${profile.surname || ""}`.trim())}</strong></div><div class="detail"><label>Diabetes status</label><strong>${displayValue(profile.status)}</strong></div><div class="detail"><label>Readings</label><strong>${readings.length}</strong></div></div><h2>Glucose trends</h2>${selectedCharts.join("")}<h2>Readings used (${readings.length})</h2><table><thead><tr><th>Date and time</th><th>Reading</th><th>Context</th><th>Status</th></tr></thead><tbody>${readingRows}</tbody></table><footer>This report helps you discuss patterns with your healthcare team and does not replace medical advice.</footer></body></html>`);
  let hasPrinted = false;
  const printReport = () => {
    if (hasPrinted) return;
    hasPrinted = true;
    printWindow.focus();
    printWindow.print();
  };
  printWindow.addEventListener("load", printReport, { once: true });
  printWindow.document.close();
  window.setTimeout(printReport, 250);
  return true;
}
