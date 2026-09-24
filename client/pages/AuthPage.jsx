import React, { useState } from "react";
import { ageGroupFromDateOfBirth } from "../utils/diabetes";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

export function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    surname: "",
    height: "",
    weight: "",
    gender: "",
    otherMedication: "",
    allergies: "",
    dateOfBirth: "",
    email: "",
    password: "",
    confirmPassword: "",
    ageGroup: "teen",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!form.name.trim()) {
        setError("Please add your name.");
        return;
      }
      if (!form.dateOfBirth || !ageGroupFromDateOfBirth(form.dateOfBirth)) {
        setError("Please add a valid date of birth.");
        return;
      }
      if (!form.gender) {
        setError("Please select male or female.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!termsAccepted) {
        setError(
          "Please agree to the Terms and Conditions to create an account.",
        );
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : {
              name: form.name,
              ageGroup: ageGroupFromDateOfBirth(form.dateOfBirth),
              email: form.email,
              password: form.password,
              profile: {
                name: form.name,
                surname: form.surname,
                height: form.height,
                weight: form.weight,
                gender: form.gender,
                otherMedication: form.otherMedication,
                allergies: form.allergies,
                dateOfBirth: form.dateOfBirth,
              },
            };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      localStorage.setItem("steady-token", data.token);
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <div className="brandMark">
        <span style={{ fontSize: 28 }}>●</span>
      </div>
      <h2 className="screenTitle">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h2>
      <p className="screenSub">
        {mode === "login"
          ? "Log in to view your data and continue managing your care."
          : "Set up your profile so your readings and reminders stay saved."}
      </p>

      <div className="chipRow" style={{ marginBottom: 18 }}>
        <button
          className={"chip" + (mode === "login" ? " chipActive" : "")}
          onClick={() => setMode("login")}
          type="button"
        >
          Login
        </button>
        <button
          className={"chip" + (mode === "signup" ? " chipActive" : "")}
          onClick={() => setMode("signup")}
          type="button"
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <label className="fieldLabel">Your name</label>
            <input
              className="textInput"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Alex"
            />

            <label className="fieldLabel" style={{ marginTop: 12 }}>
              Surname
            </label>
            <input
              className="textInput"
              value={form.surname}
              onChange={(e) => updateField("surname", e.target.value)}
            />

            <label className="fieldLabel" style={{ marginTop: 12 }}>
              Date of birth
            </label>
            <input
              className="textInput"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => updateField("dateOfBirth", e.target.value)}
            />

            <div className="formGrid" style={{ marginTop: 12 }}>
              <div>
                <label className="fieldLabel">Height</label>
                <input
                  className="textInput"
                  value={form.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  placeholder="e.g. 170 cm"
                />
              </div>
              <div>
                <label className="fieldLabel">Weight</label>
                <input
                  className="textInput"
                  value={form.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  placeholder="e.g. 65 kg"
                />
              </div>
            </div>

            <label className="fieldLabel" style={{ marginTop: 12 }}>
              Gender
            </label>
            <select
              className="textInput"
              value={form.gender}
              onChange={(e) => updateField("gender", e.target.value)}
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
              value={form.otherMedication}
              onChange={(e) => updateField("otherMedication", e.target.value)}
            />

            <label className="fieldLabel" style={{ marginTop: 12 }}>
              Allergies
            </label>
            <input
              className="textInput"
              value={form.allergies}
              onChange={(e) => updateField("allergies", e.target.value)}
            />
          </>
        )}

        <label
          className="fieldLabel"
          style={{ marginTop: mode === "signup" ? 12 : 0 }}
        >
          Email
        </label>
        <input
          className="textInput"
          value={form.email}
          type="email"
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="you@example.com"
        />

        <label className="fieldLabel" style={{ marginTop: 12 }}>
          Password
        </label>
        <input
          className="textInput"
          type="password"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          placeholder={
            mode === "login" ? "Your password" : "At least 6 characters"
          }
        />

        {mode === "signup" && (
          <>
            <label className="fieldLabel" style={{ marginTop: 12 }}>
              Confirm password
            </label>
            <input
              className="textInput"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              placeholder="Repeat your password"
            />
          </>
        )}

        {mode === "signup" && (
          <label className="termsAgreement" htmlFor="terms-agreement">
            <input
              id="terms-agreement"
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => {
                setTermsAccepted(event.target.checked);
                if (error) setError("");
              }}
            />
            <span>
              I agree to the{" "}
              <button
                type="button"
                className="termsLink"
                onClick={(event) => {
                  event.preventDefault();
                  setTermsOpen(true);
                }}
              >
                Terms and Conditions
              </button>
            </span>
          </label>
        )}

        {error && (
          <div className="toast" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <button
          className="btnPrimary"
          style={{ marginTop: 16 }}
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      {termsOpen && (
        <div
          className="modalBackdrop"
          role="presentation"
          onClick={() => setTermsOpen(false)}
        >
          <section
            className="modalPanel termsModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="exportPanelHeader">
              <div>
                <div className="sectionKicker">PROTOTYPE NOTICE</div>
                <h3 id="terms-title">Terms and Conditions</h3>
              </div>
              <button
                className="iconBtn"
                type="button"
                aria-label="Close Terms and Conditions"
                onClick={() => setTermsOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="termsText">
              This application is a research prototype developed for the purpose
              of evaluating the usability and functionality of a technology
              solution designed to support Type 1 Diabetes management. The
              features, information and functionality presented within this
              prototype are intended for research and demonstration purposes
              only and should not be considered a substitute for professional
              medical advice, diagnosis or treatment.
            </p>
            <p className="termsText">
              This prototype is not intended for use in the clinical management
              of diabetes or for making medical decisions. For the purpose of
              this research prototype, a simplified version of the Terms and
              Conditions is provided.
            </p>
            <p className="termsText">
              A comprehensive set of Terms and Conditions, including detailed
              information regarding use of the application, privacy, data
              protection, user responsibilities, medical disclaimers and other
              applicable legal requirements, would be developed and made
              available should the technology solution be developed into a full
              application for public use.
            </p>
            <button
              className="btnPrimary termsCloseButton"
              type="button"
              onClick={() => setTermsOpen(false)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
