import React, { useState } from "react";
import {
  AlertTriangle,
  Calculator,
  ChevronDown,
  ChevronLeft,
  Lock,
  Save,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { Card } from "../components/Card";
import {
  DEFAULT_INSULIN_SETTINGS,
  calculateInsulinDose,
  estimateInsulinOnBoard,
} from "../utils/insulin";

const emptyInputs = {
  glucose: "",
  carbs: "",
  lastDoseUnits: "",
  lastDoseHoursAgo: "",
  exercise: "no",
  sick: false,
  ketones: "unchecked",
};

const FRESH_READING_MINUTES = 15;

export function InsulinCalculatorPage({
  settings,
  setSettings,
  ageGroup,
  latestReading,
  onBack,
  onEmergency,
}) {
  const [inputs, setInputs] = useState(emptyInputs);
  const [settingsOpen, setSettingsOpen] = useState(!settings?.carbRatio);
  const [result, setResult] = useState(null);
  const activeSettings = { ...DEFAULT_INSULIN_SETTINGS, ...(settings || {}) };
  const estimatedActive = estimateInsulinOnBoard({
    units: inputs.lastDoseUnits,
    hoursAgo: inputs.lastDoseHoursAgo,
    durationHours: activeSettings.insulinDuration,
  });
  // A stale reading is unsafe to dose from, so only offer a recent one.
  const readingAgeMinutes = latestReading?.date
    ? (Date.now() - new Date(latestReading.date).getTime()) / 60000
    : Infinity;
  const freshReading =
    readingAgeMinutes >= 0 && readingAgeMinutes <= FRESH_READING_MINUTES
      ? latestReading
      : null;

  function updateInput(key, value) {
    setInputs((current) => ({ ...current, [key]: value }));
    setResult(null);
  }

  function updateSetting(key, value) {
    setSettings({ ...activeSettings, [key]: value });
    setResult(null);
  }

  function calculate() {
    setResult(
      calculateInsulinDose({
        ...inputs,
        insulinOnBoard: estimatedActive,
        settings: activeSettings,
      }),
    );
  }

  const isYoungUser = ageGroup === "child" || ageGroup === "teen";

  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <ChevronLeft size={16} /> Home
      </button>
      <div className="calculatorHeader">
        <div>
          <h2 className="screenTitle">Insulin calculator</h2>
          <p className="screenSub">
            A calculation aid based on your prescribed settings. It does not
            replace your diabetes plan.
          </p>
        </div>
        <div className="trendsHeaderIcon">
          <Calculator size={22} />
        </div>
      </div>

      <div className="safetyNotice">
        <AlertTriangle size={17} />
        <span>
          Only use this with insulin-to-carb and correction settings confirmed
          by your diabetes team.
        </span>
      </div>

      <details
        className="calculatorSettings"
        open={settingsOpen}
        onToggle={(event) => setSettingsOpen(event.currentTarget.open)}
      >
        <summary>
          <Lock size={15} /> Personal settings
          <span
            className={`calculatorStatus calculatorStatus-${activeSettings.carbRatio ? "ok" : "warn"}`}
          >
            {activeSettings.carbRatio ? "Configured" : "Needs setup"}
          </span>
          <ChevronDown size={16} className="calculatorChevron" />
        </summary>
        <p className="mutedSmall">
          These values should come from your prescription or care team. Steady
          will not calculate them for you.
        </p>
        <div className="calculatorFormGrid">
          <div>
            <label className="fieldLabel" htmlFor="insulin-type">
              Insulin type
            </label>
            <select
              id="insulin-type"
              className="textInput"
              value={activeSettings.insulinType}
              onChange={(event) =>
                updateSetting("insulinType", event.target.value)
              }
            >
              <option>Rapid-acting insulin</option>
              <option>Other insulin</option>
            </select>
          </div>
          <div>
            <label className="fieldLabel" htmlFor="delivery-method">
              Delivery
            </label>
            <select
              id="delivery-method"
              className="textInput"
              value={activeSettings.deliveryMethod}
              onChange={(event) =>
                updateSetting("deliveryMethod", event.target.value)
              }
            >
              <option>Pen or syringe</option>
              <option>Insulin pump</option>
            </select>
          </div>
          <div>
            <label className="fieldLabel" htmlFor="carb-ratio">
              Carb ratio (g/unit)
            </label>
            <input
              id="carb-ratio"
              className="textInput"
              inputMode="decimal"
              value={activeSettings.carbRatio}
              onChange={(event) =>
                updateSetting("carbRatio", event.target.value)
              }
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <label className="fieldLabel" htmlFor="sensitivity">
              Sensitivity (mmol/L/unit)
            </label>
            <input
              id="sensitivity"
              className="textInput"
              inputMode="decimal"
              value={activeSettings.sensitivity}
              onChange={(event) =>
                updateSetting("sensitivity", event.target.value)
              }
              placeholder="e.g. 3"
            />
          </div>
          <div>
            <label className="fieldLabel" htmlFor="target-glucose">
              Target glucose (mmol/L)
            </label>
            <input
              id="target-glucose"
              className="textInput"
              inputMode="decimal"
              value={activeSettings.targetGlucose}
              onChange={(event) =>
                updateSetting("targetGlucose", event.target.value)
              }
              placeholder="e.g. 6"
            />
          </div>
          <div>
            <label className="fieldLabel" htmlFor="dose-increment">
              Dose increment (units)
            </label>
            <select
              id="dose-increment"
              className="textInput"
              value={activeSettings.doseIncrement}
              onChange={(event) =>
                updateSetting("doseIncrement", event.target.value)
              }
            >
              <option value="0.5">0.5</option>
              <option value="1">1</option>
            </select>
          </div>
          <div>
            <label className="fieldLabel" htmlFor="max-bolus">
              Maximum bolus (units)
            </label>
            <input
              id="max-bolus"
              className="textInput"
              inputMode="decimal"
              value={activeSettings.maxBolus}
              onChange={(event) =>
                updateSetting("maxBolus", event.target.value)
              }
              placeholder="Optional safety limit"
            />
          </div>
          <div>
            <label className="fieldLabel" htmlFor="low-threshold">
              Low threshold (mmol/L)
            </label>
            <input
              id="low-threshold"
              className="textInput"
              inputMode="decimal"
              value={activeSettings.lowThreshold}
              onChange={(event) =>
                updateSetting("lowThreshold", event.target.value)
              }
            />
          </div>
          <div>
            <label className="fieldLabel" htmlFor="insulin-duration">
              Insulin action time (hours)
            </label>
            <select
              id="insulin-duration"
              className="textInput"
              value={activeSettings.insulinDuration}
              onChange={(event) =>
                updateSetting("insulinDuration", event.target.value)
              }
            >
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
        </div>
        <button
          className="btnGhost calculatorSaveSettings"
          type="button"
          onClick={() => setSettings({ ...activeSettings })}
        >
          <Save size={15} /> Save personal settings
        </button>
      </details>

      <Card className="calculatorInputs">
        <div className="sectionKicker">TODAY'S CALCULATION</div>
        <h3 className="calculatorSectionTitle">What is happening now?</h3>
        <div className="calculatorGroupLabel">
          <Utensils size={14} /> Meal and glucose
        </div>
        <div className="calculatorPair">
          <div>
            <label className="fieldLabel" htmlFor="calculator-glucose">
              Glucose (mmol/L)
            </label>
            <input
              id="calculator-glucose"
              className="textInput calculatorPrimaryInput"
              inputMode="decimal"
              value={inputs.glucose}
              onChange={(event) => updateInput("glucose", event.target.value)}
              placeholder="6.8"
            />
          </div>
          <div>
            <label className="fieldLabel" htmlFor="calculator-carbs">
              Carbs (g)
            </label>
            <input
              id="calculator-carbs"
              className="textInput calculatorPrimaryInput"
              inputMode="decimal"
              value={inputs.carbs}
              onChange={(event) => updateInput("carbs", event.target.value)}
              placeholder="60"
            />
          </div>
        </div>
        {freshReading && (
          <button
            type="button"
            className="calculatorUseReading"
            onClick={() =>
              updateInput("glucose", String(Number(freshReading.v)))
            }
          >
            Use the reading you just logged: {Number(freshReading.v).toFixed(1)}{" "}
            mmol/L
          </button>
        )}
        <div className="calculatorFieldSpacing fieldLabel">
          Rapid-acting insulin in the last {activeSettings.insulinDuration}{" "}
          hours? <span className="fieldOptional">optional</span>
        </div>
        <div className="calculatorPair">
          <div>
            <label className="fieldLabel" htmlFor="calculator-last-dose">
              Last dose (units)
            </label>
            <input
              id="calculator-last-dose"
              className="textInput"
              inputMode="decimal"
              value={inputs.lastDoseUnits}
              onChange={(event) =>
                updateInput("lastDoseUnits", event.target.value)
              }
              placeholder="None"
            />
          </div>
          <div>
            <label className="fieldLabel" htmlFor="calculator-last-hours">
              Hours ago
            </label>
            <input
              id="calculator-last-hours"
              className="textInput"
              inputMode="decimal"
              value={inputs.lastDoseHoursAgo}
              onChange={(event) =>
                updateInput("lastDoseHoursAgo", event.target.value)
              }
              placeholder="e.g. 1.5"
            />
          </div>
        </div>
        {estimatedActive > 0 && (
          <div className="inputHint">
            About {estimatedActive.toFixed(1)} units still active. Steady
            estimates this with a straight-line fall over{" "}
            {activeSettings.insulinDuration} hours.
          </div>
        )}
        <div className="calculatorDivider" />
        <div className="calculatorGroupLabel">
          <ShieldCheck size={14} /> Safety checks
        </div>
        <div className="fieldLabel">Exercise planned soon?</div>
        <div className="chipRow">
          <button
            type="button"
            className={`chip${inputs.exercise === "no" ? " chipActive" : ""}`}
            onClick={() => updateInput("exercise", "no")}
          >
            No
          </button>
          <button
            type="button"
            className={`chip${inputs.exercise === "yes" ? " chipActive" : ""}`}
            onClick={() => updateInput("exercise", "yes")}
          >
            Yes
          </button>
        </div>
        {inputs.exercise === "yes" && (
          <div className="calculatorGuidance">
            Follow your personalised exercise plan. This prototype does not
            automatically reduce or increase insulin for exercise.
          </div>
        )}

        <label className="calculatorCheckRow">
          <input
            type="checkbox"
            checked={inputs.sick}
            onChange={(event) => updateInput("sick", event.target.checked)}
          />{" "}
          <span>I'm currently sick or unable to eat/drink normally</span>
        </label>
        <label
          className="fieldLabel calculatorFieldSpacing"
          htmlFor="calculator-ketones"
        >
          Ketones
        </label>
        <select
          id="calculator-ketones"
          className="textInput"
          value={inputs.ketones}
          onChange={(event) => updateInput("ketones", event.target.value)}
        >
          <option value="unchecked">Not checked</option>
          <option value="none">Negative (blood below 0.6 mmol/L)</option>
          <option value="trace">Trace or small (blood 0.6–1.4)</option>
          <option value="moderate">Moderate (blood 1.5–2.9)</option>
          <option value="high">Large (blood 3.0 or more)</option>
        </select>
      </Card>

      <button
        className="btnPrimary calculatorButton"
        type="button"
        onClick={calculate}
      >
        <Calculator size={16} /> Check calculation
      </button>

      {result?.status === "ready" && (
        <Card className="calculatorResult">
          <div className="calculatorResultHero">
            <div className="sectionKicker">CHECK AGAINST YOUR PLAN</div>
            <h3 className="calculatorResultTitle">Suggested mealtime dose</h3>
            <div className="calculatorDose">
              {result.totalDose.toFixed(1)} <span>units</span>
            </div>
          </div>
          <div className="calculatorBreakdown">
            <div>
              <span>Meal dose</span>
              <strong>{result.mealDose.toFixed(1)} units</strong>
            </div>
            <div>
              <span>Correction</span>
              <strong>
                {result.correctionDose < 0 ? "−" : ""}
                {Math.abs(result.correctionDose).toFixed(1)} units
              </strong>
            </div>
            <div>
              <span>Insulin active</span>
              <strong>−{result.insulinOnBoard.toFixed(1)} units</strong>
            </div>
          </div>
          {result.warnings.map((warning) => (
            <div className="calculatorGuidance" key={warning}>
              {warning}
            </div>
          ))}
          {result.capped && (
            <div className="calculatorGuidance">
              The result reached your configured maximum bolus. Confirm this
              against your prescribed plan.
            </div>
          )}
          <div className="calculatorResultWarning">
            Check the result against your prescribed plan before administering.
            Do not use it to change basal insulin.
          </div>
        </Card>
      )}
      {result && result.status !== "ready" && (
        <Card className={`calculatorStop calculatorStop-${result.status}`}>
          <AlertTriangle size={19} />
          <div>
            <h3>
              {result.status === "setup"
                ? "Finish personal settings"
                : result.status === "incomplete"
                  ? "More information needed"
                  : "Pause and follow your safety plan"}
            </h3>
            <p>{result.reason}</p>
            {result.status === "stop" && (
              <button className="btnGhost" type="button" onClick={onEmergency}>
                Open emergency guidance
              </button>
            )}
          </div>
        </Card>
      )}

      {isYoungUser && (
        <p className="fineprint">
          For children and adolescents, a parent, caregiver, or diabetes
          professional should confirm the settings and result.
        </p>
      )}
      <p className="fineprint">
        This is a prototype calculation aid, not a medical device or diagnosis.
        Never use it to make changes outside your diabetes team's plan.
      </p>
    </div>
  );
}
