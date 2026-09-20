import React, { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  Droplet,
  Info,
  Moon,
  Sunrise,
  Sunset,
  ShieldAlert,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { AGE_GROUPS, COPY, EDUCATION } from "../data/appData";
import { Card } from "../components/Card";

const ICONS = {
  Droplet,
  TrendingUp,
  Info,
  Sunrise,
  Sunset,
  ShieldAlert,
  Moon,
  BookOpen,
  User,
  Users,
};

export function EducationPage({ ageGroup, onBack }) {
  const [open, setOpen] = useState(null);
  const [expandedSections, setExpandedSections] = useState(
    () => new Set(["core"]),
  );
  const c = COPY[AGE_GROUPS[ageGroup].tone];
  const visibleEducation = EDUCATION.filter(
    (item) =>
      !item.audience || item.audience === "all" || item.audience === ageGroup,
  );
  const item = visibleEducation.find((entry) => entry.id === open);
  const sectionDefinitions = [
    {
      id: "core",
      title: "Core knowledge",
      description: "The essentials for understanding your diabetes.",
      ids: ["basics", "glucose", "insulin"],
    },
    {
      id: "safety",
      title: "Staying safe",
      description: "Recognise changes and know when to ask for help.",
      ids: ["hypo", "hyper", "sickness-illness"],
    },
    {
      id: "daily",
      title: "Everyday care",
      description: "Practical routines for food, activity and technology.",
      ids: [
        "everyday",
        "food-nutrition",
        "exercise-activity",
        "diabetes-technology",
      ],
    },
    {
      id: "support",
      title: "Support & wellbeing",
      description: "Look after the person behind the readings.",
      ids: ["mental-wellbeing", "checkups-appointments"],
    },
  ];
  const sections = sectionDefinitions
    .map((section) => ({
      ...section,
      items: section.ids
        .map((id) => visibleEducation.find((entry) => entry.id === id))
        .filter(Boolean),
    }))
    .filter((section) => section.items.length);
  const ageItems = visibleEducation.filter(
    (entry) => entry.audience && entry.audience !== "all",
  );
  if (ageItems.length) {
    sections.push({
      id: "age-specific",
      title: `${AGE_GROUPS[ageGroup].name} topics`,
      description: "Guidance shaped around this stage of life.",
      items: ageItems,
    });
  }

  if (open && item) {
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
        {sections.map((section) => {
          return (
            <details
              key={section.id}
              className="educationSection"
              open={expandedSections.has(section.id)}
              onToggle={(event) => {
                const next = new Set(expandedSections);
                if (event.currentTarget.open) next.add(section.id);
                else next.delete(section.id);
                setExpandedSections(next);
              }}
            >
              <summary className="educationSectionSummary">
                <span>
                  <strong>{section.title}</strong>
                  <small>{section.description}</small>
                </span>
                <span className="educationSectionCount">
                  {section.items.length}
                </span>
              </summary>
              <div className="listCol educationSectionList">
                {section.items.map((e) => {
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
            </details>
          );
        })}
      </div>
    </div>
  );
}
