import React, { useState } from "react";
import { Lock, Share2, User, Users } from "lucide-react";
import { AGE_GROUPS } from "../data/appData";
import { Card } from "../components/Card";

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
          <label className="fieldLabel">Name</label>
          <input
            className="textInput"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />

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
