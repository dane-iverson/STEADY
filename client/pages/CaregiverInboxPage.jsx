import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Inbox,
  LogOut,
  Percent,
  RefreshCw,
  TrendingUp,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { Card } from "../components/Card";
import { GettingStarted } from "../components/GettingStarted";
import { statusOf } from "../utils/diabetes";
import "../styles/caregiver.css";

const PREVIEW_COUNT = 5;
const PAGE_SIZE = 10;

const TYPE_META = {
  glucose: { label: "Glucose", Icon: Droplet },
  trends: { label: "Trends", Icon: TrendingUp },
  reminders: { label: "Reminders", Icon: Bell },
  hba1c: { label: "HbA1c", Icon: Percent },
};

function ReadingStatus({ data, automatic = false }) {
  const status = automatic
    ? statusOf(data.value, data.context, data.glucoseRanges)
    : {
        label: data.status || "Not classified",
        key:
          {
            "Very low": "very-low",
            Low: "low",
            "In range": "target",
            High: "high",
            "Very high": "very-high",
          }[data.status] || "unknown",
      };
  return (
    <span
      className={`caregiverReadingStatus caregiverReadingStatus-${status.key}`}
    >
      <span aria-hidden="true">
        {status.key === "target"
          ? "✓"
          : status.key.includes("low")
            ? "↓"
            : status.key.includes("high")
              ? "↑"
              : "–"}
      </span>
      {status.label}
    </span>
  );
}

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
  connectionRequests = { received: [], sent: [], connected: [] },
  onboardingComplete = true,
  onStartTour,
  onRefresh,
  onRequestConnection,
  onRespondToConnection,
  onRevokeConnection,
  onProfile,
  onLogout,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterType, setFilterType] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [connectionEmail, setConnectionEmail] = useState("");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionFeedback, setConnectionFeedback] = useState("info");
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [activeView, setActiveView] = useState("updates");
  const [patientFilter, setPatientFilter] = useState("all");
  const listRef = useRef(null);

  useEffect(() => {
    const revealTourTarget = (event) => {
      if (event.target.closest(".caregiverPatientsView"))
        setActiveView("patients");
      if (event.target.closest(".caregiverUpdatesView"))
        setActiveView("updates");
    };
    document.addEventListener("steady:reveal-tour-target", revealTourTarget);
    return () =>
      document.removeEventListener(
        "steady:reveal-tour-target",
        revealTourTarget,
      );
  }, []);

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

  async function sendPairingRequest() {
    setConnectionBusy(true);
    setConnectionMessage("");
    try {
      await onRequestConnection?.(connectionEmail.trim());
      setConnectionEmail("");
      setConnectionFeedback("success");
      setConnectionMessage("Pairing request sent.");
    } catch (error) {
      setConnectionFeedback("error");
      setConnectionMessage(error.message);
    } finally {
      setConnectionBusy(false);
    }
  }

  async function respondToRequest(id, decision) {
    setConnectionBusy(true);
    setConnectionMessage("");
    try {
      await onRespondToConnection?.(id, decision);
      setConnectionFeedback("success");
      setConnectionMessage(
        decision === "accept" ? "Pairing accepted." : "Request declined.",
      );
    } catch (error) {
      setConnectionFeedback("error");
      setConnectionMessage(error.message);
    } finally {
      setConnectionBusy(false);
    }
  }

  async function removePairing(id) {
    setConnectionBusy(true);
    setConnectionMessage("");
    try {
      await onRevokeConnection?.(id);
      setConnectionFeedback("success");
      setConnectionMessage("Pairing removed.");
    } catch (error) {
      setConnectionFeedback("error");
      setConnectionMessage(error.message);
    } finally {
      setConnectionBusy(false);
    }
  }

  const visibleItems = [...sharedItems]
    .filter((item) => filterType === "all" || item.type === filterType)
    .filter(
      (item) => patientFilter === "all" || item.senderId === patientFilter,
    )
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
  const patients = [
    ...new Map([
      ...connectionRequests.connected.map((connection) => [
        connection.user.id,
        connection.user.name,
      ]),
      ...sharedItems
        .filter((item) => item.senderId)
        .map((item) => [item.senderId, item.senderName || "Patient"]),
    ]).entries(),
  ];

  function selectView(view) {
    setActiveView(view);
  }

  return (
    <div className="screen caregiverInboxScreen">
      <div className="caregiverHeader">
        <div>
          <span className="sectionKicker">Steady / Caregiver</span>
          <h2 className="screenTitle">Shared with me</h2>
          <p className="screenSub">{displayName}</p>
        </div>
        <div className="caregiverHeaderActions">
          <button className="btnGhost" type="button" onClick={onProfile}>
            <User size={16} aria-hidden="true" /> My profile
          </button>
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
      </div>

      <GettingStarted
        mode="caregiver"
        complete={onboardingComplete || connectionRequests.connected.length > 0}
        onStartTour={onStartTour}
        onOpenPairing={() => {
          setActiveView("patients");
          requestAnimationFrame(() =>
            document
              .querySelector(".caregiverConnectionPanel")
              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
          );
        }}
      />

      <nav className="caregiverViews" aria-label="Caregiver views">
        <button
          type="button"
          aria-current={activeView === "updates" ? "page" : undefined}
          onClick={() => selectView("updates")}
        >
          <Inbox size={16} /> Updates <span>{sharedItems.length}</span>
        </button>
        <button
          type="button"
          aria-current={activeView === "patients" ? "page" : undefined}
          onClick={() => selectView("patients")}
        >
          <User size={16} /> Patients{" "}
          <span>{connectionRequests.connected.length}</span>
          {connectionRequests.received.length > 0 && (
            <span className="caregiverRequestCount">
              {connectionRequests.received.length} pending
            </span>
          )}
        </button>
      </nav>

      <section
        aria-label="Patient connections"
        hidden={activeView !== "patients"}
        className="caregiverPatientsView"
      >
        <div className="caregiverConnectionPanel">
          <h3>Connect with a patient</h3>
          <p className="mutedSmall">
            Both accounts must accept a request. Saved glucose readings appear
            automatically when the patient enables glucose sharing.
          </p>
          <div className="caregiverInviteRow">
            <input
              id="caregiver-connection-email"
              className="textInput"
              type="email"
              value={connectionEmail}
              onChange={(event) => setConnectionEmail(event.target.value)}
              placeholder="patient@example.com"
              aria-label="Patient account email"
            />
            <button
              className="btnPrimary caregiverInviteButton"
              type="button"
              onClick={sendPairingRequest}
              disabled={!connectionEmail.includes("@") || connectionBusy}
            >
              <UserPlus size={15} /> Request
            </button>
          </div>
          {connectionRequests.received.map((request) => (
            <div className="caregiverConnection" key={request.id}>
              <div className="caregiverConnectionIdentity">
                <div className="caregiverAvatar">
                  <User size={15} />
                </div>
                <div>
                  <strong>{request.user.name}</strong>
                  <span>{request.user.email} requested to pair</span>
                </div>
              </div>
              <div className="rowGap">
                <button
                  className="iconBtn"
                  type="button"
                  disabled={connectionBusy}
                  onClick={() => respondToRequest(request.id, "decline")}
                  aria-label={`Decline request from ${request.user.email}`}
                  title="Decline request"
                >
                  <X size={15} />
                </button>
                <button
                  className="iconBtn"
                  type="button"
                  disabled={connectionBusy}
                  onClick={() => respondToRequest(request.id, "accept")}
                  aria-label={`Accept request from ${request.user.email}`}
                  title="Accept request"
                >
                  <Check size={15} />
                </button>
              </div>
            </div>
          ))}
          {connectionRequests.sent.map((request) => (
            <div className="caregiverConnection" key={request.id}>
              <div className="caregiverConnectionIdentity">
                <div className="caregiverAvatar">
                  <User size={15} />
                </div>
                <div>
                  <strong>{request.user.name}</strong>
                  <span>{request.user.email} · Request pending</span>
                </div>
              </div>
            </div>
          ))}
          {connectionRequests.connected.map((connection) => (
            <div className="caregiverConnection" key={connection.id}>
              <div className="caregiverConnectionIdentity">
                <div className="caregiverAvatar">
                  <User size={15} />
                </div>
                <div>
                  <strong>{connection.user.name}</strong>
                  <span>{connection.user.email} · Paired</span>
                </div>
              </div>
              <button
                className="iconBtn"
                type="button"
                disabled={connectionBusy}
                onClick={() => removePairing(connection.id)}
                aria-label={`Remove pairing with ${connection.user.email}`}
                title="Remove pairing"
              >
                <X size={15} />
              </button>
            </div>
          ))}
          {connectionMessage && (
            <div
              className={`caregiverFeedback caregiverFeedback-${connectionFeedback}`}
              role={connectionFeedback === "error" ? "alert" : "status"}
            >
              <strong>
                {connectionFeedback === "error"
                  ? "Unable to complete action: "
                  : "Done: "}
              </strong>
              {connectionMessage}
            </div>
          )}
        </div>
      </section>

      <section
        aria-label="Shared updates"
        hidden={activeView !== "updates"}
        className="caregiverUpdatesView"
      >
        <div className="sectionHeading caregiverInboxHeading">
          <div>
            <h3>
              {visibleItems.length
                ? `${visibleItems.length} update${visibleItems.length === 1 ? "" : "s"}`
                : "Nothing shared yet"}
            </h3>
          </div>
          <button
            className="iconBtn"
            type="button"
            onClick={refreshInbox}
            disabled={refreshing}
            aria-label="Refresh shared inbox"
            title="Refresh updates"
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
          <label
            className="caregiverFilterField"
            htmlFor="caregiver-patient-filter"
          >
            Patient
            <select
              id="caregiver-patient-filter"
              className="textInput"
              value={patientFilter}
              onChange={(event) => {
                setPatientFilter(event.target.value);
                resetPaging();
              }}
            >
              <option value="all">All patients</option>
              {patients.map(([id, patientName]) => (
                <option key={id} value={id}>
                  {patientName}
                </option>
              ))}
            </select>
          </label>
          <label className="caregiverFilterField">
            Update type
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
          </label>
          <label className="caregiverFilterField">
            Sort
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
          </label>
        </div>

        <div className="caregiverUpdateList">
          {visibleItems.length ? (
            pageItems.map((item) => {
              const meta = TYPE_META[item.type];
              return (
                <article
                  className={`caregiverSharedCard caregiverSharedCard-${item.type}`}
                  key={item.id}
                >
                  <div className="rowBetween">
                    <div className="cardMainLine">
                      {item.senderName || "Patient"}
                    </div>
                    <span className="caregiverTypeBadge">
                      {meta && <meta.Icon size={12} />}
                      {meta?.label || "Update"}
                    </span>
                  </div>
                  <div className="mutedSmall">
                    {item.automatic ? "Recorded" : "Shared"}{" "}
                    {new Date(item.sharedAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                  {item.type === "glucose" &&
                  item.data &&
                  item.data.selection !== "range" ? (
                    <div className="caregiverReadingValue">
                      {item.data.value ?? "--"} <span>mmol/L</span>
                    </div>
                  ) : (
                    <p className="caregiverSharedDetail">{item.detail}</p>
                  )}
                  {item.automatic && (
                    <div className="mutedSmall">Automatically shared</div>
                  )}
                  {item.message && (
                    <div className="caregiverPatientMessage">
                      <strong>Patient message</strong>
                      <p>{item.message}</p>
                    </div>
                  )}
                  {item.data && (
                    <div className="caregiverDataGrid">
                      {item.type === "glucose" &&
                        item.data.selection === "range" && (
                          <details className="caregiverGlucoseRange">
                            <summary>
                              {item.data.readings?.length || 0} reading
                              {item.data.readings?.length === 1
                                ? ""
                                : "s"} · {item.data.rangeLabel}
                            </summary>
                            <div className="caregiverGlucoseReadingList">
                              {(item.data.readings || []).map(
                                (reading, index) => (
                                  <div
                                    className="caregiverGlucoseReading"
                                    key={`${reading.readingAt}-${index}`}
                                  >
                                    <time dateTime={reading.readingAt}>
                                      {new Date(
                                        reading.readingAt,
                                      ).toLocaleString([], {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </time>
                                    <strong>
                                      {Number(reading.value).toFixed(1)} mmol/L
                                    </strong>
                                    <span>{reading.context}</span>
                                  </div>
                                ),
                              )}
                            </div>
                          </details>
                        )}
                      {item.type === "glucose" &&
                        item.data.selection !== "range" && (
                          <>
                            <div>
                              <span>Context</span>
                              <strong>{item.data.context}</strong>
                            </div>
                            <div>
                              <span>Status</span>
                              <ReadingStatus
                                data={item.data}
                                automatic={item.automatic}
                              />
                            </div>
                            <div>
                              <span>Recorded</span>
                              <strong>
                                {item.data.readingAt
                                  ? new Date(
                                      item.data.readingAt,
                                    ).toLocaleString([], {
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
                                      {new Date(
                                        entry.completedAt,
                                      ).toLocaleString([], {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })}
                                    </span>
                                  </div>
                                  <p>
                                    {entry.what}
                                    {" · "}
                                    {entry.onTime
                                      ? "On time"
                                      : "Completed late"}
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
                            <strong>
                              {item.data.testedAt || "Not provided"}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          ) : (
            <Card className="caregiverEmptyCard">
              <Inbox size={24} />
              <div className="cardMainLine">
                {sharedItems.length
                  ? "No matching updates"
                  : "Your inbox is empty"}
              </div>
              <p className="mutedSmall">
                {sharedItems.length
                  ? "Try another patient or update type."
                  : "Updates appear here when a paired patient enables sharing."}
              </p>
            </Card>
          )}
        </div>

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
      </section>
    </div>
  );
}
