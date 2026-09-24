import React, { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Lock,
  Pencil,
  Share2,
  User,
  Users,
} from "lucide-react";
import { AGE_GROUPS } from "../data/appData";
import { Card } from "../components/Card";
import { DEFAULT_GLUCOSE_RANGE_LIMITS } from "../utils/diabetes";

export function ProfilePage({
  ageGroup,
  profile,
  setProfile,
  sharing,
  setSharing,
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
                  Let a parent or caregiver see selected information.
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
              <div className="fieldLabel" style={{ marginTop: 4 }}>
                What to share
              </div>
              {[
                ["glucose", "Blood glucose readings"],
                ["trends", "Trend graphs"],
                ["reminders", "Reminder activity"],
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
                        })
                      }
                    >
                      <span className="toggleKnob" />
                    </button>
                  </div>
                </Card>
              ))}

              <div className="fieldLabel" style={{ marginTop: 10 }}>
                Caregiver's view (example)
              </div>
              <Card>
                <div className="cardEyebrow">
                  Shared by {profile.name || "you"}
                </div>
                {sharing.perms.glucose && (
                  <div className="mutedSmall" style={{ marginTop: 6 }}>
                    Last reading: 142 mg/dL · in range · 1:00pm
                  </div>
                )}
                {sharing.perms.trends && (
                  <div className="mutedSmall" style={{ marginTop: 6 }}>
                    This week: mostly in range, one high on Saturday
                  </div>
                )}
                {sharing.perms.reminders && (
                  <div className="mutedSmall" style={{ marginTop: 6 }}>
                    Insulin reminder completed at 8:02am
                  </div>
                )}
                {!sharing.perms.glucose &&
                  !sharing.perms.trends &&
                  !sharing.perms.reminders && (
                    <div className="mutedSmall" style={{ marginTop: 6 }}>
                      Nothing selected to share yet.
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
