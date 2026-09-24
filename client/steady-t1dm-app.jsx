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
import { InsulinCalculatorPage } from "./pages/InsulinCalculatorPage";
import { CaregiverInboxPage } from "./pages/CaregiverInboxPage";
import {
  ageGroupFromDateOfBirth,
  buildReadingEntry,
} from "./utils/diabetes.js";
import { DEFAULT_INSULIN_SETTINGS } from "./utils/insulin.js";

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

export const defaultProfile = {
  name: "",
  surname: "",
  height: "",
  weight: "",
  gender: "",
  otherMedication: "",
  allergies: "",
  dateOfBirth: "",
  status: "Type 1 diabetes",
  contactName: "",
  contactNumber: "",
  hba1c: "",
  hba1cDate: "",
  glucoseRanges: {
    veryLowMax: 3,
    lowMax: 4,
    targetMax: 7.8,
    highMax: 14,
  },
};

const defaultSharing = {
  on: false,
  perms: { glucose: true, trends: false, reminders: false, hba1c: false },
  caregivers: [],
  sharedItems: [],
};

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [token, setToken] = useState(
    sessionStorage.getItem("steady-token") || "",
  );
  const [ageGroup, setAgeGroup] = useState("teen");
  const [name, setName] = useState("");
  const [online, setOnline] = useState(true);
  const [readings, setReadings] = useState(defaultReadings);
  const [editingReading, setEditingReading] = useState(null);
  const [reminders, setReminders] = useState(defaultReminders);
  const [profile, setProfile] = useState(defaultProfile);
  const [sharing, setSharing] = useState(defaultSharing);
  const [insulinSettings, setInsulinSettings] = useState(
    DEFAULT_INSULIN_SETTINGS,
  );
  const [accountType, setAccountType] = useState("patient");
  const [sharedItems, setSharedItems] = useState([]);

  useEffect(() => {
    localStorage.removeItem("steady-token");
  }, []);

  useEffect(() => {
    if (!token) return;

    async function loadProfile() {
      try {
        const response = await fetch(`${API_BASE}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          sessionStorage.removeItem("steady-token");
          setToken("");
          setScreen("welcome");
          return;
        }

        const payload = await response.json();
        hydrateFromUser(payload.user);
        setScreen(
          payload.user?.accountType === "caregiver"
            ? "caregiverInbox"
            : "dashboard",
        );
      } catch (error) {
        console.error("Failed to load user profile.", error);
      }
    }

    loadProfile();
  }, [token]);

  useEffect(() => {
    if (accountType === "caregiver" && screen !== "caregiverInbox") {
      setScreen("caregiverInbox");
    }
  }, [accountType, screen]);

  function hydrateFromUser(user) {
    setName(user.name || "");
    setAgeGroup(user.ageGroup || "teen");
    setReadings(user.readings?.length ? user.readings : defaultReadings);
    setReminders(user.reminders?.length ? user.reminders : defaultReminders);
    setProfile(user.profile || defaultProfile);
    setSharing(user.sharing || defaultSharing);
    setInsulinSettings({
      ...DEFAULT_INSULIN_SETTINGS,
      ...(user.insulinSettings || {}),
    });
    setAccountType(user.accountType || "patient");
    setSharedItems(user.sharedItems || []);
  }

  async function persistUserState(nextOverrides = {}) {
    if (!token) return;

    const payload = {
      ageGroup,
      readings,
      reminders,
      profile,
      sharing,
      insulinSettings,
      sharedItems,
      ...nextOverrides,
      name: nextOverrides.name ?? nextOverrides.profile?.name ?? name,
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

  async function refreshUserState() {
    if (!token) return;
    const response = await fetch(`${API_BASE}/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Could not refresh the inbox.");
    const payload = await response.json();
    hydrateFromUser(payload.user);
  }

  async function sendSharedItemToCaregiver(item, caregiverEmail) {
    if (!token) throw new Error("You need to be signed in to share updates.");
    const response = await fetch(`${API_BASE}/user/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ caregiverEmail, item }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Could not share the update.");
    }
    return payload.item;
  }

  async function connectCaregiver(caregiverEmail) {
    if (!token) throw new Error("You need to be signed in to add a caregiver.");
    const response = await fetch(`${API_BASE}/user/caregivers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ caregiverEmail }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Could not add caregiver.");
    }
    return payload.caregiver;
  }

  function handleAuthSuccess(user, authToken) {
    sessionStorage.setItem("steady-token", authToken);
    setToken(authToken);
    hydrateFromUser(user);
    setScreen(
      user?.accountType === "caregiver" ? "caregiverInbox" : "dashboard",
    );
  }

  function resetUserState() {
    setName("");
    setAgeGroup("teen");
    setReadings(defaultReadings);
    setReminders(defaultReminders);
    setProfile(defaultProfile);
    setSharing(defaultSharing);
    setInsulinSettings(DEFAULT_INSULIN_SETTINGS);
    setAccountType("patient");
    setSharedItems([]);
    setOnline(true);
  }

  function handleLogout() {
    sessionStorage.removeItem("steady-token");
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

  const isCaregiver = accountType === "caregiver";
  const routedScreen = isCaregiver ? "caregiverInbox" : screen;
  const showTopBar =
    !["welcome", "auth", "caregiverInbox"].includes(routedScreen) &&
    !isCaregiver;
  const showNav =
    [
      "dashboard",
      "trends",
      "reminders",
      "education",
      "emergency",
      "insulinCalculator",
    ].includes(routedScreen) && !isCaregiver;

  const titles = {
    dashboard: "Steady",
    glucose: "Log glucose",
    glucoseHistory: "Saved readings",
    trends: "Trends",
    reminders: "Reminders",
    education: "Education Centre",
    emergency: "Emergency",
    insulinCalculator: "Insulin calculator",
    profile: "Your details",
    caregiverInbox: "Shared with me",
  };

  return (
    <div className={`appOuter theme-${ageGroup}`}>
      <div className="phone">
        {showTopBar && (
          <TopBar
            title={titles[routedScreen]}
            onBack={null}
            onHome={() => setScreen("dashboard")}
            online={online}
            onToggleOnline={() => setOnline((o) => !o)}
            onProfile={() => setScreen("profile")}
          />
        )}

        <div className="phoneBody">
          {routedScreen === "welcome" && (
            <WelcomePage onNext={() => setScreen("auth")} />
          )}

          {routedScreen === "auth" && (
            <AuthPage
              onAuthSuccess={(user, authToken) => {
                handleAuthSuccess(user, authToken);
              }}
            />
          )}

          {routedScreen === "caregiverInbox" && (
            <CaregiverInboxPage
              name={name}
              email="Caregiver account"
              sharedItems={sharedItems}
              onRefresh={refreshUserState}
              onLogout={handleLogout}
            />
          )}

          {routedScreen === "dashboard" && (
            <DashboardPage
              ageGroup={ageGroup}
              profile={profile}
              name={name}
              readings={readings}
              reminders={reminders}
              setScreen={setScreen}
            />
          )}

          {routedScreen === "glucose" && (
            <GlucoseRecordingPage
              ageGroup={ageGroup}
              profile={profile}
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
                setScreen(
                  user.accountType === "caregiver"
                    ? "caregiverInbox"
                    : "dashboard",
                );
              }}
            />
          )}

          {routedScreen === "glucoseHistory" && (
            <GlucoseHistoryPage
              readings={readings}
              profile={profile}
              reminders={reminders}
              onEdit={(reading) => startEditReading(reading)}
              onDelete={deleteReading}
              onNew={() => {
                clearEditingReading();
                setScreen("glucose");
              }}
              onBack={() => setScreen("glucose")}
            />
          )}

          {routedScreen === "trends" && (
            <TrendsPage
              readings={readings}
              profile={profile}
              onBack={() => setScreen("dashboard")}
            />
          )}

          {routedScreen === "reminders" && (
            <RemindersPage
              reminders={reminders}
              setReminders={(next) => {
                setReminders(next);
                persistUserState({ reminders: next });
              }}
              onBack={() => setScreen("dashboard")}
            />
          )}

          {routedScreen === "education" && (
            <EducationPage
              ageGroup={ageGroup}
              onBack={() => setScreen("dashboard")}
            />
          )}

          {routedScreen === "emergency" && (
            <EmergencyPage
              profile={profile}
              onBack={() => setScreen("dashboard")}
            />
          )}

          {routedScreen === "insulinCalculator" && (
            <InsulinCalculatorPage
              ageGroup={ageGroup}
              settings={insulinSettings}
              setSettings={(nextSettings) => {
                setInsulinSettings(nextSettings);
                persistUserState({ insulinSettings: nextSettings });
              }}
              onBack={() => setScreen("dashboard")}
              onEmergency={() => setScreen("emergency")}
            />
          )}

          {routedScreen === "profile" && (
            <ProfilePage
              ageGroup={ageGroup}
              profile={profile}
              readings={readings}
              reminders={reminders}
              setProfile={(nextProfile) => {
                setProfile(nextProfile);
                setName(nextProfile.name || "");
                const nextAgeGroup = ageGroupFromDateOfBirth(
                  nextProfile.dateOfBirth,
                );
                if (nextAgeGroup) setAgeGroup(nextAgeGroup);
                persistUserState({
                  profile: nextProfile,
                  ...(nextAgeGroup ? { ageGroup: nextAgeGroup } : {}),
                });
              }}
              sharing={sharing}
              setSharing={(nextSharing) => {
                setSharing(nextSharing);
                persistUserState({ sharing: nextSharing });
              }}
              onSendSharedItem={sendSharedItemToCaregiver}
              onConnectCaregiver={connectCaregiver}
              onBack={() => setScreen("dashboard")}
              onLogout={handleLogout}
            />
          )}
        </div>

        {showNav && <NavBar screen={routedScreen} setScreen={setScreen} />}
      </div>
    </div>
  );
}
