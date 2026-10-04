import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Inbox,
  LogOut,
  Percent,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Card } from "../components/Card";

const PREVIEW_COUNT = 5;
const PAGE_SIZE = 10;

const TYPE_META = {
  glucose: { label: "Glucose", Icon: Droplet },
  trends: { label: "Trends", Icon: TrendingUp },
  reminders: { label: "Reminders", Icon: Bell },
  hba1c: { label: "HbA1c", Icon: Percent },
};

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
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const listRef = useRef(null);

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

  const total = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = expanded
    ? visibleItems.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
    : visibleItems.slice(0, PREVIEW_COUNT);
  const rangeStart = safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, (safePage + 1) * PAGE_SIZE);

  function resetPaging() {
    setExpanded(false);
    setPage(0);
  }

  function goToPage(next) {
    setPage(next);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const displayName = name || email || "Caregiver";

  return (
    <div className="screen caregiverInboxScreen">
      <div className="caregiverHeader">
        <div>
          <span className="sectionKicker">CAREGIVER ACCOUNT</span>
          <h2 className="screenTitle">Shared with me</h2>
          <p className="screenSub">
            Health information shared with you through Steady.
          </p>
        </div>
        <button
          className="caregiverLogout"
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="caregiverAccountStrip">
        <div className="caregiverAvatar">{displayName.charAt(0)}</div>
        <div>
          <strong>{displayName}</strong>
          <span>Read-only access to updates shared with you</span>
        </div>
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

      <div className="caregiverInboxControls" ref={listRef}>
        <select
          className="textInput"
          value={filterType}
          onChange={(event) => {
            setFilterType(event.target.value);
            resetPaging();
          }}
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
          onChange={(event) => {
            setSortBy(event.target.value);
            resetPaging();
          }}
          aria-label="Sort shared items"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {visibleItems.length ? (
        pageItems.map((item) => {
          const meta = TYPE_META[item.type];
          return (
            <Card
              className={`caregiverSharedCard caregiverSharedCard-${item.type}`}
              key={item.id}
            >
              <div className="rowBetween">
                <div className="cardMainLine">{item.title}</div>
                <span className="caregiverTypeBadge">
                  {meta && <meta.Icon size={12} />}
                  {meta?.label || "Update"}
                </span>
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
                        <span>Period</span>
                        <strong>
                          {item.data.rangeLabel || "Not specified"}
                        </strong>
                      </div>
                      <div>
                        <span>Reminder</span>
                        <strong>
                          {item.data.reminderTitle || "All reminders"}
                        </strong>
                      </div>
                      <div>
                        <span>Completed</span>
                        <strong>{item.data.completedCount}</strong>
                      </div>
                      {item.data.onTimeCount != null && (
                        <div>
                          <span>On time</span>
                          <strong>
                            {item.data.onTimeCount} of{" "}
                            {item.data.completedCount}
                          </strong>
                        </div>
                      )}
                      {(item.data.completions || []).length > 0 && (
                        <div className="caregiverCompletionList">
                          {item.data.completions.map((entry, index) => (
                            <div
                              className="caregiverCompletion"
                              key={`${entry.completedAt}-${index}`}
                            >
                              <div className="sharedItemTop">
                                <strong>{entry.reminderTitle}</strong>
                                <span>
                                  {new Date(entry.completedAt).toLocaleString(
                                    [],
                                    {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    },
                                  )}
                                </span>
                              </div>
                              <p>
                                {entry.what}
                                {" · "}
                                {entry.onTime ? "On time" : "Completed late"}
                              </p>
                              {entry.notes && <p>Note: {entry.notes}</p>}
                            </div>
                          ))}
                        </div>
                      )}
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
          );
        })
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

      {total > PREVIEW_COUNT && (
        <div className="caregiverPager">
          {!expanded ? (
            <button
              className="btnGhost caregiverLoadMore"
              type="button"
              onClick={() => setExpanded(true)}
            >
              Load more ({total - PREVIEW_COUNT} more)
            </button>
          ) : (
            <>
              <div className="caregiverPagerStatus">
                Showing {rangeStart}–{rangeEnd} of {total}
              </div>
              <div className="caregiverPagerControls">
                <button
                  className="btnGhost"
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => goToPage(safePage - 1)}
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <span>
                  Page {safePage + 1} of {totalPages}
                </span>
                <button
                  className="btnGhost"
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => goToPage(safePage + 1)}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
              <button
                className="caregiverShowLess"
                type="button"
                onClick={resetPaging}
              >
                Show fewer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
