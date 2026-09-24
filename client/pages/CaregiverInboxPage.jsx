import React, { useEffect, useState } from "react";
import { Inbox, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { Card } from "../components/Card";

function TrendGraph({ points = [], title, glucoseRanges }) {
  if (!points.length) return null;
  const width = 320;
  const height = 130;
  const left = 28;
  const right = 8;
  const top = 12;
  const bottom = 24;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const targetMax = Number(glucoseRanges?.targetMax || 7.8);
  const lowMax = Number(glucoseRanges?.lowMax || 4);
  const scaleMax = Math.max(18, Number(glucoseRanges?.highMax || 14) + 4);
  const y = (value) =>
    top +
    chartHeight -
    (Math.min(scaleMax, Math.max(0, value)) / scaleMax) * chartHeight;
  const step =
    points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
  const coordinates = points.map((point, index) => [
    left + (points.length > 1 ? index * step : chartWidth / 2),
    y(point.v),
  ]);
  const path = coordinates
    .map(
      ([x, pointY], index) =>
        `${index ? "L" : "M"}${x.toFixed(1)},${pointY.toFixed(1)}`,
    )
    .join(" ");
  const labelIndexes =
    points.length > 7
      ? [0, Math.floor(points.length / 2), points.length - 1]
      : points.map((_, index) => index);

  return (
    <div className="caregiverTrendGraph">
      <div className="caregiverTrendGraphTitle">{title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <rect
          x={left}
          y={y(targetMax)}
          width={chartWidth}
          height={y(lowMax) - y(targetMax)}
          fill="#e3f2ec"
        />
        {[0, lowMax, targetMax, scaleMax].map((tick) => (
          <line
            key={tick}
            x1={left}
            y1={y(tick)}
            x2={width - right}
            y2={y(tick)}
            stroke="#d7e3df"
          />
        ))}
        <path
          d={path}
          fill="none"
          stroke="#176b5b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coordinates.map(([x, pointY], index) => (
          <circle
            key={`${x}-${pointY}`}
            cx={x}
            cy={pointY}
            r="3"
            fill="#176b5b"
          >
            <title>
              {points[index].t}: {Number(points[index].v).toFixed(1)} mmol/L
            </title>
          </circle>
        ))}
        {labelIndexes.map((index) => (
          <text
            key={index}
            x={coordinates[index][0]}
            y={height - 7}
            textAnchor="middle"
          >
            {points[index].t}
          </text>
        ))}
        <text x="22" y={y(scaleMax) + 3} textAnchor="end">
          {scaleMax}
        </text>
        <text x="22" y={y(0) + 3} textAnchor="end">
          0
        </text>
      </svg>
    </div>
  );
}

