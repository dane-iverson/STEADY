import React from "react";
import {
  Bell,
  BookOpen,
  Droplet,
  ShieldAlert,
  TrendingUp,
  User,
} from "lucide-react";
import { AGE_GROUPS, COPY } from "../data/appData";
import {
  getTimeOfDayGreeting,
  glucoseRangePosition,
  GLUCOSE_RANGES,
  statusOf,
} from "../utils/diabetes";
import { Card } from "../components/Card";
import {
  formatReminderWhen,
  getNextOccurrence,
  formatNextOccurrence,
} from "../utils/reminders";

export function DashboardPage({
  ageGroup,
  name,
  readings,
  reminders,
  setScreen,
}) {
  const c = COPY[AGE_GROUPS[ageGroup].tone];
  const last = readings[readings.length - 1];
  const lastStatus = last ? statusOf(last.v, last.context || "Random") : null;
  const activeReminders = reminders.filter((r) => r.on).length;
  const now = new Date();
  // find next upcoming active reminder
  const upcomingCandidates = reminders
    .filter((r) => r.on)
    .map((r) => {
      const next = getNextOccurrence(r.when, r.repeat);
      return { r, next };
    })
    .filter(({ next }) => next && next > now);

  upcomingCandidates.sort((a, b) => a.next - b.next);
  const nextReminder = upcomingCandidates.length
    ? upcomingCandidates[0].r
    : null;

  const tiles = [
    {
      id: "glucose",
      label: "Record glucose",
      icon: Droplet,
      desc: "Log a new reading",
    },
    {
      id: "trends",
      label: "Trends",
      icon: TrendingUp,
      desc: "See your patterns",
    },
    {
      id: "reminders",
      label: "Reminders",
      icon: Bell,
      desc: `${reminders.filter((r) => r.on).length} active`,
    },
    {
      id: "education",
      label: "Diabetes Education Centre",
      icon: BookOpen,
      desc: "Learn at your pace",
    },
    {
      id: "emergency",
      label: "Emergency guidance",
      icon: ShieldAlert,
      desc: "Always available offline",
    },
    {
      id: "profile",
      label: "Medical profile",
      icon: User,
      desc: "Your details & contacts",
    },
  ];

  return (
    <div className="screen dashboardScreen">
      <div className="dashboardIntro">
        <div>
          <span className="sectionKicker">YOUR DAILY CHECK-IN</span>
          <h2 className="screenTitle">
            {getTimeOfDayGreeting()}, {name || "there"}
          </h2>
          <p className="screenSub">{c.dashSubtitle}</p>
        </div>
        <div className="careBadge" aria-label="Care plan on track">
          <span className="careBadgeDot" />
          <span>Care plan</span>
        </div>
      </div>

      {last && (
        <Card style={{ marginBottom: 14 }}>
          <div className="clinicalCardHeader">
            <div>
              <span className="sectionKicker">LATEST READING</span>
              <div className="cardMainLine">Blood glucose</div>
            </div>
            <span className="statusTag statusTag-neutral">
              {last.context || "Random"}
            </span>
          </div>
          <div className="rowBetween">
            <span className={"statusTag statusTag-" + lastStatus.key}>
              {lastStatus.symbol} {lastStatus.label}
            </span>
            <span className="readingStamp">{last.time}</span>
          </div>
          <div className="bigNumber clinicalNumber">
            {Number(last.v).toFixed(1)}{" "}
            <span className="bigNumberUnit">mmol/L</span>
          </div>
          <div
            className="rangeTrack"
            aria-label={`Last reading ${Number(last.v).toFixed(1)} mmol/L`}
          >
            {GLUCOSE_RANGES.map((band) => (
              <span
                key={band.key}
                className="rangeTrackSegment"
                style={{
                  backgroundColor: band.color,
                  flex: band.max - band.min,
                }}
              />
            ))}
            <span
              className="rangeTrackMarker"
              style={{ left: `${glucoseRangePosition(last.v)}%` }}
              title={`${Number(last.v).toFixed(1)} mmol/L`}
            />
          </div>
          <div className="rangeScale">
            {GLUCOSE_RANGES.map((band) => (
              <span key={band.key} style={{ flex: band.max - band.min }}>
                {band.label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {nextReminder && (
        <Card style={{ marginBottom: 14 }}>
          <div className="rowBetween">
            <div>
              <span className="sectionKicker">NEXT ON YOUR PLAN</span>
              <div className="cardMainLine">{nextReminder.title}</div>
            </div>
            <div className="clinicalIcon clinicalIcon-warm">
              <Bell size={17} />
            </div>
          </div>
          <div className="mutedSmall">
            {formatNextOccurrence(upcomingCandidates[0].next)}
          </div>
        </Card>
      )}

      <div className="sectionHeading">
        <span className="sectionKicker">CARE TOOLS</span>
        <span className="sectionHeadingMeta">
          {activeReminders} active reminders
        </span>
      </div>
      <div className="tileGrid careToolGrid">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className="tile" onClick={() => setScreen(t.id)}>
              <Icon size={22} strokeWidth={2} />
              <span className="tileLabel">{t.label}</span>
              <span className="tileDesc">{t.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
