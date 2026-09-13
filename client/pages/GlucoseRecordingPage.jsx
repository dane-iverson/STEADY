import React, { useEffect, useState } from "react";
import { Check, ChevronLeft, List } from "lucide-react";
import { AGE_GROUPS, COPY } from "../data/appData.js";
import { Card } from "../components/Card";
import { statusOf } from "../utils/diabetes.js";

export function GlucoseRecordingPage({
  ageGroup,
  editingReading,
  onSave,
  onUpdate,
  onDelete,
  onOpenHistory,
  onCancelEdit,
  onBack,
  online,
  readings = [],
}) {
  const [step, setStep] = useState(1);
  const [value, setValue] = useState("");
  const [context, setContext] = useState("Before meal");
  const [dateValue, setDateValue] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [timeValue, setTimeValue] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [editingId, setEditingId] = useState(null);
  const c = COPY[AGE_GROUPS[ageGroup].tone];

  useEffect(() => {
    if (editingReading) {
      setEditingId(editingReading.id);
      setValue(String(editingReading.v));
      setContext(editingReading.context || "Before meal");
      const readingDate = editingReading.date
        ? new Date(editingReading.date)
        : new Date();
      setDateValue(readingDate.toISOString().slice(0, 10));
      setTimeValue(readingDate.toTimeString().slice(0, 5));
      setStep(1);
    }
  }, [editingReading]);

  const num = Number(value);
  const valid = value !== "" && Number.isFinite(num) && num >= 0 && num <= 30;
  const status = valid ? statusOf(num, context) : null;

  function resetEntryForm() {
    setValue("");
    setContext("Before meal");
    setDateValue(new Date().toISOString().slice(0, 10));
    setTimeValue(new Date().toTimeString().slice(0, 5));
    setEditingId(null);
    onCancelEdit?.();
  }

  function handleSave() {
    if (editingId) {
      onUpdate(editingId, num, context, dateValue, timeValue);
    } else {
      onSave(num, context, dateValue, timeValue);
    }
    resetEntryForm();
    setStep(3);
  }

  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <ChevronLeft size={16} /> Home
      </button>
      <h2 className="screenTitle">Record blood glucose</h2>

      {step === 1 && (
        <>
          <p className="screenSub">
            {editingId
              ? "Update your saved reading."
              : "Step 1 of 2 — enter your reading."}
          </p>
          <label className="fieldLabel" htmlFor="bg">
            Reading (mmol/L)
          </label>
          <input
            id="bg"
            className="textInput bigInput"
            inputMode="decimal"
            placeholder="e.g. 5.6"
            value={value}
            onChange={(e) => {
              const next = e.target.value
                .replace(/[^0-9.]/g, "")
                .replace(/(\..*)\./g, "$1");
              setValue(next);
            }}
          />
          <div className="fieldLabel" style={{ marginTop: 18 }}>
            When was this?
          </div>
          <div className="chipRow" style={{ marginBottom: 12 }}>
            {["Before meal", "After meal", "Random"].map((opt) => (
              <button
                key={opt}
                className={"chip" + (context === opt ? " chipActive" : "")}
                onClick={() => setContext(opt)}
              >
                {opt}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="fieldLabel" htmlFor="reading-date">
                Date
              </label>
              <input
                id="reading-date"
                className="textInput"
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
              />
            </div>
            <div>
              <label className="fieldLabel" htmlFor="reading-time">
                Time
              </label>
              <input
                id="reading-time"
                className="textInput"
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="btnGhost"
            onClick={onOpenHistory}
            style={{ marginTop: 14 }}
          >
            <List size={15} />
            View saved readings
          </button>
          <div style={{ flex: 1 }} />
          <button
            className="btnPrimary"
            disabled={!valid}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="screenSub">Step 2 of 2 — confirm and save.</p>
          <Card>
            <div className="rowBetween">
              <span className="cardEyebrow">{context}</span>
              <span className={"statusTag statusTag-" + status.key}>
                {status.symbol} {status.label}
              </span>
            </div>
            <div className="bigNumber">
              {Number(num).toFixed(1)}{" "}
              <span className="bigNumberUnit">mmol/L</span>
            </div>
          </Card>

          <div style={{ flex: 1 }} />
          <button className="btnPrimary" onClick={handleSave}>
            {editingId ? "Save changes" : "Save reading"}
          </button>
          <button
            className="btnGhost"
            onClick={() => {
              resetEntryForm();
              setStep(1);
            }}
          >
            {editingId ? "Cancel edit" : "Edit"}
          </button>
        </>
      )}

      {step === 3 && (
        <div className="center" style={{ flex: 1 }}>
          <div className="savedTick">
            <Check size={26} strokeWidth={3} />
          </div>
          <div className="cardMainLine" style={{ marginTop: 14 }}>
            {c.saveMsg}
          </div>
          <div className="mutedSmall" style={{ marginTop: 4 }}>
            {online
              ? "Synced to your account."
              : "Stored on this device — will sync when you're back online."}
          </div>

          <button
            type="button"
            className="btnGhost"
            onClick={onOpenHistory}
            style={{ marginTop: 14 }}
          >
            <List size={15} />
            View saved readings
          </button>

          <div style={{ flex: 1 }} />
          <button className="btnPrimary" onClick={onBack}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
