import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

const TOUR_STEPS = {
  patient: [
    {
      screen: "dashboard",
      target: ".tile-glucose",
      advanceOnTargetClick: true,
      title: "Your dashboard",
      body: "Start with Record glucose. Tap the highlighted tool to open the reading form, or use Next to keep looking around.",
    },
    {
      screen: "glucose",
      target: "#bg",
      title: "Log a glucose reading",
      body: "Enter a meter value here, then choose its context and time. This tour will not save anything you type.",
      safetyNote:
        "Only press Record when you intend to save a real reading. Follow your care team's plan.",
    },
    {
      screen: "reminders",
      target: ".reminderAddButton",
      title: "Make a reminder plan",
      body: "Add recurring checks, insulin reminders or appointments here. You can open the form and cancel to explore it without changing your plan.",
      safetyNote: "Saving creates or changes a real reminder.",
    },
    {
      screen: "trends",
      target: ".trendsControlGroup",
      title: "Review trends",
      body: "Daily readings and weekly averages can help you spot patterns to discuss with your care team.",
    },
    {
      screen: "emergency",
      target: ".emergencyLowGuidance",
      title: "Find emergency guidance",
      body: "The Emergency section has quick reference guidance. It cannot monitor you or contact emergency services.",
    },
  ],
  prototype: [
    {
      screen: "dashboard",
      target: ".tile-glucose",
      advanceOnTargetClick: true,
      title: "Explore the sample dashboard",
      body: "This prototype uses sample information so you can try the main screens without creating an account.",
    },
    {
      screen: "glucose",
      target: "#bg",
      title: "Try recording a reading",
      body: "Explore the entry flow using sample data. Prototype changes are temporary and are not saved to an account.",
    },
    {
      screen: "reminders",
      target: ".reminderAddButton",
      title: "Try the reminder plan",
      body: "Add or complete a sample reminder to see how planning and activity history work.",
    },
    {
      screen: "trends",
      target: ".trendsControlGroup",
      title: "Explore the charts",
      body: "The charts use sample readings. They are for demonstrating the interface, not for making care decisions.",
    },
    {
      screen: "emergency",
      target: ".emergencyLowGuidance",
      title: "Know where to find guidance",
      body: "Emergency guidance is available in the prototype, but it cannot monitor you or call for help.",
    },
  ],
  caregiver: [
    {
      screen: "caregiverInbox",
      target: "#caregiver-connection-email",
      title: "Pair with a patient",
      body: "Send a request using the patient's account email. They must accept before you can receive updates.",
      safetyNote:
        "Sending a request contacts a real account. Only send one when you intend to pair.",
    },
    {
      screen: "caregiverInbox",
      target: ".caregiverInboxControls",
      title: "Find shared updates",
      body: "Use these controls to filter and sort the updates patients chose to share with you.",
    },
    {
      screen: "caregiverInbox",
      target: ".caregiverInboxHeading",
      title: "Patients control sharing",
      body: "Pairing alone does not reveal health data. Patients enable sharing and choose which updates to send.",
    },
  ],
};

