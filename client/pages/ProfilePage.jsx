import React, { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Lock,
  Pencil,
  Inbox,
  Share2,
  Send,
  Trash2,
  UserPlus,
  User,
  Users,
} from "lucide-react";
import { AGE_GROUPS } from "../data/appData";
import { Card } from "../components/Card";
import {
  DEFAULT_GLUCOSE_RANGE_LIMITS,
  getReadingDateRange,
  readingsForDateRange,
  statusOf,
} from "../utils/diabetes";

const TREND_SHARE_RANGES = [
  "Last 7 days",
  "Last 30 days",
  "Last 3 months",
  "Last 6 months",
  "This year",
  "All recordings",
];

function buildSharedTrendPoints(readings, mode) {
  const sorted = readings
    .map((reading) => ({
      value: Number(reading.v),
      timestamp: new Date(reading.date),
    }))
    .filter(
      (reading) =>
        Number.isFinite(reading.value) &&
        !Number.isNaN(reading.timestamp.getTime()),
    )
    .sort((first, second) => first.timestamp - second.timestamp);

  if (mode === "daily") {
    return sorted.map((reading) => ({
      t: reading.timestamp.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      }),
      v: reading.value,
    }));
  }

  const weeks = new Map();
  sorted.forEach((reading) => {
    const start = new Date(reading.timestamp);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const key = start.toISOString().slice(0, 10);
    if (!weeks.has(key)) weeks.set(key, { date: start, values: [] });
    weeks.get(key).values.push(reading.value);
  });
  return [...weeks.values()].map(({ date, values }) => ({
    t: date.toLocaleDateString([], { day: "numeric", month: "short" }),
    v: values.reduce((sum, value) => sum + value, 0) / values.length,
  }));
}

