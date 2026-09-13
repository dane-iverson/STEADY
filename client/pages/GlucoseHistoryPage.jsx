import React from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { Card } from "../components/Card";
import { formatReadingStamp, statusOf } from "../utils/diabetes.js";

export function GlucoseHistoryPage({
  readings = [],
  onEdit,
  onDelete,
  onNew,
  onBack,
}) {
  const sortedReadings = [...readings].reverse();

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
