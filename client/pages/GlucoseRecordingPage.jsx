import React, { useEffect, useState } from "react";
import { Check, ChevronLeft, Clock3, History, Plus } from "lucide-react";
import { AGE_GROUPS, COPY } from "../data/appData.js";
import { normalizeDecimalInput, statusOf } from "../utils/diabetes.js";

export function GlucoseRecordingPage({
  ageGroup,
  editingReading,
  onSave,
  onUpdate,
  onOpenHistory,
  onCancelEdit,
  onBack,
  online,
}) {
  const [value, setValue] = useState("");
  const [context, setContext] = useState("Before meal");
  const [dateValue, setDateValue] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [timeValue, setTimeValue] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [editingId, setEditingId] = useState(null);
  const [savedReading, setSavedReading] = useState(null);
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
      setSavedReading(null);
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
    setSavedReading({ value: num, context, status, dateValue, timeValue });
  }

  function startAnotherEntry() {
    resetEntryForm();
    setSavedReading(null);
  }

  return (
    <div className="screen">
      <div className="recordHeader">
        <button className="linkBack" onClick={onBack}>
          <ChevronLeft size={16} /> Home
        </button>
        <button
          className="recordHistoryLink"
          type="button"
          onClick={onOpenHistory}
        >
          <History size={15} /> History
        </button>
      </div>
      <h2 className="screenTitle">
        {editingId ? "Edit reading" : "Log glucose"}
      </h2>

      {savedReading ? (
        <div className="center" style={{ flex: 1 }}>
          <div className="savedTick">
            <Check size={26} strokeWidth={3} />
          </div>
          <div className="cardMainLine" style={{ marginTop: 14 }}>
            {editingId ? "Your reading was updated." : c.saveMsg}
          </div>
          <div className="mutedSmall" style={{ marginTop: 4 }}>
            {online
              ? "Synced to your account."
              : "Stored on this device — will sync when you're back online."}
          </div>

          <div style={{ flex: 1 }} />
          <button className="btnPrimary" onClick={startAnotherEntry}>
            <Plus size={16} /> Log another reading
          </button>
          <button className="btnGhost" onClick={onOpenHistory}>
            <History size={15} /> View history
          </button>
        </div>
      ) : (
        <>
          <p className="screenSub">
            {editingId
              ? "Update the details below and save when you are ready."
              : "Enter the number from your meter, then save."}
          </p>
          <div className="recordValueBlock">
            <label className="fieldLabel" htmlFor="bg">
              Blood glucose <span className="fieldUnit">mmol/L</span>
            </label>
            <input
              id="bg"
              className="textInput bigInput"
              inputMode="decimal"
              autoFocus
              placeholder="5.6"
              aria-describedby="reading-help"
              value={value}
              onChange={(e) => {
                const next = normalizeDecimalInput(e.target.value)
                  .replace(/[^0-9.]/g, "")
                  .replace(/(\..*)\./g, "$1");
                setValue(next);
              }}
            />
            <div id="reading-help" className="inputHint">
              Use the number shown on your meter.
            </div>
          </div>

          <div className="fieldLabel recordContextLabel">Reading context</div>
          <div className="chipRow recordContextOptions">
            {["Before meal", "After meal", "Random"].map((opt) => (
              <button
                type="button"
                key={opt}
                className={"chip" + (context === opt ? " chipActive" : "")}
                onClick={() => setContext(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          {valid && (
            <div className="recordStatusPreview">
              <span>Based on this context</span>
              <span className={"statusTag statusTag-" + status.key}>
                {status.symbol} {status.label}
              </span>
            </div>
          )}

          <details className="recordDetails">
            <summary>
              <Clock3 size={16} /> Change date or time
            </summary>
            <div className="recordDateGrid">
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
          </details>

          <div style={{ flex: 1 }} />
          <button
            className="btnPrimary recordSaveButton"
            disabled={!valid}
            onClick={handleSave}
          >
            {editingId ? "Save changes" : "Save reading"}
          </button>
          {editingId && (
            <button className="btnGhost" onClick={startAnotherEntry}>
              Cancel edit
            </button>
          )}
        </>
      )}
    </div>
  );
}
