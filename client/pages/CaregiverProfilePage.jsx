import React, { useState } from "react";
import { AlertCircle, Check, CheckCircle2 } from "lucide-react";
import { BackButton } from "../components/BackButton";
import { Card } from "../components/Card";
import "../styles/caregiver.css";

export function CaregiverProfilePage({ name, profile, onSave, onBack }) {
  const [firstName, setFirstName] = useState(profile.name || name || "");
  const [surname, setSurname] = useState(profile.surname || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setMessage("");
    setError("");
    const trimmedName = firstName.trim();
    const trimmedSurname = surname.trim();
    if (!trimmedName || trimmedName.length > 100 || trimmedSurname.length > 500) {
      setError(
        "Enter a first name of up to 100 characters and a surname of up to 500 characters.",
      );
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: trimmedName, surname: trimmedSurname });
      setFirstName(trimmedName);
      setSurname(trimmedSurname);
      setMessage("Your profile changes have been saved.");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  return (
    <div className="screen caregiverInboxScreen caregiverProfileScreen">
      <BackButton onClick={onBack} destination="inbox" disabled={saving} />
      <header className="caregiverHeader">
        <div>
          <span className="sectionKicker">Steady / Caregiver</span>
          <h2 className="screenTitle">My profile</h2>
          <p className="screenSub">
            Update your own caregiver details. This does not change any patient's
            information.
          </p>
        </div>
      </header>
      <Card className="caregiverProfileCard">
        <form onSubmit={save} aria-busy={saving}>
          <fieldset className="caregiverProfileFields" disabled={saving}>
            <legend>Personal information</legend>
            <div className="caregiverProfileGrid">
              <div>
                <label className="fieldLabel" htmlFor="caregiver-first-name">
                  First name (required)
                </label>
                <input
                  id="caregiver-first-name"
                  className="textInput"
                  autoComplete="given-name"
                  maxLength={100}
                  required
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    clearFeedback();
                  }}
                />
              </div>
              <div>
                <label className="fieldLabel" htmlFor="caregiver-surname">
                  Surname
                </label>
                <input
                  id="caregiver-surname"
                  className="textInput"
                  autoComplete="family-name"
                  maxLength={500}
                  value={surname}
                  onChange={(event) => {
                    setSurname(event.target.value);
                    clearFeedback();
                  }}
                />
              </div>
            </div>
            <div className="profileEditActions">
              <button className="btnGhost" type="button" onClick={onBack}>
                Cancel
              </button>
              <button className="btnPrimary" type="submit">
                <Check size={16} aria-hidden="true" />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </fieldset>
          {error && (
            <p
              className="caregiverProfileFeedback caregiverProfileError"
              role="alert"
            >
              <AlertCircle size={18} aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
          {message && (
            <p
              className="caregiverProfileFeedback caregiverProfileSuccess"
              role="status"
            >
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{message}</span>
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