export function GuidedTour({
  stage,
  mode,
  screen,
  setScreen,
  onStart,
  onClose,
  onComplete,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [coachPosition, setCoachPosition] = useState("bottom");
  const steps = TOUR_STEPS[mode] || TOUR_STEPS.patient;
  const step = steps[stepIndex];

  useEffect(() => {
    if (stage !== "tour") {
      setStepIndex(0);
      return;
    }
    if (screen !== step.screen) {
      setScreen(step.screen, { replace: true });
      return;
    }
    if (!step.target) return;

    const target = document.querySelector(step.target);
    if (!target) return;

    setCoachPosition(
      target.getBoundingClientRect().top > window.innerHeight * 0.42
        ? "top"
        : "bottom",
    );
    const previousDescription = target.getAttribute("aria-describedby");
    target.classList.add("guidedTourTarget");
    target.setAttribute(
      "aria-describedby",
      [previousDescription, "guided-tour-description"]
        .filter(Boolean)
        .join(" "),
    );
    target.scrollIntoView({ behavior: "smooth", block: "center" });

    const advanceFromTarget = () =>
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    if (step.advanceOnTargetClick) {
      target.addEventListener("click", advanceFromTarget);
    }

    return () => {
      target.classList.remove("guidedTourTarget");
      if (previousDescription) {
        target.setAttribute("aria-describedby", previousDescription);
      } else {
        target.removeAttribute("aria-describedby");
      }
      if (step.advanceOnTargetClick) {
        target.removeEventListener("click", advanceFromTarget);
      }
    };
  }, [stage, stepIndex, mode, screen]);

  useEffect(() => {
    setCollapsed(false);
  }, [stage, stepIndex, mode]);

  if (!stage) return null;

  const isPrototype = mode === "prototype";
  const isCaregiver = mode === "caregiver";

  if (stage === "prompt") {
    return (
      <div className="modalBackdrop guidedTourBackdrop">
        <section
          className="modalPanel guidedTourPanel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guided-tour-title"
          aria-describedby="guided-tour-description"
        >
          <div className="guidedTourHeader">
            <span className="guidedTourIcon" aria-hidden="true">
              <BookOpen size={18} />
            </span>
            <button
              className="iconBtn"
              type="button"
              onClick={onClose}
              aria-label="Close guide"
            >
              <X size={17} />
            </button>
          </div>

          <>
            <div className="sectionKicker">
              {isPrototype ? "PROTOTYPE GUIDE" : "QUICK TOUR"}
            </div>
            <h2 id="guided-tour-title" className="guidedTourTitle">
              {isPrototype
                ? "Explore the prototype"
                : isCaregiver
                  ? "Get started as a caregiver"
                  : "Find your way around Steady"}
            </h2>
            <p id="guided-tour-description" className="screenSub">
              {isPrototype
                ? "A short look at the sample screens. Nothing you do here is saved."
                : isCaregiver
                  ? "See how pairing requests and patient-controlled sharing work."
                  : "Take a quick tour of the main tools, or jump straight in and explore at your own pace."}
            </p>
            <div className="guidedTourActions">
              <button className="btnGhost" type="button" onClick={onClose}>
                Not now
              </button>
              <button className="btnPrimary" type="button" onClick={onStart}>
                Start tour <ArrowRight size={16} />
              </button>
            </div>
          </>
        </section>
      </div>
    );
  }

  if (collapsed) {
    return (
      <aside
        className={`guidedTourCoach guidedTourCoachCollapsed guidedTourCoach-${coachPosition}`}
      >
        <button
          className="guidedTourMinimized"
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Show guided tour controls"
        >
          <BookOpen size={15} /> Tour {stepIndex + 1} of {steps.length}
          <ChevronUp size={15} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`guidedTourCoach guidedTourCoach-${coachPosition}`}
      aria-label="Guided tour"
    >
      <section
        className="guidedTourCard"
        aria-labelledby="guided-tour-title"
        aria-describedby="guided-tour-description"
        aria-live="polite"
      >
        <div className="guidedTourHeader">
          <div className="guidedTourMeta">
            <span className="guidedTourIcon" aria-hidden="true">
              <BookOpen size={17} />
            </span>
            <span className="guidedTourCount">
              {stepIndex + 1} of {steps.length}
            </span>
          </div>
          <div className="rowGap">
            <button
              className="iconBtn"
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Minimize guide"
            >
              <ChevronDown size={16} />
            </button>
            <button
              className="iconBtn"
              type="button"
              onClick={onClose}
              aria-label="Skip tour"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div
          className="guidedTourProgress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={stepIndex + 1}
          aria-label="Tour progress"
        >
          <span
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <h2 id="guided-tour-title" className="guidedTourTitle">
          {step.title}
        </h2>
        <p id="guided-tour-description" className="guidedTourBody">
          {step.body}
        </p>
        {(step.safetyNote || isPrototype) && (
          <p className="guidedTourNote">
            {step.safetyNote ||
              "Sample data only. Changes reset when you exit or refresh the prototype."}
          </p>
        )}
        <div className="guidedTourActions">
          <button className="btnGhost" type="button" onClick={onClose}>
            Skip
          </button>
          <div className="rowGap">
            {stepIndex > 0 && (
              <button
                className="iconBtn"
                type="button"
                onClick={() => setStepIndex((current) => current - 1)}
                aria-label="Previous tour step"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            {stepIndex < steps.length - 1 ? (
              <button
                className="btnPrimary"
                type="button"
                onClick={() => setStepIndex((current) => current + 1)}
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btnPrimary" type="button" onClick={onComplete}>
                Finish tour
              </button>
            )}
          </div>
        </div>
      </section>
    </aside>
  );
}
