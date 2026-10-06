/** Formats a date's local time for compact reminder labels. */
export function formatTimeShort(d) {
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Advances a reminder date to its next occurrence after now.
 * Unknown recurrence names leave a past date unchanged.
 */
export function getNextOccurrence(baseDate, repeat) {
  const now = new Date();
  let next = new Date(baseDate);

  if (!repeat || repeat === "Never") return next;

  const stepMap = {
    Daily: () => next.setDate(next.getDate() + 1),
    Weekly: () => next.setDate(next.getDate() + 7),
    "Every 2 Weeks": () => next.setDate(next.getDate() + 14),
    Monthly: () => next.setMonth(next.getMonth() + 1),
    "Every 3 Months": () => next.setMonth(next.getMonth() + 3),
    "Every 6 Months": () => next.setMonth(next.getMonth() + 6),
    Hourly: () => next.setHours(next.getHours() + 1),
    Yearly: () => next.setFullYear(next.getFullYear() + 1),
  };

  // If base is already in future, return that
  if (next > now) return next;

  // Advance until in future (with a safety cap)
  let guard = 0;
  while (next <= now && guard++ < 1000) {
    const step = stepMap[repeat];
    if (!step) break;
    step();
  }

  return next;
}

/** Formats a reminder's recurrence rule and scheduled time for display. */
export function formatReminderWhen(reminder) {
  if (!reminder || !reminder.when) return "";
  const date = new Date(reminder.when);
  const repeat = reminder.repeat || "Never";

  if (repeat && repeat !== "Never") {
    // show repeat label with time
    return `${repeat === "Daily" || repeat === "Every day" ? "Every day" : repeat}, ${formatTimeShort(date)}`;
  }

  // One-off: format nicely
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return `Today, ${formatTimeShort(date)}`;

  return `${date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: undefined })}, ${formatTimeShort(date)}`;
}

/** Formats a known future occurrence relative to the current local date. */
export function formatNextOccurrence(dateOrIso) {
  if (!dateOrIso) return "";
  const d =
    typeof dateOrIso === "string"
      ? new Date(dateOrIso)
      : new Date(dateOrIso.getTime());
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((dayStart - nowStart) / oneDay);
  const time = formatTimeShort(d);
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Tomorrow, ${time}`;
  // within the next 7 days show weekday
  if (diff > 1 && diff <= 7) {
    return `${d.toLocaleDateString([], { weekday: "short" })}, ${time}`;
  }
  // otherwise show short date
  return `${d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
}

/** Advances one scheduled occurrence by the reminder's recurrence interval. */
function advanceReminderDate(date, repeat) {
  const next = new Date(date);
  const stepMap = {
    Hourly: () => next.setHours(next.getHours() + 1),
    Daily: () => next.setDate(next.getDate() + 1),
    Weekly: () => next.setDate(next.getDate() + 7),
    "Every 2 Weeks": () => next.setDate(next.getDate() + 14),
    Monthly: () => next.setMonth(next.getMonth() + 1),
    "Every 3 Months": () => next.setMonth(next.getMonth() + 3),
    "Every 6 Months": () => next.setMonth(next.getMonth() + 6),
    Yearly: () => next.setFullYear(next.getFullYear() + 1),
  };
  const step = stepMap[repeat];
  if (step) step();
  return next;
}

/**
 * Returns the current occurrence state and any matching completion record.
 * Returns null if the reminder has no valid scheduled date.
 */
export function getReminderStatus(reminder, now = new Date()) {
  const baseDate = new Date(reminder?.when);
  if (!reminder?.when || Number.isNaN(baseDate.getTime())) return null;

  const repeat = reminder.repeat || "Never";
  const isRecurring = repeat !== "Never" && repeat !== "Custom";
  let occurrence = baseDate;
  let nextOccurrence = null;

  if (isRecurring) {
    let guard = 0;
    while (occurrence <= now && guard++ < 10000) {
      nextOccurrence = advanceReminderDate(occurrence, repeat);
      if (nextOccurrence <= now) {
        occurrence = nextOccurrence;
      } else {
        break;
      }
    }
    if (occurrence > now) {
      nextOccurrence = occurrence;
      occurrence = null;
    }
  }

  const occurrenceKey =
    occurrence?.toISOString() || nextOccurrence?.toISOString();
  const completion = (reminder.completionHistory || []).find(
    (entry) => entry.occurrenceAt === occurrenceKey,
  );

  if (completion) {
    const completedAt = new Date(completion.completedAt);
    return {
      key: "completed",
      label:
        completedAt <= new Date(occurrenceKey)
          ? "Completed on time"
          : "Completed late",
      occurrenceAt: occurrenceKey,
      nextOccurrence: isRecurring
        ? advanceReminderDate(new Date(occurrenceKey), repeat)
        : null,
      completion,
    };
  }

  if (occurrence && occurrence <= now) {
    return {
      key: "overdue",
      label: "Incomplete",
      occurrenceAt: occurrence.toISOString(),
      nextOccurrence,
      completion: null,
    };
  }

  return {
    key: "upcoming",
    label: "Upcoming",
    occurrenceAt: occurrenceKey,
    nextOccurrence,
    completion: null,
  };
}

export const COMPLETION_SORT_OPTIONS = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["reminder", "By reminder name"],
  ["late", "Completed late first"],
];

/** Collects completion history, applying optional filters and sort order. */
export function collectCompletions(
  reminders = [],
  { dateRange = null, reminderId = "all", sortBy = "newest" } = {},
) {
  const entries = reminders
    .filter(
      (reminder) =>
        reminderId === "all" || String(reminder.id) === String(reminderId),
    )
    .flatMap((reminder) =>
      (reminder.completionHistory || []).map((entry) => ({
        reminderId: reminder.id,
        reminderTitle: reminder.title,
        kind:
          reminder.kind === "Other"
            ? reminder.otherKind || "Other"
            : reminder.kind,
        what: entry.what,
        notes: entry.notes || "",
        completedAt: entry.completedAt,
        occurrenceAt: entry.occurrenceAt,
        onTime: new Date(entry.completedAt) <= new Date(entry.occurrenceAt),
      })),
    )
    .filter((entry) => {
      const completed = new Date(entry.completedAt);
      if (Number.isNaN(completed.getTime())) return false;
      return (
        !dateRange ||
        (completed >= dateRange.start && completed <= dateRange.end)
      );
    });

  const byDate = (a, b) => new Date(b.completedAt) - new Date(a.completedAt);
  return entries.sort((a, b) => {
    if (sortBy === "oldest") return -byDate(a, b);
    if (sortBy === "reminder")
      return a.reminderTitle.localeCompare(b.reminderTitle) || byDate(a, b);
    if (sortBy === "late")
      return Number(a.onTime) - Number(b.onTime) || byDate(a, b);
    return byDate(a, b);
  });
}
