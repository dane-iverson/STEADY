import React, { useState } from "react";
import { Check, ChevronLeft, Plus, Trash2, Edit3 } from "lucide-react";
import { Card } from "../components/Card";
import {
  formatReminderWhen,
  getNextOccurrence,
  formatNextOccurrence,
} from "../utils/reminders";

export function RemindersPage({ reminders, setReminders, onBack }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Glucose check");
  const [otherKind, setOtherKind] = useState("");
  const [when, setWhen] = useState("");
  const [repeat, setRepeat] = useState("Never");
  const [editingId, setEditingId] = useState(null);
  const [justSet, setJustSet] = useState(false);

  function toggle(id) {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, on: !r.on } : r)));
  }

  function remove(id) {
    setReminders(reminders.filter((r) => r.id !== id));
  }

  function toDateTimeLocalValue(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${hh}:${mm}`;
  }

  function startEdit(r) {
    setEditingId(r.id);
    setAdding(true);
    setTitle(r.title || "");
    setKind(r.kind || "Glucose check");
    setOtherKind(r.otherKind || "");
    setRepeat(r.repeat || "Never");
    setWhen(toDateTimeLocalValue(r.when));
  }

  function resetForm() {
    setTitle("");
    setWhen("");
    setOtherKind("");
    setRepeat("Never");
    setEditingId(null);
  }

  function add() {
    if (!title.trim() || !when) return;
    const iso = new Date(when).toISOString();

    if (editingId) {
      const next = reminders.map((r) =>
        r.id === editingId
          ? {
              ...r,
              title: title.trim(),
              kind,
              otherKind: otherKind.trim(),
              when: iso,
              repeat,
            }
          : r,
      );
      setReminders(next);
    } else {
      setReminders([
        ...reminders,
        {
          id: Date.now(),
          title: title.trim(),
          kind,
          otherKind: otherKind.trim(),
          when: iso,
          repeat,
          on: true,
        },
      ]);
    }

    resetForm();
    setAdding(false);
    setJustSet(true);
    setTimeout(() => setJustSet(false), 2200);
  }

  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <ChevronLeft size={16} /> Home
      </button>

      <h2 className="screenTitle">Reminders</h2>
      <p className="screenSub">
        Blood glucose checks, insulin, appointments and other reminders.
      </p>

      {justSet && (
        <div className="toast">
          <Check size={14} /> Reminder set
        </div>
      )}

      {reminders.map((r) => (
        <Card key={r.id} style={{ marginBottom: 10 }}>
          <div className="rowBetween">
            <div>
              <div className="cardMainLine">{r.title}</div>
              <div className="mutedSmall">
                {r.kind === "Other" ? r.otherKind || "Other" : r.kind} ·{" "}
                {r.repeat && r.repeat !== "Never"
                  ? formatNextOccurrence(getNextOccurrence(r.when, r.repeat))
                  : formatReminderWhen(r)}
              </div>
            </div>
            <div className="rowGap">
              <button
                className={"toggle" + (r.on ? " toggleOn" : "")}
                onClick={() => toggle(r.id)}
                aria-label="Toggle reminder"
              >
                <span className="toggleKnob" />
              </button>
              <button
                className="iconBtn"
                onClick={() => remove(r.id)}
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
              <button
                className="iconBtn"
                onClick={() => startEdit(r)}
                aria-label="Edit"
              >
                <Edit3 size={16} />
              </button>
            </div>
          </div>
        </Card>
      ))}

      {!adding ? (
        <button className="btnGhost" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add reminder
        </button>
      ) : (
        <Card>
          <label className="fieldLabel">What's it for?</label>
          <div className="chipRow">
            {["Glucose check", "Insulin", "Appointment", "Other"].map((k) => (
              <button
                key={k}
                className={"chip" + (kind === k ? " chipActive" : "")}
                onClick={() => setKind(k)}
              >
                {k}
              </button>
            ))}
          </div>

          {kind === "Other" && (
            <>
              <label className="fieldLabel" style={{ marginTop: 8 }}>
                Describe Other
              </label>
              <input
                className="textInput"
                value={otherKind}
                onChange={(e) => setOtherKind(e.target.value)}
                placeholder="e.g. Take medication"
              />
            </>
          )}

          <label className="fieldLabel" style={{ marginTop: 12 }}>
            Title
          </label>
          <input
            className="textInput"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lunchtime check"
          />

          <label className="fieldLabel" style={{ marginTop: 12 }}>
            When
          </label>
          <input
            className="textInput"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />

          <label className="fieldLabel" style={{ marginTop: 12 }}>
            Repeat
          </label>
          <select
            className="textInput"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          >
            {[
              "Never",
              "Hourly",
              "Daily",
              "Weekly",
              "Every 2 Weeks",
              "Monthly",
              "Every 3 Months",
              "Every 6 Months",
              "Yearly",
              "Custom",
            ].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <div className="rowGap" style={{ marginTop: 14 }}>
            <button className="btnPrimary" style={{ flex: 1 }} onClick={add}>
              {editingId ? "Save changes" : "Set reminder"}
            </button>
            <button
              className="btnGhost"
              style={{ flex: 1 }}
              onClick={() => {
                setAdding(false);
                resetForm();
              }}
            >
              Cancel
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
