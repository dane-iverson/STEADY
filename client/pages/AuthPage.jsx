import React, { useState } from "react";
import { ageGroupFromDateOfBirth } from "../utils/diabetes";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

const TERMS_SECTIONS = [
  [
    "1. Research prototype",
    "Steady is a research prototype built to evaluate how usable and useful a Type 1 diabetes support tool is. It is provided for testing and demonstration only, is not a registered medical device, and may contain errors, change without notice, or become unavailable at any time.",
  ],
  [
    "2. Not medical advice",
    "Nothing in Steady is medical advice, diagnosis or treatment. Do not use it to make decisions about your insulin, food, medication or care. Always follow the plan agreed with your doctor or diabetes care team. The insulin calculator is an educational demonstration: its results must not be used to decide a real dose, and any settings you enter should be confirmed by your healthcare professional.",
  ],
  [
    "3. Emergencies",
    "Steady cannot monitor you, raise alarms or call for help, and reminders may not appear if your device is off, offline or has notifications disabled. If you or someone you care for is unwell, has a very low or very high glucose reading, or you are unsure what to do, contact your healthcare provider or local emergency services immediately.",
  ],
  [
    "4. Who may use Steady",
    "If you are under 18, a parent or legal guardian must read and agree to these terms on your behalf and should supervise your use of the app. By creating an account you confirm that you are 18 or older, or that you have your parent or guardian's permission.",
  ],
  [
    "5. Information we collect",
    "If you create an account we store the details you enter: your name, email address, date of birth, gender, height, weight, allergies, other medication, emergency contact, glucose readings, HbA1c, reminders, calculator settings and any items you share with a caregiver. Your password is stored only in a hashed (scrambled) form. This is health information, which is sensitive personal information, and you give it voluntarily.",
  ],
  [
    "6. How your information is used",
    "Your information is used only to run the app for you and to evaluate and improve this prototype. It is not sold and is not used for advertising. Information you enter in the Try the prototype mode is sample data held only in your browser and is discarded when you exit or refresh.",
  ],
  [
    "7. Analytics",
    "With your consent, Steady uses Google Analytics to count which screens are opened. This does not include your health information, name or email address. You can decline and the app works the same. Google may process this usage data on servers outside your country.",
  ],
  [
    "8. Sharing with caregivers",
    "You choose whether to connect a caregiver and exactly which information to share. Anything you send is visible to that caregiver's account and cannot be recalled once they have seen it. Only share with people you trust, and remove a caregiver at any time in your profile.",
  ],
  [
    "9. Storage and security",
    "We take reasonable steps to protect your information, including encrypted connections and hashed passwords, but no system is completely secure and we cannot guarantee against unauthorised access. Keep your password private, log out on shared devices, and do not enter information you are not comfortable storing in a prototype.",
  ],
  [
    "10. Your rights",
    "You may ask to see, correct or delete your information, or to close your account, by contacting the research team who gave you this link. Information will be handled in line with applicable data protection law, including South Africa's Protection of Personal Information Act (POPIA).",
  ],
  [
    "11. Your responsibilities",
    "Enter information accurately, check readings against your meter, keep your login details secure, and do not misuse or attempt to disrupt the app or access other users' information.",
  ],
  [
    "12. Liability",
    "To the fullest extent permitted by law, Steady is provided as is, without warranties of accuracy, availability or fitness for a particular purpose, and the research team accepts no liability for loss, injury or harm arising from use of, or reliance on, this prototype. Nothing here limits any rights you have under law that cannot be excluded.",
  ],
  [
    "13. Changes",
    "These terms may be updated as the prototype develops. Continued use after a change means you accept the updated terms. A full set of terms and a privacy policy would be published before any public release.",
  ],
];