export function CaregiverInboxPage({
  name,
  email,
  sharedItems = [],
  onRefresh,
  onLogout,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const interval = window.setInterval(() => {
      onRefresh?.().catch(() => {});
    }, 5000);
    return () => window.clearInterval(interval);
  }, [onRefresh]);

  async function refreshInbox() {
    setRefreshing(true);
    setRefreshMessage("");
    try {
      await onRefresh?.();
      setRefreshMessage("Inbox refreshed.");
    } catch (error) {
      setRefreshMessage(error.message);
    } finally {
      setRefreshing(false);
    }
  }

  const visibleItems = [...sharedItems]
    .filter((item) => filterType === "all" || item.type === filterType)
    .sort((first, second) => {
      const firstDate = new Date(first.sharedAt).getTime();
      const secondDate = new Date(second.sharedAt).getTime();
      return sortBy === "oldest"
        ? firstDate - secondDate
        : secondDate - firstDate;
    });

  return (
    <div className="screen caregiverInboxScreen">
      <div className="caregiverWelcomeHeader">
        <div>
          <span className="sectionKicker">CAREGIVER ACCOUNT</span>
          <h2 className="screenTitle">Shared with me</h2>
          <p className="screenSub">
            Health information shared with you through Steady.
          </p>
        </div>
        <div className="trendsHeaderIcon">
          <Inbox size={22} />
        </div>
      </div>

      <div className="caregiverAccountStrip">
        <ShieldCheck size={16} />
        <span>
          Signed in as <strong>{name || email}</strong>. This is a read-only
          view.
        </span>
      </div>

      <div className="sectionHeading caregiverInboxHeading">
        <div>
          <div className="sectionKicker">INBOX</div>
          <h3>
            {visibleItems.length
              ? `${visibleItems.length} item${visibleItems.length === 1 ? "" : "s"}`
              : "Nothing shared yet"}
          </h3>
        </div>
        <button
          className="iconBtn"
          type="button"
          onClick={refreshInbox}
          disabled={refreshing}
          aria-label="Refresh shared inbox"
        >
          <RefreshCw size={16} className={refreshing ? "spin" : ""} />
        </button>
      </div>
      {refreshMessage && (
        <div className="dateFieldHint" role="status">
          {refreshMessage}
        </div>
      )}

      <div className="caregiverInboxControls">
        <select
          className="textInput"
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
          aria-label="Filter shared items"
        >
          <option value="all">All shared data</option>
          <option value="glucose">Glucose readings</option>
          <option value="trends">Trend summaries</option>
          <option value="reminders">Reminder activity</option>
          <option value="hba1c">HbA1c results</option>
        </select>
        <select
          className="textInput"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          aria-label="Sort shared items"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {visibleItems.length ? (
        visibleItems.map((item) => (
          <Card className="caregiverSharedCard" key={item.id}>
            <div className="rowBetween">
              <div className="cardMainLine">{item.title}</div>
              <span className="sharedItemUnread">{item.type || "Update"}</span>
            </div>
            <div className="mutedSmall">
              {item.senderName ? `${item.senderName} · ` : ""}Shared{" "}
              {new Date(item.sharedAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </div>
            <p className="caregiverSharedDetail">{item.detail}</p>
            {item.data && (
              <div className="caregiverDataGrid">
                {item.type === "glucose" && (
                  <>
                    <div>
                      <span>Reading</span>
                      <strong>
                        {item.data.value ?? "--"} {item.data.unit}
                      </strong>
                    </div>
                    <div>
                      <span>Context</span>
                      <strong>{item.data.context}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{item.data.status || "Not classified"}</strong>
                    </div>
                    <div>
                      <span>Recorded</span>
                      <strong>
                        {item.data.readingAt
                          ? new Date(item.data.readingAt).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Not provided"}
                      </strong>
                    </div>
                  </>
                )}
                {item.type === "trends" && (
                  <>
                    <div>
                      <span>Readings</span>
                      <strong>{item.data.readingCount}</strong>
                    </div>
                    <div>
                      <span>Average</span>
                      <strong>
                        {item.data.averageGlucose == null
                          ? "--"
                          : `${Number(item.data.averageGlucose).toFixed(1)} mmol/L`}
                      </strong>
                    </div>
                    <div>
                      <span>Period</span>
                      <strong>
                        {item.data.rangeLabel || "Selected period"}
                      </strong>
                    </div>
                    <div>
                      <span>Graphs</span>
                      <strong>
                        {item.data.chartMode === "both"
                          ? "Daily and weekly"
                          : item.data.chartMode}
                      </strong>
                    </div>
                    {(item.data.chartMode === "daily" ||
                      item.data.chartMode === "both") && (
                      <TrendGraph
                        points={item.data.dailyPoints}
                        title="Daily graph"
                        glucoseRanges={item.data.glucoseRanges}
                      />
                    )}
                    {(item.data.chartMode === "weekly" ||
                      item.data.chartMode === "both") && (
                      <TrendGraph
                        points={item.data.weeklyPoints}
                        title="Weekly graph"
                        glucoseRanges={item.data.glucoseRanges}
                      />
                    )}
                  </>
                )}
                {item.type === "reminders" && (
                  <>
                    <div>
                      <span>Reminder</span>
                      <strong>
                        {item.data.reminderTitle || "Not provided"}
                      </strong>
                    </div>
                    <div>
                      <span>Completed items</span>
                      <strong>{item.data.completedCount}</strong>
                    </div>
                    <div>
                      <span>Active reminders</span>
                      <strong>{item.data.activeCount}</strong>
                    </div>
                  </>
                )}
                {item.type === "hba1c" && (
                  <>
                    <div>
                      <span>Result</span>
                      <strong>
                        {item.data.value
                          ? `${item.data.value}${item.data.unit}`
                          : "Not provided"}
                      </strong>
                    </div>
                    <div>
                      <span>Test date</span>
                      <strong>{item.data.testedAt || "Not provided"}</strong>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>
        ))
      ) : (
        <Card className="caregiverEmptyCard">
          <Inbox size={24} />
          <div className="cardMainLine">Your inbox is empty</div>
          <p className="mutedSmall">
            When a patient connects with your caregiver account and shares an
            update, it will appear here.
          </p>
        </Card>
      )}

      <div style={{ flex: 1 }} />
      <button className="btnGhost" type="button" onClick={onLogout}>
        <LogOut size={15} /> Log out
      </button>
    </div>
  );
}
