import React, { useState } from "react";
import { ChevronLeft, Download, Plus } from "lucide-react";
import { Card } from "../components/Card";
import {
  exportReadingsToPdf,
  formatReadingStamp,
  getReadingDateRange,
  statusOf,
} from "../utils/diabetes.js";

export function GlucoseHistoryPage({
  readings = [],
  onEdit,
  onDelete,
  onNew,
  onBack,
  profile,
  reminders,
}) {
  const [exportRange, setExportRange] = useState("All recordings");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const sortedReadings = [...readings].reverse();
  const customRangeInvalid =
    exportRange === "Custom" &&
    !getReadingDateRange(exportRange, customStart, customEnd);

  function exportPdf() {
    const dateRange = getReadingDateRange(exportRange, customStart, customEnd);
    if (customRangeInvalid) return;
    exportReadingsToPdf({
      readings,
      profile,
      reminders,
      dateRange,
      rangeLabel:
        exportRange === "Custom"
          ? `${customStart} to ${customEnd}`
          : exportRange,
    });
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
          <Download size={16} />
          Export to PDF
        </button>
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
