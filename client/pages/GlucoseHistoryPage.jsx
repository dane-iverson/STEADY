import React, { useState } from "react";
import { ChevronLeft, Download, Plus } from "lucide-react";
import { Card } from "../components/Card";
import {
  exportReadingsToPdf,
  formatReadingStamp,
  getReadingDateRange,
  readingsForDateRange,
  statusOf,
} from "../utils/diabetes.js";

const DISPLAY_RANGES = [
  "All recordings",
  "Today",
  "This week",
  "This month",
  "Last 7 days",
  "Last 30 days",
  "Last 3 months",
  "Last 6 months",
  "This year",
];

const READING_TYPES = ["All types", "Before meal", "After meal", "Random"];

function sortReadings(readings, sortBy) {
  return [...readings].sort((first, second) => {
    if (sortBy === "highest") return Number(second.v) - Number(first.v);
    if (sortBy === "lowest") return Number(first.v) - Number(second.v);
    if (sortBy === "type") {
      return (first.context || "Random").localeCompare(
        second.context || "Random",
      );
    }

    const firstDate = new Date(first.date).getTime();
    const secondDate = new Date(second.date).getTime();
    return sortBy === "oldest"
      ? firstDate - secondDate
      : secondDate - firstDate;
  });
}

export function GlucoseHistoryPage({
  readings = [],
  onEdit,
  onDelete,
  onNew,
  onBack,
  profile,
  reminders,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [exportRange, setExportRange] = useState("All recordings");
  const [exportType, setExportType] = useState("All types");
  const [exportSort, setExportSort] = useState("newest");
  const [displayRange, setDisplayRange] = useState("Last 7 days");
  const [displayType, setDisplayType] = useState("All types");
  const [sortBy, setSortBy] = useState("newest");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const displayDateRange = getReadingDateRange(displayRange);
  const displayedReadings = readingsForDateRange(
    readings,
    displayDateRange,
  ).filter(
    (reading) =>
      displayType === "All types" ||
      (reading.context || "Random") === displayType,
  );
  const sortedReadings = sortReadings(displayedReadings, sortBy);
  const customRangeInvalid =
    exportRange === "Custom" &&
    !getReadingDateRange(exportRange, customStart, customEnd);

  function exportPdf() {
    const dateRange = getReadingDateRange(exportRange, customStart, customEnd);
    if (customRangeInvalid) return;
    const exportReadings = sortReadings(
      readingsForDateRange(readings, dateRange).filter(
        (reading) =>
          exportType === "All types" ||
          (reading.context || "Random") === exportType,
      ),
      exportSort,
    );
    exportReadingsToPdf({
      readings: exportReadings,
      profile,
      reminders,
      dateRange: null,
      rangeLabel:
        exportRange === "Custom"
          ? `${customStart} to ${customEnd}`
          : exportRange,
    });
    setExportOpen(false);
  }

  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <ChevronLeft size={16} /> Back
      </button>

      <h2 className="screenTitle">Saved readings</h2>
      <p className="screenSub">All previous glucose entries.</p>

      <button className="btnPrimary" type="button" onClick={onNew}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} />
          Add new reading
        </span>
      </button>

      <section className="exportPanel" aria-labelledby="export-title">
        <div className="exportPanelHeader">
          <div>
            <div className="sectionKicker">REPORT</div>
            <h3 id="export-title">Export glucose record</h3>
          </div>
          <Download size={18} aria-hidden="true" />
        </div>
        <p className="exportPanelHint">
          Choose which saved readings to include in your PDF.
        </p>
        <button
          className="btnPrimary exportButton"
          type="button"
          onClick={() => setExportOpen(true)}
        >
          <Download size={16} />
          Export to PDF
        </button>
      </section>

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
            aria-labelledby="export-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="exportPanelHeader">
              <div>
                <div className="sectionKicker">REPORT</div>
                <h3 id="export-title">Export glucose record</h3>
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
            <div className="exportOptions">
              <label className="fieldLabel" htmlFor="export-range">
                Date range
              </label>
              <select
                id="export-range"
                className="textInput"
                value={exportRange}
                onChange={(event) => setExportRange(event.target.value)}
              >
                {[
                  "All recordings",
                  "Today",
                  "This week",
                  "This month",
                  "Last 7 days",
                  "Last 30 days",
                  "Last 3 months",
                  "Last 6 months",
                  "This year",
                  "Custom",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {exportRange === "Custom" && (
                <div className="exportDateGrid">
                  <div>
                    <label className="fieldLabel" htmlFor="export-start">
                      From
                    </label>
                    <input
                      id="export-start"
                      className="textInput"
                      type="date"
                      value={customStart}
                      onChange={(event) => setCustomStart(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="fieldLabel" htmlFor="export-end">
                      To
                    </label>
                    <input
                      id="export-end"
                      className="textInput"
                      type="date"
                      value={customEnd}
                      onChange={(event) => setCustomEnd(event.target.value)}
                    />
                  </div>
                </div>
              )}
              <label className="fieldLabel" htmlFor="export-type">
                Reading type
              </label>
              <select
                id="export-type"
                className="textInput"
                value={exportType}
                onChange={(event) => setExportType(event.target.value)}
              >
                {READING_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <label className="fieldLabel" htmlFor="export-sort">
                Sort by
              </label>
              <select
                id="export-sort"
                className="textInput"
                value={exportSort}
                onChange={(event) => setExportSort(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Higher glucose first</option>
                <option value="lowest">Lower glucose first</option>
                <option value="type">Reading type</option>
              </select>
              {customRangeInvalid && (
                <div className="exportValidation" role="status">
                  Choose a valid start and end date.
                </div>
              )}
            </div>
            <button
              className="btnPrimary exportButton"
              type="button"
              disabled={customRangeInvalid}
              onClick={exportPdf}
            >
              <Download size={16} /> Export to PDF
            </button>
          </section>
        </div>
      )}

      <section
        className="readingOptions"
        aria-labelledby="reading-options-title"
      >
        <div className="sectionHeading">
          <div>
            <div className="sectionKicker">SAVED READINGS</div>
            <h3 id="reading-options-title">Choose what to display</h3>
          </div>
          <span className="sectionHeadingMeta">
            {sortedReadings.length} shown
          </span>
        </div>
        <div className="readingOptionGrid">
          <div>
            <label className="fieldLabel" htmlFor="display-range">
              Date range
            </label>
            <select
              id="display-range"
              className="textInput"
              value={displayRange}
              onChange={(event) => setDisplayRange(event.target.value)}
            >
              {DISPLAY_RANGES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fieldLabel" htmlFor="display-type">
              Reading type
            </label>
            <select
              id="display-type"
              className="textInput"
              value={displayType}
              onChange={(event) => setDisplayType(event.target.value)}
            >
              {READING_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fieldLabel" htmlFor="reading-sort">
              Sort by
            </label>
            <select
              id="reading-sort"
              className="textInput"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Higher glucose first</option>
              <option value="lowest">Lower glucose first</option>
              <option value="type">Reading type</option>
            </select>
          </div>
        </div>
      </section>

      {sortedReadings.length === 0 ? (
        <Card style={{ marginTop: 18 }}>
          <div className="cardMainLine">No saved readings yet.</div>
          <div className="mutedSmall" style={{ marginTop: 8 }}>
            Add your first reading to start building your log.
          </div>
        </Card>
      ) : (
        <div className="listCol" style={{ marginTop: 18 }}>
          {sortedReadings.map((reading) => {
            const status = statusOf(reading.v, reading.context || "Random");
            return (
              <div
                key={reading.id}
                className="listRow"
                style={{ alignItems: "flex-start" }}
              >
                <div className="listRowLabel">
                  <div style={{ fontWeight: 600 }}>
                    {Number(reading.v).toFixed(1)} mmol/L
                  </div>
                  <div className="mutedSmall">
                    {reading.context || "Random"} ·{" "}
                    {reading.time ||
                      formatReadingStamp(reading.date || new Date())}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "flex-end",
                  }}
                >
                  <span
                    className={"statusTag statusTag-" + status.key}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {status.symbol} {status.label}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="miniAction"
                      onClick={() => onEdit(reading)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="miniAction danger"
                      onClick={() => onDelete(reading.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