export function ProfilePage({
  ageGroup,
  profile,
  readings = [],
  reminders = [],
  setProfile,
  sharing,
  setSharing,
  onSendSharedItem,
  onConnectCaregiver,
  onBack,
  onLogout,
}) {
  const [tab, setTab] = useState("profile");
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [editingGlucoseRanges, setEditingGlucoseRanges] = useState(false);
  const [editingHba1c, setEditingHba1c] = useState(false);
  const [draftProfile, setDraftProfile] = useState(profile);
  const [draftGlucoseRanges, setDraftGlucoseRanges] = useState(
    profile.glucoseRanges || DEFAULT_GLUCOSE_RANGE_LIMITS,
  );
  const [draftHba1c, setDraftHba1c] = useState({
    hba1c: profile.hba1c || "",
    hba1cDate: profile.hba1cDate || "",
  });
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [shareType, setShareType] = useState("glucose");
  const [trendShareRange, setTrendShareRange] = useState("Last 7 days");
  const [trendShareStart, setTrendShareStart] = useState("");
  const [trendShareEnd, setTrendShareEnd] = useState("");
  const [trendShareMode, setTrendShareMode] = useState("both");
  const [sharingMessage, setSharingMessage] = useState("");
  const [sharingBusy, setSharingBusy] = useState(false);

  useEffect(() => {
    setDraftProfile(profile);
    setDraftGlucoseRanges({
      ...DEFAULT_GLUCOSE_RANGE_LIMITS,
      ...(profile.glucoseRanges || {}),
    });
    setDraftHba1c({
      hba1c: profile.hba1c || "",
      hba1cDate: profile.hba1cDate || "",
    });
  }, [profile]);

  function updateDraft(key, value) {
    setDraftProfile((current) => ({ ...current, [key]: value }));
  }

  function savePersonalInfo() {
    setProfile(draftProfile);
    setEditingPersonalInfo(false);
  }

  function cancelPersonalInfo() {
    setDraftProfile(profile);
    setEditingPersonalInfo(false);
  }

  function displayValue(value) {
    return value || "Not provided";
  }

  const glucoseRanges = {
    ...DEFAULT_GLUCOSE_RANGE_LIMITS,
    ...(profile.glucoseRanges || {}),
  };

  function saveGlucoseRanges() {
    setProfile({ ...profile, glucoseRanges: draftGlucoseRanges });
    setEditingGlucoseRanges(false);
  }

  function saveHba1c() {
    setProfile({ ...profile, ...draftHba1c });
    setEditingHba1c(false);
  }

  const caregivers = sharing.caregivers || [];
  const sharedItems = sharing.sharedItems || [];

  async function addCaregiver() {
    const email = caregiverEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (caregivers.some((caregiver) => caregiver.email === email)) return;
    setSharingBusy(true);
    setSharingMessage("");
    try {
      const caregiver = await onConnectCaregiver?.(email);
      setSharing({
        ...sharing,
        on: true,
        caregivers: [
          ...caregivers,
          {
            id: caregiver?._id || `caregiver-${Date.now()}`,
            email,
            name: caregiver?.name || "",
            status: "connected",
            addedAt: new Date().toISOString(),
            permissions: { ...sharing.perms },
          },
        ],
      });
      setCaregiverEmail("");
      setSharingMessage("Caregiver account connected.");
    } catch (error) {
      setSharingMessage(error.message);
    } finally {
      setSharingBusy(false);
    }
  }

  function removeCaregiver(id) {
    setSharing({
      ...sharing,
      caregivers: caregivers.filter((caregiver) => caregiver.id !== id),
    });
  }

  function sendSharedItem() {
    if (!caregivers.length) return;
    const latestReading = readings[readings.length - 1];
    const latestReminder = reminders[0];
    const trendDateRange =
      trendShareRange === "All recordings"
        ? null
        : trendShareRange === "Custom"
          ? getReadingDateRange(trendShareRange, trendShareStart, trendShareEnd)
          : getReadingDateRange(trendShareRange);
    const trendReadings = readingsForDateRange(readings, trendDateRange);
    const trendDailyPoints = buildSharedTrendPoints(trendReadings, "daily");
    const trendWeeklyPoints = buildSharedTrendPoints(trendReadings, "weekly");
    const itemDetails = {
      glucose: latestReading
        ? `Latest reading: ${Number(latestReading.v).toFixed(1)} mmol/L (${latestReading.context || "Random"})`
        : "No glucose readings saved yet.",
      trends: `Trend report: ${trendReadings.length} readings for ${trendShareRange === "Custom" ? `${trendShareStart} to ${trendShareEnd}` : trendShareRange}.`,
      reminders: latestReminder
        ? `Reminder activity: ${latestReminder.title}`
        : "No reminder activity saved yet.",
      hba1c: profile.hba1c
        ? `Most recent HbA1c: ${profile.hba1c}%${profile.hba1cDate ? ` on ${profile.hba1cDate}` : ""}`
        : "No HbA1c result saved yet.",
    };
    const validValues = readings
      .map((reading) => Number(reading.v))
      .filter(Number.isFinite);
    const average = validValues.length
      ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
      : null;
    const latestStatus = latestReading
      ? statusOf(
          latestReading.v,
          latestReading.context || "Random",
          profile.glucoseRanges,
        )
      : null;
    const labels = {
      glucose: "Glucose reading",
      trends: "Trend summary",
      reminders: "Reminder activity",
      hba1c: "HbA1c result",
    };
    const sharedItem = {
      id: `share-${Date.now()}`,
      type: shareType,
      title: labels[shareType],
      detail: itemDetails[shareType],
      sharedAt: new Date().toISOString(),
      viewedAt: null,
      senderName: `${profile.name || ""} ${profile.surname || ""}`.trim(),
      data:
        shareType === "glucose"
          ? {
              value: latestReading?.v ?? null,
              unit: "mmol/L",
              context: latestReading?.context || "Random",
              readingAt: latestReading?.date || null,
              status: latestStatus?.label || null,
            }
          : shareType === "trends"
            ? {
                readingCount: trendReadings.length,
                averageGlucose: trendReadings.length
                  ? trendReadings.reduce(
                      (sum, reading) => sum + Number(reading.v),
                      0,
                    ) / trendReadings.length
                  : null,
                rangeLabel:
                  trendShareRange === "Custom"
                    ? `${trendShareStart} to ${trendShareEnd}`
                    : trendShareRange,
                chartMode: trendShareMode,
                dailyPoints: trendDailyPoints,
                weeklyPoints: trendWeeklyPoints,
                glucoseRanges: profile.glucoseRanges,
              }
            : shareType === "reminders"
              ? {
                  reminderTitle: latestReminder?.title || null,
                  completedCount: reminders.filter(
                    (reminder) => (reminder.completionHistory || []).length > 0,
                  ).length,
                  activeCount: reminders.filter((reminder) => reminder.on)
                    .length,
                }
              : {
                  value: profile.hba1c || null,
                  unit: "%",
                  testedAt: profile.hba1cDate || null,
                },
    };
    setSharing({
      ...sharing,
      on: true,
      sharedItems: [sharedItem, ...sharedItems],
    });
    setSharingBusy(true);
    setSharingMessage("");
    Promise.all(
      caregivers.map((caregiver) =>
        onSendSharedItem?.(sharedItem, caregiver.email),
      ),
    )
      .then(() => setSharingMessage("Update sent to the caregiver inbox."))
      .catch((error) => setSharingMessage(error.message))
      .finally(() => setSharingBusy(false));
  }

  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <span style={{ display: "inline-flex", alignItems: "center" }}>←</span>{" "}
        Home
      </button>
      <h2 className="screenTitle">Your details</h2>
      <div className="chipRow">
        <button
          className={"chip" + (tab === "profile" ? " chipActive" : "")}
          onClick={() => setTab("profile")}
        >
          <User size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{" "}
          Medical profile
        </button>
        <button
          className={"chip" + (tab === "sharing" ? " chipActive" : "")}
          onClick={() => setTab("sharing")}
        >
          <Users size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{" "}
          Caregiver sharing
        </button>
      </div>

      {tab === "profile" && (
        <>
          <details className="profileDetails">
            <summary className="profileSummary">
              <span>Personal information</span>
              <ChevronDown size={17} />
            </summary>
            {!editingPersonalInfo ? (
              <>
                <div className="profileInfoGrid">
                  <div>
                    <span className="profileInfoLabel">First name</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.name)}
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">Surname</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.surname)}
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">Date of birth</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.dateOfBirth)}
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">Height</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.height)}
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">Weight</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.weight)}
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">Gender</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.gender)}
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">Other medication</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.otherMedication)}
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">Allergies</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.allergies)}
                    </span>
                  </div>
                </div>
                <button
                  className="btnGhost profileAction"
                  type="button"
                  onClick={() => setEditingPersonalInfo(true)}
                >
                  <Pencil size={15} /> Edit information
                </button>
              </>
            ) : (
              <div className="profileEditForm">
                <label className="fieldLabel">First name</label>
                <input
                  className="textInput"
                  value={draftProfile.name || ""}
                  onChange={(e) => updateDraft("name", e.target.value)}
                />
                <label className="fieldLabel" style={{ marginTop: 12 }}>
                  Surname
                </label>
                <input
                  className="textInput"
                  value={draftProfile.surname || ""}
                  onChange={(e) => updateDraft("surname", e.target.value)}
                />
                <label className="fieldLabel" style={{ marginTop: 12 }}>
                  Date of birth
                </label>
                <input
                  className="textInput"
                  type="date"
                  value={draftProfile.dateOfBirth || ""}
                  onChange={(e) => updateDraft("dateOfBirth", e.target.value)}
                />
                <div className="formGrid" style={{ marginTop: 12 }}>
                  <div>
                    <label className="fieldLabel">Height</label>
                    <input
                      className="textInput"
                      value={draftProfile.height || ""}
                      onChange={(e) => updateDraft("height", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="fieldLabel">Weight</label>
                    <input
                      className="textInput"
                      value={draftProfile.weight || ""}
                      onChange={(e) => updateDraft("weight", e.target.value)}
                    />
                  </div>
                </div>
                <label className="fieldLabel" style={{ marginTop: 12 }}>
                  Gender
                </label>
                <select
                  className="textInput"
                  value={
                    draftProfile.gender === "Male" ||
                    draftProfile.gender === "Female"
                      ? draftProfile.gender
                      : ""
                  }
                  onChange={(e) => updateDraft("gender", e.target.value)}
                  required
                >
                  <option value="">Select an option</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <label className="fieldLabel" style={{ marginTop: 12 }}>
                  Other medication
                </label>
                <input
                  className="textInput"
                  value={draftProfile.otherMedication || ""}
                  onChange={(e) =>
                    updateDraft("otherMedication", e.target.value)
                  }
                />
                <label className="fieldLabel" style={{ marginTop: 12 }}>
                  Allergies
                </label>
                <input
                  className="textInput"
                  value={draftProfile.allergies || ""}
                  onChange={(e) => updateDraft("allergies", e.target.value)}
                />
                <div className="profileEditActions">
                  <button
                    className="btnGhost"
                    type="button"
                    onClick={cancelPersonalInfo}
                  >
                    Cancel
                  </button>
                  <button
                    className="btnPrimary"
                    type="button"
                    onClick={savePersonalInfo}
                  >
                    <Check size={16} /> Save changes
                  </button>
                </div>
              </div>
            )}
          </details>

          <details className="profileDetails" open>
            <summary className="profileSummary">
              <span>Glucose ranges</span>
              <ChevronDown size={17} />
            </summary>
            {!editingGlucoseRanges && (
              <p className="mutedSmall">
                These ranges personalise labels across your readings, dashboard,
                trends and reports. Confirm them with your diabetes team.
              </p>
            )}
            {!editingGlucoseRanges ? (
              <>
                <div className="profileInfoGrid">
                  <div>
                    <span className="profileInfoLabel">Very low below</span>
                    <span className="profileInfoValue">
                      {glucoseRanges.veryLowMax} mmol/L
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">Low below</span>
                    <span className="profileInfoValue">
                      {glucoseRanges.lowMax} mmol/L
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">In range up to</span>
                    <span className="profileInfoValue">
                      {glucoseRanges.targetMax} mmol/L
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">High below</span>
                    <span className="profileInfoValue">
                      {glucoseRanges.highMax} mmol/L
                    </span>
                  </div>
                </div>
                <button
                  className="btnGhost profileAction"
                  type="button"
                  onClick={() => setEditingGlucoseRanges(true)}
                >
                  <Pencil size={15} /> Edit glucose ranges
                </button>
              </>
            ) : (
              <>
                <div className="profileRangeGrid">
                  <div>
                    <label className="fieldLabel" htmlFor="range-very-low">
                      Very low below
                    </label>
                    <input
                      id="range-very-low"
                      className="textInput"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={draftGlucoseRanges.veryLowMax}
                      onChange={(event) =>
                        setDraftGlucoseRanges({
                          ...draftGlucoseRanges,
                          veryLowMax: event.target.value,
                        })
                      }
                    />
                    <span className="profileFieldHint">mmol/L</span>
                  </div>
                  <div>
                    <label className="fieldLabel" htmlFor="range-low">
                      Low below
                    </label>
                    <input
                      id="range-low"
                      className="textInput"
                      type="number"
                      min="0.2"
                      step="0.1"
                      value={draftGlucoseRanges.lowMax}
                      onChange={(event) =>
                        setDraftGlucoseRanges({
                          ...draftGlucoseRanges,
                          lowMax: event.target.value,
                        })
                      }
                    />
                    <span className="profileFieldHint">mmol/L</span>
                  </div>
                  <div>
                    <label className="fieldLabel" htmlFor="range-target">
                      In range up to
                    </label>
                    <input
                      id="range-target"
                      className="textInput"
                      type="number"
                      min="0.3"
                      step="0.1"
                      value={draftGlucoseRanges.targetMax}
                      onChange={(event) =>
                        setDraftGlucoseRanges({
                          ...draftGlucoseRanges,
                          targetMax: event.target.value,
                        })
                      }
                    />
                    <span className="profileFieldHint">mmol/L</span>
                  </div>
                  <div>
                    <label className="fieldLabel" htmlFor="range-high">
                      High below
                    </label>
                    <input
                      id="range-high"
                      className="textInput"
                      type="number"
                      min="0.4"
                      step="0.1"
                      value={draftGlucoseRanges.highMax}
                      onChange={(event) =>
                        setDraftGlucoseRanges({
                          ...draftGlucoseRanges,
                          highMax: event.target.value,
                        })
                      }
                    />
                    <span className="profileFieldHint">mmol/L</span>
                  </div>
                </div>
                <div className="profileRangeLegend">
                  <span>
                    <i className="profileRangeDot profileRangeDot-low" /> Very
                    low
                  </span>
                  <span>
                    <i className="profileRangeDot profileRangeDot-low" /> Low
                  </span>
                  <span>
                    <i className="profileRangeDot profileRangeDot-target" /> In
                    range
                  </span>
                  <span>
                    <i className="profileRangeDot profileRangeDot-high" /> High
                  </span>
                  <span>
                    <i className="profileRangeDot profileRangeDot-high" /> Very
                    high
                  </span>
                </div>
                <div className="profileEditActions">
                  <button
                    className="btnGhost"
                    type="button"
                    onClick={() => {
                      setDraftGlucoseRanges(glucoseRanges);
                      setEditingGlucoseRanges(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btnPrimary"
                    type="button"
                    onClick={saveGlucoseRanges}
                  >
                    <Check size={16} /> Save ranges
                  </button>
                </div>
              </>
            )}
          </details>

          <details className="profileDetails" open>
            <summary className="profileSummary">
              <span>Most recent HbA1c</span>
              <ChevronDown size={17} />
            </summary>
            {!editingHba1c && (
              <p className="mutedSmall">
                HbA1c reflects your average glucose over roughly the previous
                three months. Add the result and the date of the test.
              </p>
            )}
            {!editingHba1c ? (
              <>
                <div className="profileInfoGrid">
                  <div>
                    <span className="profileInfoLabel">Result</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.hba1c ? `${profile.hba1c}%` : "")}
                    </span>
                  </div>
                  <div>
                    <span className="profileInfoLabel">Test date</span>
                    <span className="profileInfoValue">
                      {displayValue(profile.hba1cDate)}
                    </span>
                  </div>
                </div>
                <button
                  className="btnGhost profileAction"
                  type="button"
                  onClick={() => setEditingHba1c(true)}
                >
                  <Pencil size={15} /> Edit HbA1c
                </button>
              </>
            ) : (
              <>
                <div className="profileRangeGrid">
                  <div>
                    <label className="fieldLabel" htmlFor="hba1c-value">
                      HbA1c result (%)
                    </label>
                    <input
                      id="hba1c-value"
                      className="textInput"
                      type="number"
                      min="0"
                      max="30"
                      step="0.1"
                      value={draftHba1c.hba1c}
                      onChange={(event) =>
                        setDraftHba1c({
                          ...draftHba1c,
                          hba1c: event.target.value,
                        })
                      }
                      placeholder="e.g. 7.2"
                    />
                  </div>
                  <div>
                    <label className="fieldLabel" htmlFor="hba1c-date">
                      Test date
                    </label>
                    <input
                      id="hba1c-date"
                      className="textInput"
                      type="date"
                      value={draftHba1c.hba1cDate}
                      onChange={(event) =>
                        setDraftHba1c({
                          ...draftHba1c,
                          hba1cDate: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="profileEditActions">
                  <button
                    className="btnGhost"
                    type="button"
                    onClick={() => {
                      setDraftHba1c({
                        hba1c: profile.hba1c || "",
                        hba1cDate: profile.hba1cDate || "",
                      });
                      setEditingHba1c(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btnPrimary"
                    type="button"
                    onClick={saveHba1c}
                  >
                    <Check size={16} /> Save HbA1c
                  </button>
                </div>
              </>
            )}
          </details>

          <label className="fieldLabel" style={{ marginTop: 12 }}>
            Age group
          </label>
          <div className="chipRow">
            {Object.entries(AGE_GROUPS).map(([k, g]) => (
              <span
                key={k}
                className={"chip" + (ageGroup === k ? " chipActive" : "")}
                style={{ pointerEvents: "none" }}
              >
                {g.name}
              </span>
            ))}
          </div>

          <label className="fieldLabel" style={{ marginTop: 12 }}>
            T1DM status
          </label>
          <input
            className="textInput"
            value={profile.status}
            onChange={(e) => setProfile({ ...profile, status: e.target.value })}
          />

          <label className="fieldLabel" style={{ marginTop: 12 }}>
            Emergency contact name
          </label>
          <input
            className="textInput"
            value={profile.contactName}
            onChange={(e) =>
              setProfile({ ...profile, contactName: e.target.value })
            }
          />

          <label className="fieldLabel" style={{ marginTop: 12 }}>
            Emergency contact number
          </label>
          <input
            className="textInput"
            value={profile.contactNumber}
            onChange={(e) =>
              setProfile({ ...profile, contactNumber: e.target.value })
            }
          />

          <Card style={{ marginTop: 14 }}>
            <div className="rowGap">
              <Lock size={14} />
              <span className="mutedSmall">
                Kept on this device for the prototype. A production version
                would explain exactly how this data is stored and protected.
              </span>
            </div>
          </Card>

          <button className="btnDanger" type="button" onClick={onLogout}>
            Log out
          </button>
        </>
      )}

      {tab === "sharing" && (
        <>
          <Card>
            <div className="rowBetween">
              <div>
                <div className="cardMainLine">
                  <Share2
                    size={15}
                    style={{ verticalAlign: -2, marginRight: 6 }}
                  />
                  Share with a caregiver
                </div>
                <div className="mutedSmall">
                  Connect a caregiver account and send selected information
                  through Steady.
                </div>
              </div>
              <button
                className={"toggle" + (sharing.on ? " toggleOn" : "")}
                onClick={() => setSharing({ ...sharing, on: !sharing.on })}
              >
                <span className="toggleKnob" />
              </button>
            </div>
          </Card>

          {sharing.on && (
            <>
              <div className="caregiverConnectionPanel">
                <div className="sectionKicker">CAREGIVER ACCOUNT</div>
                <h3>Add a caregiver</h3>
                <p className="mutedSmall">
                  Use the email address they used for their caregiver account.
                  Health information stays inside the app.
                </p>
                <div className="caregiverInviteRow">
                  <input
                    className="textInput"
                    type="email"
                    value={caregiverEmail}
                    onChange={(event) => setCaregiverEmail(event.target.value)}
                    placeholder="caregiver@example.com"
                    aria-label="Caregiver account email"
                  />
                  <button
                    className="btnPrimary caregiverInviteButton"
                    type="button"
                    onClick={addCaregiver}
                    disabled={!caregiverEmail.includes("@") || sharingBusy}
                  >
                    <UserPlus size={15} /> {sharingBusy ? "Checking..." : "Add"}
                  </button>
                </div>
                {caregivers.map((caregiver) => (
                  <div className="caregiverConnection" key={caregiver.id}>
                    <div className="caregiverConnectionIdentity">
                      <div className="caregiverAvatar">
                        <User size={15} />
                      </div>
                      <div>
                        <strong>{caregiver.email}</strong>
                        <span>Connected caregiver account</span>
                      </div>
                    </div>
                    <button
                      className="iconBtn"
                      type="button"
                      onClick={() => removeCaregiver(caregiver.id)}
                      aria-label={`Remove caregiver ${caregiver.email}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="fieldLabel" style={{ marginTop: 4 }}>
                Permissions
              </div>
              {[
                ["glucose", "Blood glucose readings"],
                ["trends", "Trend graphs"],
                ["reminders", "Reminder activity"],
                ["hba1c", "HbA1c result"],
              ].map(([key, label]) => (
                <Card key={key} style={{ marginBottom: 8 }}>
                  <div className="rowBetween">
                    <span className="cardMainLine" style={{ fontWeight: 500 }}>
                      {label}
                    </span>
                    <button
                      className={
                        "toggle" + (sharing.perms[key] ? " toggleOn" : "")
                      }
                      onClick={() =>
                        setSharing({
                          ...sharing,
                          perms: {
                            ...sharing.perms,
                            [key]: !sharing.perms[key],
                          },
                          caregivers: caregivers.map((caregiver) => ({
                            ...caregiver,
                            permissions: {
                              ...caregiver.permissions,
                              [key]: !sharing.perms[key],
                            },
                          })),
                        })
                      }
                    >
                      <span className="toggleKnob" />
                    </button>
                  </div>
                </Card>
              ))}

              <Card className="caregiverSendPanel">
                <div className="rowBetween">
                  <div>
                    <div className="sectionKicker">SEND THROUGH STEADY</div>
                    <h3>Share an update</h3>
                  </div>
                  <Send size={17} className="caregiverAccentIcon" />
                </div>
                <p className="mutedSmall">
                  Choose one update to place in the caregiver's in-app inbox.
                </p>
                <select
                  className="textInput"
                  value={shareType}
                  onChange={(event) => setShareType(event.target.value)}
                  disabled={
                    !caregivers.length ||
                    !sharing.perms[shareType] ||
                    sharingBusy ||
                    (shareType === "trends" &&
                      trendShareRange === "Custom" &&
                      (!trendShareStart || !trendShareEnd))
                  }
                >
                  <option value="glucose" disabled={!sharing.perms.glucose}>
                    Latest glucose reading
                  </option>
                  <option value="trends" disabled={!sharing.perms.trends}>
                    Trend summary
                  </option>
                  <option value="reminders" disabled={!sharing.perms.reminders}>
                    Reminder activity
                  </option>
                  <option value="hba1c" disabled={!sharing.perms.hba1c}>
                    HbA1c result
                  </option>
                </select>
                {shareType === "trends" && (
                  <div className="trendShareOptions">
                    <label className="fieldLabel" htmlFor="share-trend-range">
                      Date range
                    </label>
                    <select
                      id="share-trend-range"
                      className="textInput"
                      value={trendShareRange}
                      onChange={(event) =>
                        setTrendShareRange(event.target.value)
                      }
                    >
                      {TREND_SHARE_RANGES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value="Custom">Custom dates</option>
                    </select>
                    {trendShareRange === "Custom" && (
                      <div className="trendDateGrid">
                        <div>
                          <label
                            className="fieldLabel"
                            htmlFor="share-trend-start"
                          >
                            From
                          </label>
                          <input
                            id="share-trend-start"
                            className="textInput"
                            type="date"
                            value={trendShareStart}
                            onChange={(event) =>
                              setTrendShareStart(event.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label
                            className="fieldLabel"
                            htmlFor="share-trend-end"
                          >
                            To
                          </label>
                          <input
                            id="share-trend-end"
                            className="textInput"
                            type="date"
                            value={trendShareEnd}
                            onChange={(event) =>
                              setTrendShareEnd(event.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}
                    <label className="fieldLabel" htmlFor="share-trend-mode">
                      Include graphs
                    </label>
                    <select
                      id="share-trend-mode"
                      className="textInput"
                      value={trendShareMode}
                      onChange={(event) =>
                        setTrendShareMode(event.target.value)
                      }
                    >
                      <option value="daily">Daily graph only</option>
                      <option value="weekly">Weekly graph only</option>
                      <option value="both">Daily and weekly graphs</option>
                    </select>
                  </div>
                )}
                <button
                  className="btnPrimary caregiverSendButton"
                  type="button"
                  onClick={sendSharedItem}
                  disabled={
                    !caregivers.length ||
                    !sharing.perms[shareType] ||
                    sharingBusy
                  }
                >
                  <Send size={15} />{" "}
                  {sharingBusy ? "Sending..." : "Send to caregiver inbox"}
                </button>
                {sharingMessage && (
                  <div className="sharingFeedback" role="status">
                    {sharingMessage}
                  </div>
                )}
              </Card>

              <div className="fieldLabel" style={{ marginTop: 10 }}>
                Shared with caregiver
              </div>
              <Card className="caregiverInboxPanel">
                <div className="rowBetween">
                  <div className="cardMainLine">
                    <Inbox
                      size={15}
                      style={{ verticalAlign: -2, marginRight: 6 }}
                    />{" "}
                    In-app shared inbox
                  </div>
                  <span className="sectionHeadingMeta">
                    {sharedItems.length} sent
                  </span>
                </div>
                {sharedItems.length ? (
                  sharedItems.slice(0, 5).map((item) => (
                    <div className="sharedItem" key={item.id}>
                      <div className="sharedItemTop">
                        <strong>{item.title}</strong>
                        <span>
                          {new Date(item.sharedAt).toLocaleDateString([], {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <p>{item.detail}</p>
                    </div>
                  ))
                ) : (
                  <div className="mutedSmall caregiverEmptyInbox">
                    Nothing shared yet. Updates you send will appear here.
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
