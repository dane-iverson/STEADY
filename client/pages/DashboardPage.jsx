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
import { statusOf } from "../utils/diabetes";
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
    <div className="screen">
      <h2 className="screenTitle">
        {c.greeting}, {name}
      </h2>
      <p className="screenSub">{c.dashSubtitle}</p>

      {last && (
        <Card>
          <div className="rowBetween">
            <span className="cardEyebrow">Last reading</span>
            <span className={"statusTag statusTag-" + lastStatus.key}>
              {lastStatus.symbol} {lastStatus.label}
            </span>
          </div>
          <div className="bigNumber">
            {Number(last.v).toFixed(1)}{" "}
            <span className="bigNumberUnit">mmol/L</span>
          </div>
          <div className="mutedSmall">
            {last.context || "Random"} · {last.time}
          </div>
        </Card>
      )}

      {nextReminder && (
        <Card>
          <div className="rowBetween">
            <span className="cardEyebrow">Upcoming reminder</span>
            <Bell size={16} />
          </div>
          <div className="cardMainLine">{nextReminder.title}</div>
          <div className="mutedSmall">
            {formatNextOccurrence(upcomingCandidates[0].next)}
          </div>
        </Card>
      )}

      <div className="tileGrid">
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
