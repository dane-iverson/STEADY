import React from "react";
import { ArrowRight, Bell, BookOpen, Droplet, ShieldAlert } from "lucide-react";
import { Card } from "./Card";

const PATIENT_ACTIONS = [
  {
    screen: "glucose",
    label: "Record a glucose reading",
    Icon: Droplet,
  },
  { screen: "reminders", label: "Set up reminders", Icon: Bell },
  {
    screen: "emergency",
    label: "Find emergency guidance",
    Icon: ShieldAlert,
  },
];

export function GettingStarted({
  mode = "patient",
  complete = false,
  onStartTour,
  setScreen,
}) {
  if (complete) {
    return (
      <button
        className="gettingStartedReplay"
        type="button"
        onClick={onStartTour}
      >
        <BookOpen size={15} /> Take the tour again
      </button>
    );
  }

  const isCaregiver = mode === "caregiver";
  const isPrototype = mode === "prototype";

  return (
    <Card className="gettingStartedCard">
      <div className="gettingStartedHeading">
        <div>
          <span className="sectionKicker">A FEW GOOD PLACES TO START</span>
          <h3>Getting started</h3>
        </div>
        <BookOpen size={18} aria-hidden="true" />
      </div>
      <p className="mutedSmall">
        {isCaregiver
          ? "Pair with a patient first. Their health information stays private unless they choose to share it."
          : isPrototype
            ? "Try these sample screens. Prototype changes reset when you exit or refresh."
            : "Choose a first step, or take a quick tour of the app."}
      </p>
      {isCaregiver ? (
        <button
          className="btnGhost gettingStartedAction"
          type="button"
          onClick={() =>
            document
              .querySelector(".caregiverConnectionPanel")
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        >
          <ArrowRight size={15} /> Find pairing requests
        </button>
      ) : (
        <div className="gettingStartedActions">
          {PATIENT_ACTIONS.map(({ screen, label, Icon }) => (
            <button
              className="btnGhost gettingStartedAction"
              key={screen}
              type="button"
              onClick={() => setScreen(screen)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      )}
      <button
        className="gettingStartedTour"
        type="button"
        onClick={onStartTour}
      >
        Take a quick tour <ArrowRight size={15} />
      </button>
    </Card>
  );
}
