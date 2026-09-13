import React, { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  Droplet,
  Info,
  Moon,
  Sunrise,
  Sunset,
  TrendingUp,
} from "lucide-react";
import { AGE_GROUPS, COPY, EDUCATION } from "../data/appData";
import { Card } from "../components/Card";

const ICONS = {
  Droplet,
  TrendingUp,
  Info,
  Sunrise,
  Sunset,
  Moon,
  BookOpen,
};

export function EducationPage({ ageGroup, onBack }) {
  const [open, setOpen] = useState(null);
  const c = COPY[AGE_GROUPS[ageGroup].tone];

  if (open) {
    const item = EDUCATION.find((e) => e.id === open);
    const Icon = ICONS[item.icon] || BookOpen;

    return (
      <div className="screen">
        <button className="linkBack" onClick={() => setOpen(null)}>
          <ChevronLeft size={16} /> Education Centre
        </button>
        <div className="brandMark small">
          <Icon size={20} />
        </div>
        <h2 className="screenTitle">{item.title}</h2>
        <p className="bodyText">{item.body}</p>
        <Card style={{ marginTop: 8 }}>
          <div className="rowGap">
            <Info size={15} />
            <span className="mutedSmall">
              This is educational information, not medical advice. Always follow
              the plan from your healthcare team.
            </span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <ChevronLeft size={16} /> Home
      </button>
      <h2 className="screenTitle">Diabetes Education Centre</h2>
      <p className="screenSub">{c.eduIntro}</p>
      <div className="listCol">
        {EDUCATION.map((e) => {
          const Icon = ICONS[e.icon] || BookOpen;
          return (
            <button
              key={e.id}
              className="listRow"
              onClick={() => setOpen(e.id)}
            >
              <Icon size={19} />
              <span className="listRowLabel">{e.title}</span>
              <ChevronLeft size={16} className="chevRight" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
