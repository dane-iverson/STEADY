import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Edit3,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { Card } from "../components/Card";
import {
  formatReminderWhen,
  getNextOccurrence,
  formatNextOccurrence,
  getReminderStatus,
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
  const [completionId, setCompletionId] = useState(null);
  const [completedAt, setCompletedAt] = useState("");
  const [completedWhat, setCompletedWhat] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [toastMessage, setToastMessage] = useState("Reminder saved");

  const activeCount = reminders.filter((reminder) => reminder.on).length;
  const completedCount = reminders.filter(
    (reminder) => getReminderStatus(reminder)?.key === "completed",
  ).length;

  function toDateTimeLocalValue(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${hh}:${mm}`;
  }

  function startCompletion(reminder) {
    setCompletionId(reminder.id);
    setCompletedAt(toDateTimeLocalValue(new Date().toISOString()));
    setCompletedWhat(reminder.title || "");
    setCompletionNotes("");
  }

  function cancelCompletion() {
    setCompletionId(null);
    setCompletedAt("");
    setCompletedWhat("");
    setCompletionNotes("");
  }

  function saveCompletion(reminder) {
    if (!completedAt || !completedWhat.trim()) return;
    const status = getReminderStatus(reminder, new Date(completedAt));
    const completion = {
      id: `completion-${Date.now()}`,
      occurrenceAt: status?.occurrenceAt || reminder.when,
      completedAt: new Date(completedAt).toISOString(),
      what: completedWhat.trim(),
      notes: completionNotes.trim(),
    };
    setReminders(
      reminders.map((entry) =>
        entry.id === reminder.id
          ? {
              ...entry,
              completionHistory: [
                ...(entry.completionHistory || []),
                completion,
              ],
            }
          : entry,
      ),
    );
    cancelCompletion();
    setToastMessage("Completion logged");
    setJustSet(true);
    setTimeout(() => setJustSet(false), 2200);
  }

  function toggle(id) {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, on: !r.on } : r)));
  }

  function remove(id) {
    setReminders(reminders.filter((r) => r.id !== id));
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
    const wasEditing = Boolean(editingId);

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
          completionHistory: [],
        },
      ]);
    }

    resetForm();
    setAdding(false);
    setToastMessage(wasEditing ? "Reminder updated" : "Reminder saved");
    setJustSet(true);
    setTimeout(() => setJustSet(false), 2200);
  }

  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <ChevronLeft size={16} /> Home
      </button>

      <div className="reminderPageHeader">
        <div>
          <h2 className="screenTitle">Reminders</h2>
          <p className="screenSub">
            Keep track of what needs to be done and what has been completed.
          </p>
        </div>
        <div className="reminderCountBadge">
          <strong>{completedCount}</strong>
          <span>done now</span>
        </div>
      </div>

      {justSet && (
        <div className="toast">
          <Check size={14} /> {toastMessage}
        </div>
      )}

      <div className="reminderSummary" aria-label="Reminder summary">
        <div>
          <strong>{activeCount}</strong>
          <span>active</span>
        </div>
        <div>
          <strong>{reminders.length}</strong>
          <span>total</span>
        </div>
        <p>
          <ClipboardCheck size={15} /> Log what you did, not just that you saw
          it.
        </p>
      </div>

      <div className="sectionHeading reminderListHeading">
        <div>
          <div className="sectionKicker">YOUR PLAN</div>
          <h3>Today's reminders</h3>
        </div>
      </div>

      {reminders.map((r) => {
        const status = getReminderStatus(r);
        const history = [...(r.completionHistory || [])].reverse();
        const isLogging = completionId === r.id;
        const isHistoryOpen = expandedHistoryId === r.id;

        return (
          <Card key={r.id} style={{ marginBottom: 10 }}>
            <div className="reminderCardTop">
              <div className="reminderCardTitleRow">
                <div className="cardMainLine">{r.title}</div>
                {status && (
                  <span className={`reminderState reminderState-${status.key}`}>
                    {status.key === "completed" && <CheckCircle2 size={12} />}
                    {status.label}
                  </span>
                )}
              </div>
              <div className="rowGap">
                <button
                  className={"toggle" + (r.on ? " toggleOn" : "")}
                  onClick={() => toggle(r.id)}
                  aria-label={`${r.on ? "Disable" : "Enable"} ${r.title}`}
                  aria-pressed={r.on}
                >
                  <span className="toggleKnob" />
                </button>
                <button
                  className="iconBtn"
                  onClick={() => startEdit(r)}
                  aria-label={`Edit ${r.title}`}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="iconBtn"
                  onClick={() => remove(r.id)}
                  aria-label={`Delete ${r.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="reminderMeta">
              <span>
                {r.kind === "Other" ? r.otherKind || "Other" : r.kind}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {r.repeat && r.repeat !== "Never"
                  ? formatNextOccurrence(getNextOccurrence(r.when, r.repeat))
                  : formatReminderWhen(r)}
              </span>
            </div>

            {status?.completion && (
              <div className="reminderCompletionPreview">
                <CheckCircle2 size={15} />
                <span>
                  Done at{" "}
                  {new Date(status.completion.completedAt).toLocaleTimeString(
                    [],
                    { hour: "numeric", minute: "2-digit" },
                  )}
                  {status.completion.what ? ` · ${status.completion.what}` : ""}
                </span>
              </div>
            )}

            {isLogging ? (
              <div className="reminderCompletionForm">
                <div className="reminderFormTitle">
                  <FileText size={15} /> Log completion
                </div>
                <label className="fieldLabel" htmlFor={`completed-at-${r.id}`}>
                  When did you do it?
                </label>
                <input
                  id={`completed-at-${r.id}`}
                  className="textInput"
                  type="datetime-local"
                  value={completedAt}
                  onChange={(event) => setCompletedAt(event.target.value)}
                />
                <label
                  className="fieldLabel"
                  htmlFor={`completed-what-${r.id}`}
                >
                  What did you do?
                </label>
                <input
                  id={`completed-what-${r.id}`}
                  className="textInput"
                  value={completedWhat}
                  onChange={(event) => setCompletedWhat(event.target.value)}
                  placeholder="e.g. Checked glucose: 5.6 mmol/L"
                />
                <label
                  className="fieldLabel"
                  htmlFor={`completion-notes-${r.id}`}
                >
                  Notes <span className="fieldOptional">optional</span>
                </label>
                <textarea
                  id={`completion-notes-${r.id}`}
                  className="textInput reminderNotesInput"
                  value={completionNotes}
                  onChange={(event) => setCompletionNotes(event.target.value)}
                  placeholder="Anything worth remembering?"
                  rows="2"
                />
                <div className="reminderFormActions">
                  <button
                    className="btnPrimary"
                    onClick={() => saveCompletion(r)}
                    disabled={!completedAt || !completedWhat.trim()}
                  >
                    Save completion
                  </button>
                  <button className="btnGhost" onClick={cancelCompletion}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="reminderCardActions">
                <button
                  className="btnPrimary reminderDoneButton"
                  onClick={() => startCompletion(r)}
                >
                  <CheckCircle2 size={15} />{" "}
                  {status?.key === "completed" ? "Log again" : "Mark as done"}
                </button>
                {history.length > 0 && (
                  <button
                    className="reminderHistoryButton"
                    onClick={() =>
                      setExpandedHistoryId(isHistoryOpen ? null : r.id)
                    }
                    aria-expanded={isHistoryOpen}
                  >
                    {isHistoryOpen
                      ? "Hide activity"
                      : `View activity (${history.length})`}
                  </button>
                )}
              </div>
            )}

            {isHistoryOpen && (
              <div className="reminderHistoryList">
                {history.slice(0, 4).map((entry) => (
                  <div className="reminderHistoryItem" key={entry.id}>
                    <div>
                      <strong>{entry.what}</strong>
                      <span>
                        {new Date(entry.completedAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    {entry.notes && <p>{entry.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

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
