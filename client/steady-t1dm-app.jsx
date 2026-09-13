import React, { useEffect, useState } from "react";
import "./styles/app.css";

import { TopBar } from "./components/TopBar";
import { NavBar } from "./components/NavBar";
import { WelcomePage } from "./pages/WelcomePage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GlucoseRecordingPage } from "./pages/GlucoseRecordingPage";
import { GlucoseHistoryPage } from "./pages/GlucoseHistoryPage";
import { TrendsPage } from "./pages/TrendsPage";
import { RemindersPage } from "./pages/RemindersPage";
import { EducationPage } from "./pages/EducationPage";
import { EmergencyPage } from "./pages/EmergencyPage";
import { ProfilePage } from "./pages/ProfilePage";
import { buildReadingEntry } from "./utils/diabetes.js";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

const defaultReadings = [
  {
    id: "seed-1",
    v: 5.4,
    time: "Today, 7:02am",
    context: "Before meal",
    date: new Date().toISOString(),
  },
  {
    id: "seed-2",
    v: 8.9,
    time: "Today, 10:15am",
    context: "After meal",
    date: new Date().toISOString(),
  },
];

const morning = new Date();
morning.setHours(7, 0, 0, 0);
const lunch = new Date();
lunch.setHours(12, 30, 0, 0);
const appt = new Date();
appt.setDate(appt.getDate() + 10);
appt.setHours(15, 0, 0, 0);

const defaultReminders = [
  {
    id: 1,
    title: "Morning glucose check",
    kind: "Glucose check",
    when: morning.toISOString(),
    repeat: "Daily",
    on: true,
  },
  {
    id: 2,
    title: "Lunchtime insulin",
    kind: "Insulin",
    when: lunch.toISOString(),
    repeat: "Daily",
    on: true,
  },
  {
    id: 3,
    title: "Endocrinologist appointment",
    kind: "Appointment",
    when: appt.toISOString(),
    repeat: "Never",
    on: false,
  },
];

const defaultProfile = {
  name: "",
  status: "Type 1 diabetes",
  contactName: "",
  contactNumber: "",
};

