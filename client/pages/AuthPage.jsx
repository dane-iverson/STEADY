import React, { useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

export function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
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
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
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
              email: form.email,
              password: form.password,
              ageGroup: form.ageGroup,
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
              Age group
            </label>
            <div className="chipRow">
              {["child", "teen", "young_adult"].map((group) => (
                <button
                  key={group}
                  type="button"
                  className={
                    "chip" + (form.ageGroup === group ? " chipActive" : "")
                  }
                  onClick={() => updateField("ageGroup", group)}
                >
                  {group === "child"
                    ? "5–12"
                    : group === "teen"
                      ? "13–18"
                      : "19–25"}
                </button>
              ))}
            </div>
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
    </div>
  );
}
