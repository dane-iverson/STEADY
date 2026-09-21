import React, { useMemo, useState } from "react";
import { BarChart3, ChevronLeft, Download, Info } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../components/Card";
import {
  exportTrendsToPdf,
  getReadingDateRange,
  GLUCOSE_RANGES,
  readingsForDateRange,
  statusOf,
} from "../utils/diabetes";

function formatReadingDate(dateValue, fallbackLabel = "Reading") {
  const stamp = dateValue ? new Date(dateValue) : null;

  if (stamp && !Number.isNaN(stamp.getTime())) {
    const time = stamp.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const day = stamp.toLocaleDateString([], { weekday: "short" });
    return `${day}, ${time}`;
  }

  return fallbackLabel;
}

const DISPLAY_RANGES = [
  ["Last 7 days", "Last 7 days"],
  ["Last 30 days", "Last 30 days"],
  ["Last 3 months", "Last 3 months"],
  ["Last 6 months", "Last 6 months"],
  ["This year", "This year"],
  ["All recordings", "All recordings"],
];

function formatRangeLabel(range, start, end) {
  if (range !== "Custom") return range;
  return `${start || "Start"} to ${end || "End"}`;
}

function buildTrendPoints(filteredReadings, mode) {
  const sorted = filteredReadings
    .map((reading) => ({
      ...reading,
      value: Number(reading.v),
      timestamp: reading.date ? new Date(reading.date) : new Date(),
    }))
    .filter(
      (reading) =>
        Number.isFinite(reading.value) &&
        !Number.isNaN(reading.timestamp.getTime()),
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  if (mode === "daily") {
    return sorted.map((reading) => ({
      t: formatReadingDate(reading.date, reading.time || "Reading"),
      v: reading.value,
    }));
  }

  const grouped = new Map();
  sorted.forEach((reading) => {
    const date = new Date(reading.timestamp);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
    if (!grouped.has(key)) grouped.set(key, { date: weekStart, values: [] });
    grouped.get(key).values.push(reading.value);
  });

  return [...grouped.values()].map(({ date, values }) => ({
    t: date.toLocaleDateString([], { day: "numeric", month: "short" }),
    v: values.reduce((sum, value) => sum + value, 0) / values.length,
  }));
}

export function TrendsPage({ readings = [], onBack, profile = {} }) {
  const [view, setView] = useState("daily");
  const [range, setRange] = useState("Last 7 days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportRange, setExportRange] = useState("Last 7 days");
  const [exportCustomStart, setExportCustomStart] = useState("");
  const [exportCustomEnd, setExportCustomEnd] = useState("");
  const [exportMode, setExportMode] = useState("both");
  const exportDateRange = useMemo(() => {
    if (exportRange === "All recordings") return null;
    if (exportRange === "Custom") {
      return getReadingDateRange(
        exportRange,
        exportCustomStart,
        exportCustomEnd,
      );
    }
    return getReadingDateRange(exportRange);
  }, [exportCustomEnd, exportCustomStart, exportRange]);
  const exportReadings = useMemo(
    () => readingsForDateRange(readings, exportDateRange),
    [exportDateRange, readings],
  );
  const exportDailyPoints = useMemo(
    () => buildTrendPoints(exportReadings, "daily"),
    [exportReadings],
  );
  const exportWeeklyPoints = useMemo(
    () => buildTrendPoints(exportReadings, "weekly"),
    [exportReadings],
  );
  const exportRangeInvalid = exportRange === "Custom" && !exportDateRange;
  const dateRange = useMemo(() => {
    if (range === "All recordings") return null;
    if (range === "Custom") {
      return getReadingDateRange(range, customStart, customEnd);
    }
    return getReadingDateRange(range);
  }, [customEnd, customStart, range]);
  const filteredReadings = useMemo(
    () => readingsForDateRange(readings, dateRange),
    [dateRange, readings],
  );
  const dailyPoints = useMemo(
    () => buildTrendPoints(filteredReadings, "daily"),
    [filteredReadings],
  );
  const weeklyPoints = useMemo(
    () => buildTrendPoints(filteredReadings, "weekly"),
    [filteredReadings],
  );
  const chartData = view === "daily" ? dailyPoints : weeklyPoints;
  const validValues = filteredReadings
    .map((reading) => Number(reading.v))
    .filter(Number.isFinite);
  const average = validValues.length
    ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    : null;
  const inRangeCount = filteredReadings.filter(
    (reading) =>
      statusOf(reading.v, reading.context || "Random").key === "target",
  ).length;
  const inRangePercent = validValues.length
    ? Math.round((inRangeCount / validValues.length) * 100)
    : 0;
  const customRangeInvalid = range === "Custom" && !dateRange;

  function exportPdf() {
    if (exportRangeInvalid) return;
    exportTrendsToPdf({
      readings: exportReadings,
      profile,
      dailyPoints: exportDailyPoints,
      weeklyPoints: exportWeeklyPoints,
      exportMode,
      rangeLabel: formatRangeLabel(
        exportRange,
        exportCustomStart,
        exportCustomEnd,
      ),
    });
    setExportOpen(false);
  }

  function openExport() {
    setExportRange(range);
    setExportCustomStart(customStart);
    setExportCustomEnd(customEnd);
    setExportOpen(true);
  }

  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <ChevronLeft size={16} /> Home
      </button>
      <div className="trendsHeader">
        <div>
          <h2 className="screenTitle">Your trends</h2>
          <p className="screenSub">
            See patterns over time, then share a clear report with your care
            team.
          </p>
        </div>
        <div className="trendsHeaderIcon">
          <BarChart3 size={22} />
        </div>
      </div>

      <div className="trendsControlGroup">
        <div className="sectionKicker">VIEW</div>
        <div className="chipRow">
          <button
            className={"chip" + (view === "daily" ? " chipActive" : "")}
            onClick={() => setView("daily")}
          >
            Daily
          </button>
          <button
            className={"chip" + (view === "weekly" ? " chipActive" : "")}
            onClick={() => setView("weekly")}
          >
            Weekly
          </button>
        </div>
        <label className="fieldLabel" htmlFor="trend-range">
          Date range
        </label>
        <select
          id="trend-range"
          className="textInput"
          value={range}
          onChange={(event) => setRange(event.target.value)}
        >
          {DISPLAY_RANGES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
          <option value="Custom">Custom dates</option>
        </select>
        {range === "Custom" && (
          <div className="trendDateGrid">
            <div>
              <label className="fieldLabel" htmlFor="trend-start">
                From
              </label>
              <input
                id="trend-start"
                className="textInput"
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </div>
            <div>
              <label className="fieldLabel" htmlFor="trend-end">
                To
              </label>
              <input
                id="trend-end"
                className="textInput"
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </div>
          </div>
        )}
        {customRangeInvalid && (
          <div className="exportValidation">
            Choose a valid start and end date.
          </div>
        )}
      </div>

      <div className="trendSummary">
        <div>
          <strong>{filteredReadings.length}</strong>
          <span>readings</span>
        </div>
        <div>
          <strong>{average === null ? "—" : average.toFixed(1)}</strong>
          <span>average mmol/L</span>
        </div>
        <div>
          <strong>{validValues.length ? `${inRangePercent}%` : "—"}</strong>
          <span>in range</span>
        </div>
      </div>

      <Card>
        <div className="trendChartHeading">
          <div>
            <div className="sectionKicker">
              {view === "daily" ? "READING BY READING" : "WEEK BY WEEK"}
            </div>
            <h3>{view === "daily" ? "Daily readings" : "Weekly averages"}</h3>
          </div>
          <span className="trendPeriodLabel">
            {formatRangeLabel(range, customStart, customEnd)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart
            data={chartData.length ? chartData : [{ t: "No data", v: 0 }]}
            margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
          >
            <CartesianGrid stroke="#E8E4D8" vertical={false} />
            {GLUCOSE_RANGES.map((band) => (
              <ReferenceArea
                key={band.key}
                y1={band.min}
                y2={band.max}
                fill={band.fill}
                fillOpacity={0.82}
              />
            ))}
            <XAxis
              dataKey="t"
              interval="preserveStartEnd"
              tick={{ fontSize: 11, fill: "#5B675E" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 18]}
              ticks={[0, 3, 4, 7.8, 14, 18]}
              tick={{ fontSize: 11, fill: "#5B675E" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #E2DED4",
                fontSize: 12,
                fontFamily: "Lexend",
              }}
              formatter={(v) => [`${Number(v).toFixed(1)} mmol/L`, "Reading"]}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="#176B5B"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#2D6A4F" }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="legendRow">
          <span>
            <i
              className="legendSwatch"
              style={{ background: "#2F9E6E33", border: "1px solid #2F9E6E" }}
            />{" "}
            Target range (4.0–7.8 mmol/L)
          </span>
        </div>
      </Card>

      <button
        className="btnPrimary trendsExportButton"
        type="button"
        onClick={openExport}
        disabled={!filteredReadings.length}
      >
        <Download size={16} /> Export trends report
      </button>
      <div className="trendHelp">
        <Info size={14} /> The target band is a guide. Your care team may set
        different targets for you.
      </div>

      {exportOpen && (
        <div
          className="modalBackdrop"
          role="presentation"
          onClick={() => setExportOpen(false)}
        >
          <section
            className="modalPanel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trend-export-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="exportPanelHeader">
              <div>
                <div className="sectionKicker">REPORT</div>
                <h3 id="trend-export-title">Export trends</h3>
              </div>
              <button
                className="iconBtn"
                type="button"
                aria-label="Close export dialog"
                onClick={() => setExportOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="exportPanelHint">
              Export the charts and readings for the selected period.
            </p>
            <label className="fieldLabel" htmlFor="trend-export-range">
              Date range
            </label>
            <select
              id="trend-export-range"
              className="textInput"
              value={exportRange}
              onChange={(event) => setExportRange(event.target.value)}
            >
              {DISPLAY_RANGES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
              <option value="Custom">Custom dates</option>
            </select>
            {exportRange === "Custom" && (
              <div className="trendDateGrid">
                <div>
                  <label className="fieldLabel" htmlFor="trend-export-start">
                    From
                  </label>
                  <input
                    id="trend-export-start"
                    className="textInput"
                    type="date"
                    value={exportCustomStart}
                    onChange={(event) =>
                      setExportCustomStart(event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="fieldLabel" htmlFor="trend-export-end">
                    To
                  </label>
                  <input
                    id="trend-export-end"
                    className="textInput"
                    type="date"
                    value={exportCustomEnd}
                    onChange={(event) => setExportCustomEnd(event.target.value)}
                  />
                </div>
              </div>
            )}
            {exportRangeInvalid && (
              <div className="exportValidation">
                Choose a valid start and end date.
              </div>
            )}
            <label className="fieldLabel" htmlFor="trend-export-mode">
              Include charts
            </label>
            <select
              id="trend-export-mode"
              className="textInput"
              value={exportMode}
              onChange={(event) => setExportMode(event.target.value)}
            >
              <option value="daily">Daily chart only</option>
              <option value="weekly">Weekly chart only</option>
              <option value="both">Daily and weekly charts</option>
            </select>
            <button
              className="btnPrimary exportButton"
              type="button"
              onClick={exportPdf}
              disabled={exportRangeInvalid || !exportReadings.length}
            >
              <Download size={16} /> Export PDF
            </button>
          </section>
        </div>
      )}

      <div className="tileGrid twoCol">
        <div className="miniStat">
          <span className={"statusTag statusTag-very-low"}>▼ Very low</span>
          <span className="miniStatDesc">0–2.9 mmol/L</span>
        </div>
        <div className="miniStat">
          <span className={"statusTag statusTag-low"}>▼ Low</span>
          <span className="miniStatDesc">3.0–3.9 mmol/L</span>
        </div>
        <div className="miniStat">
          <span className={"statusTag statusTag-target"}>● In range</span>
          <span className="miniStatDesc">4.0–7.8 mmol/L</span>
        </div>
        <div className="miniStat">
          <span className={"statusTag statusTag-high"}>▲ High</span>
          <span className="miniStatDesc">7.9–13.9 mmol/L</span>
        </div>
        <div className="miniStat">
          <span className={"statusTag statusTag-very-high"}>▲ Very high</span>
          <span className="miniStatDesc">14.0+ mmol/L</span>
        </div>
      </div>
      <p className="fineprint">
        This view is for spotting simple patterns. Talk to your care team about
        what your trends mean for your plan.
      </p>
    </div>
  );
}