const defaultSharing = {
  on: false,
  perms: { glucose: true, trends: false, reminders: false },
};

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [token, setToken] = useState(
    localStorage.getItem("steady-token") || "",
  );
  const [ageGroup, setAgeGroup] = useState("teen");
  const [name, setName] = useState("");
  const [online, setOnline] = useState(true);
  const [readings, setReadings] = useState(defaultReadings);
  const [editingReading, setEditingReading] = useState(null);
  const [reminders, setReminders] = useState(defaultReminders);
  const [profile, setProfile] = useState(defaultProfile);
  const [sharing, setSharing] = useState(defaultSharing);

  useEffect(() => {
    if (!token) return;

    async function loadProfile() {
      try {
        const response = await fetch(`${API_BASE}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem("steady-token");
          setToken("");
          setScreen("welcome");
          return;
        }

        const payload = await response.json();
        hydrateFromUser(payload.user);
        setScreen("dashboard");
      } catch (error) {
        console.error("Failed to load user profile.", error);
      }
    }

    loadProfile();
  }, [token]);

  function hydrateFromUser(user) {
    setName(user.name || "");
    setAgeGroup(user.ageGroup || "teen");
    setReadings(user.readings?.length ? user.readings : defaultReadings);
    setReminders(user.reminders?.length ? user.reminders : defaultReminders);
    setProfile(user.profile || defaultProfile);
    setSharing(user.sharing || defaultSharing);
  }

  async function persistUserState(nextOverrides = {}) {
    if (!token) return;

    const payload = {
      name,
      ageGroup,
      readings,
      reminders,
      profile,
      sharing,
      ...nextOverrides,
    };

    try {
      await fetch(`${API_BASE}/user/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Profile sync failed.", error);
    }
  }

  function handleAuthSuccess(user, authToken) {
    localStorage.setItem("steady-token", authToken);
    setToken(authToken);
    hydrateFromUser(user);
    setScreen("dashboard");
  }

  function resetUserState() {
    setName("");
    setAgeGroup("teen");
    setReadings(defaultReadings);
    setReminders(defaultReminders);
    setProfile(defaultProfile);
    setSharing(defaultSharing);
    setOnline(true);
  }

  function handleLogout() {
    localStorage.removeItem("steady-token");
    setToken("");
    resetUserState();
    setScreen("welcome");
  }

  function addReading(
    v,
    context = "Random",
    explicitDate = null,
    explicitTime = null,
  ) {
    const nextReading = buildReadingEntry(
      v,
      context,
      new Date(),
      explicitDate,
      explicitTime,
    );
    const nextReadings = [...readings, nextReading];
    setReadings(nextReadings);
    persistUserState({ readings: nextReadings });
  }

  function updateReading(
    id,
    nextValue,
    nextContext,
    explicitDate = null,
    explicitTime = null,
  ) {
    const nextReadings = readings.map((reading) => {
      if (reading.id !== id) return reading;
      const nextDate = new Date(reading.date || Date.now());
      const updated = buildReadingEntry(
        nextValue,
        nextContext,
        nextDate,
        explicitDate || nextDate.toISOString().slice(0, 10),
        explicitTime || nextDate.toTimeString().slice(0, 5),
      );
      return {
        ...reading,
        ...updated,
        id: reading.id,
      };
    });
    setReadings(nextReadings);
    persistUserState({ readings: nextReadings });
  }

  function deleteReading(id) {
    const nextReadings = readings.filter((reading) => reading.id !== id);
    setReadings(nextReadings);
    persistUserState({ readings: nextReadings });
  }

  function startEditReading(reading) {
    setEditingReading(reading);
    setScreen("glucose");
  }

  function clearEditingReading() {
    setEditingReading(null);
  }

  const showTopBar = !["welcome", "auth"].includes(screen);
  const showNav = [
    "dashboard",
    "trends",
    "reminders",
    "education",
    "emergency",
  ].includes(screen);

  const titles = {
    dashboard: "Steady",
    glucose: "Log glucose",
    glucoseHistory: "Saved readings",
    trends: "Trends",
    reminders: "Reminders",
    education: "Education Centre",
    emergency: "Emergency",
    profile: "Your details",
  };

  return (
    <div className="appOuter">
      <div className="phone">
        {showTopBar && (
          <TopBar
            title={titles[screen]}
            onBack={null}
            online={online}
            onToggleOnline={() => setOnline((o) => !o)}
          />
        )}

        <div className="phoneBody">
          {screen === "welcome" && (
            <WelcomePage onNext={() => setScreen("auth")} />
          )}

          {screen === "auth" && (
            <AuthPage
              onAuthSuccess={(user, authToken) => {
                handleAuthSuccess(user, authToken);
              }}
            />
          )}

          {screen === "dashboard" && (
            <DashboardPage
              ageGroup={ageGroup}
              name={name}
              readings={readings}
              reminders={reminders}
              setScreen={setScreen}
            />
          )}

          {screen === "glucose" && (
            <GlucoseRecordingPage
              ageGroup={ageGroup}
              online={online}
              readings={readings}
              editingReading={editingReading}
              onSave={addReading}
              onUpdate={updateReading}
              onDelete={deleteReading}
              onOpenHistory={() => setScreen("glucoseHistory")}
              onCancelEdit={() => {
                clearEditingReading();
              }}
              onBack={() => {
                clearEditingReading();
                setScreen("dashboard");
              }}
            />
          )}

          {screen === "glucoseHistory" && (
            <GlucoseHistoryPage
              readings={readings}
              onEdit={(reading) => startEditReading(reading)}
              onDelete={deleteReading}
              onNew={() => {
                clearEditingReading();
                setScreen("glucose");
              }}
              onBack={() => setScreen("glucose")}
            />
          )}

          {screen === "trends" && (
            <TrendsPage
              readings={readings}
              onBack={() => setScreen("dashboard")}
            />
          )}

          {screen === "reminders" && (
            <RemindersPage
              reminders={reminders}
              setReminders={(next) => {
                setReminders(next);
                persistUserState({ reminders: next });
              }}
              onBack={() => setScreen("dashboard")}
            />
          )}

          {screen === "education" && (
            <EducationPage
              ageGroup={ageGroup}
              onBack={() => setScreen("dashboard")}
            />
          )}

          {screen === "emergency" && (
            <EmergencyPage
              profile={profile}
              onBack={() => setScreen("dashboard")}
            />
          )}

          {screen === "profile" && (
            <ProfilePage
              ageGroup={ageGroup}
              profile={profile}
              setProfile={(nextProfile) => {
                setProfile(nextProfile);
                persistUserState({ profile: nextProfile });
              }}
              sharing={sharing}
              setSharing={(nextSharing) => {
                setSharing(nextSharing);
                persistUserState({ sharing: nextSharing });
              }}
              onBack={() => setScreen("dashboard")}
              onLogout={handleLogout}
            />
          )}
        </div>

        {showNav && <NavBar screen={screen} setScreen={setScreen} />}
      </div>
    </div>
  );
}