export function AuthPage({ onAuthSuccess, onPrototype }) {
  const [mode, setMode] = useState("login");
  const [accountType, setAccountType] = useState("patient");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [prototypeOpen, setPrototypeOpen] = useState(false);
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

    if (mode === "signup" && accountType === "patient") {
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
    } else if (mode === "signup" && !form.name.trim()) {
      setError("Please add your name.");
      return;
    } else if (mode === "signup" && !form.surname.trim()) {
      setError("Please add your surname.");
      return;
    }
    if (mode === "signup" && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "signup") {
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
              accountType,
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

      sessionStorage.setItem("steady-token", data.token);
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

      {mode === "signup" && (
        <div className="accountTypeChoice">
          <div className="fieldLabel">Account type</div>
          <div className="chipRow">
            <button
              type="button"
              className={
                "chip" + (accountType === "patient" ? " chipActive" : "")
              }
              onClick={() => setAccountType("patient")}
            >
              Patient
            </button>
            <button
              type="button"
              className={
                "chip" + (accountType === "caregiver" ? " chipActive" : "")
              }
              onClick={() => setAccountType("caregiver")}
            >
              Caregiver
            </button>
          </div>
          <div className="dateFieldHint">
            {accountType === "caregiver"
              ? "Create an account to receive shared updates inside Steady."
              : "Create an account to manage your own diabetes information."}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {mode === "signup" && accountType === "patient" && (
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

        {mode === "signup" && accountType === "caregiver" && (
          <>
            <label className="fieldLabel">First name</label>
            <input
              className="textInput"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Alex"
              required
            />
            <label className="fieldLabel" style={{ marginTop: 12 }}>
              Surname
            </label>
            <input
              className="textInput"
              value={form.surname}
              onChange={(e) => updateField("surname", e.target.value)}
              placeholder="e.g. Smith"
              required
            />
          </>
        )}

        <label
          className="fieldLabel"
          htmlFor="auth-email"
          style={{ marginTop: mode === "signup" ? 12 : 0 }}
        >
          Email
        </label>
        <input
          id="auth-email"
          autoComplete="email"
          className="textInput"
          value={form.email}
          type="email"
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="you@example.com"
        />

        <label
          className="fieldLabel"
          htmlFor="auth-password"
          style={{ marginTop: 12 }}
        >
          Password
        </label>
        <input
          id="auth-password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
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
            <label
              className="fieldLabel"
              htmlFor="auth-confirm"
              style={{ marginTop: 12 }}
            >
              Confirm password
            </label>
            <input
              id="auth-confirm"
              autoComplete="new-password"
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
              </button>{" "}
              (if I am under 18, my parent or guardian has agreed too)
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

      {onPrototype && (
        <div className="prototypeEntry">
          <span>or</span>
          <button
            className="btnGhost"
            type="button"
            onClick={() => setPrototypeOpen(true)}
          >
            Try the prototype (sample data, no account)
          </button>
        </div>
      )}

      {prototypeOpen && (
        <div
          className="modalBackdrop"
          role="presentation"
          onClick={() => setPrototypeOpen(false)}
        >
          <section
            className="modalPanel prototypePicker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prototype-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="exportPanelHeader">
              <div>
                <div className="sectionKicker">PROTOTYPE</div>
                <h3 id="prototype-title">Who are you testing as?</h3>
              </div>
              <button
                className="iconBtn"
                type="button"
                aria-label="Close"
                onClick={() => setPrototypeOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="mutedSmall">
              Sample data only. Nothing is saved, and it resets when you exit.
            </p>
            <div className="prototypeEntryOptions">
              {[
                ["child", "Child", "Under 13"],
                ["teen", "Teen", "13 to 18"],
                ["young_adult", "Adult", "19 and over"],
              ].map(([group, label, hint]) => (
                <button
                  key={group}
                  className="btnGhost"
                  type="button"
                  onClick={() => onPrototype(group)}
                >
                  <strong>{label}</strong>
                  <span>{hint}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

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
            {TERMS_SECTIONS.map(([heading, body]) => (
              <div key={heading}>
                <h4 className="termsHeading">{heading}</h4>
                <p className="termsText">{body}</p>
              </div>
            ))}
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
