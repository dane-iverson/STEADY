import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info,
  LocateFixed,
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
  const [showDetails, setShowDetails] = useState(false);
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

    target.dispatchEvent(
      new CustomEvent("steady:reveal-tour-target", { bubbles: true }),
    );

    const previousDescription = target.getAttribute("aria-describedby");
    target.classList.add("guidedTourTarget");
    target.setAttribute(
      "aria-describedby",
      [previousDescription, "guided-tour-description"]
        .filter(Boolean)
        .join(" "),
    );
    const scrollFrame = requestAnimationFrame(() =>
      target.scrollIntoView({ behavior: "smooth", block: "center" }),
    );

    const advanceFromTarget = () =>
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    if (step.advanceOnTargetClick) {
      target.addEventListener("click", advanceFromTarget);
    }

    return () => {
      cancelAnimationFrame(scrollFrame);
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
    setShowDetails(false);
  }, [stage, stepIndex, mode]);

  useEffect(() => {
    if (stage !== "tour") return;
    const minimizeForInput = (event) => {
      if (
        event.target.matches("input, textarea, select") &&
        !event.target.closest(".guidedTourCoach")
      ) {
        setCollapsed(true);
      }
    };
    document.addEventListener("focusin", minimizeForInput);
    return () => document.removeEventListener("focusin", minimizeForInput);
  }, [stage]);

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
        className="guidedTourCoach guidedTourCoachCollapsed"
        aria-label="Guided tour"
      >
        <button
          className="guidedTourMinimized"
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Show guided tour controls"
        >
          <BookOpen size={15} /> {step.title}
          <span>
            {stepIndex + 1}/{steps.length}
          </span>
          <ChevronUp size={15} />
        </button>
        <span
          id="guided-tour-description"
          className="guidedTourScreenReaderOnly"
        >
          {step.body}
        </span>
      </aside>
    );
  }

  return (
    <aside className="guidedTourCoach" aria-label="Guided tour">
      <section
        className="guidedTourCard"
        aria-labelledby="guided-tour-title"
        aria-describedby="guided-tour-description"
        aria-live="polite"
      >
        <div className="guidedTourHeader">
          <div className="guidedTourMeta">
            <span className="guidedTourCount">
              {stepIndex + 1} of {steps.length}
            </span>
            <nav className="guidedTourSteps" aria-label="Tour steps">
              {steps.map((entry, index) => (
                <button
                  key={`${entry.screen}-${index}`}
                  type="button"
                  aria-label={`Step ${index + 1}: ${entry.title}`}
                  aria-current={index === stepIndex ? "step" : undefined}
                  title={entry.title}
                  onClick={() => setStepIndex(index)}
                >
                  <span
                    className={index < stepIndex ? "guidedTourStepVisited" : ""}
                  />
                </button>
              ))}
            </nav>
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
        <h2 id="guided-tour-title" className="guidedTourTitle">
          {step.title}
        </h2>
        <p id="guided-tour-description" className="guidedTourBody">
          {step.screen === "dashboard"
            ? "Tap the highlighted glucose tool to try your first step."
            : step.screen === "glucose"
              ? isPrototype
                ? "Try a sample value and choose a meal context."
                : "Enter a real meter value and choose its meal context."
              : step.screen === "reminders"
                ? "Tap Add reminder, explore the form, then save or cancel."
                : step.screen === "trends"
                  ? "Switch Daily / Weekly or choose a date range."
                  : step.screen === "emergency"
                    ? "Read the highlighted guidance and find your emergency contact."
                    : step.body}
        </p>
        {step.safetyNote && <p className="guidedTourNote">{step.safetyNote}</p>}
        {showDetails && (
          <p
            id="guided-tour-details"
            className="guidedTourBody guidedTourDetails"
          >
            {step.body}
            {isPrototype && " Sample data resets on exit or refresh."}
          </p>
        )}
        <div className="guidedTourActions">
          <div className="rowGap">
            <button
              className="iconBtn"
              type="button"
              onClick={() => {
                const target = document.querySelector(step.target);
                target?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              aria-label="Locate this control"
              title="Locate this control"
            >
              <LocateFixed size={17} />
            </button>
            <button
              className="iconBtn"
              type="button"
              onClick={() => setShowDetails((current) => !current)}
              aria-label={
                showDetails ? "Hide tour details" : "More tour details"
              }
              aria-expanded={showDetails}
              aria-controls="guided-tour-details"
              title="More details"
            >
              <Info size={17} />
            </button>
          </div>
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
