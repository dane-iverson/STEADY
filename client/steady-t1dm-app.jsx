import React, { useEffect, useRef, useState } from "react";
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
import { CaregiverProfilePage } from "./pages/CaregiverProfilePage";
import { GuidedTour } from "./components/GuidedTour";
import {
  ageGroupFromDateOfBirth,
  buildReadingEntry,
} from "./utils/diabetes.js";
import { DEFAULT_INSULIN_SETTINGS } from "./utils/insulin.js";
import { buildPrototypeData } from "./data/prototypeData.js";
import { createSessionGeneration } from "./utils/sessionGeneration.js";
import {
  enterAuthenticatedSession,
  enterPrototypeSession,
  hasActiveAuthSession,
  resolveStoredSession,
} from "./utils/sessionMode.js";
import {
  analyticsConfigured,
  getAnalyticsConsent,
  initAnalytics,
  setAnalyticsConsent,
  trackScreen,
} from "./utils/analytics.js";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

const defaultReadings = [];

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

const VALID_SCREENS = new Set([
  "welcome",
  "auth",
  "dashboard",
  "glucose",
  "glucoseHistory",
  "trends",
  "reminders",
  "education",
  "emergency",
  "profile",
  "insulinCalculator",
  "caregiverInbox",
  "caregiverProfile",
]);

const CAREGIVER_SCREENS = new Set(["caregiverInbox", "caregiverProfile"]);

function screenFromLocation() {
  const requestedScreen = window.location.hash.slice(2);
  return VALID_SCREENS.has(requestedScreen) ? requestedScreen : "welcome";
}

export default function App() {
  const sessionGeneration = useRef(createSessionGeneration()).current;
  const revisionRef = useRef(0);
  const saveQueueRef = useRef(Promise.resolve());
  const [initialSession] = useState(() => resolveStoredSession(sessionStorage));
  const [token, setToken] = useState(initialSession.token);
  const [isPrototype, setIsPrototype] = useState(initialSession.isPrototype);
  const [screen, setScreenState] = useState(() => {
    return initialSession.token || initialSession.isPrototype
      ? screenFromLocation()
      : "welcome";
  });
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
  const [connectionRequests, setConnectionRequests] = useState({
    received: [],
    sent: [],
    connected: [],
  });
  const [onboardingComplete, setOnboardingComplete] = useState(
    () =>
      sessionStorage.getItem("steady-prototype") === "true" &&
      sessionStorage.getItem("steady-prototype-tour-complete") === "true",
  );
  const [tourStage, setTourStage] = useState(null);
  const [logoutPromptOpen, setLogoutPromptOpen] = useState(false);
  const [saveConflict, setSaveConflict] = useState(false);
  const [analyticsConsent, setAnalyticsConsentState] =
    useState(getAnalyticsConsent);

  function setScreen(nextScreen, { replace = false } = {}) {
    if (!VALID_SCREENS.has(nextScreen)) return;
    if (
      !replace &&
      nextScreen === screen &&
      screenFromLocation() === nextScreen
    ) {
      return;
    }
    setScreenState(nextScreen);
    const nextUrl = `${window.location.pathname}${window.location.search}#/${nextScreen}`;
    const updateHistory = replace ? "replaceState" : "pushState";
    window.history[updateHistory]({ screen: nextScreen }, "", nextUrl);
  }

  useEffect(() => {
    if (!token && !isPrototype && !["welcome", "auth"].includes(screen)) {
      setScreenState("welcome");
      window.history.replaceState(
        { screen: "welcome" },
        "",
        `${window.location.pathname}${window.location.search}#/welcome`,
      );
      return;
    }
    if (!window.location.hash) {
      window.history.replaceState(
        { screen },
        "",
        `${window.location.pathname}${window.location.search}#/${screen}`,
      );
    }
    const handlePopState = () => {
      const requestedScreen = screenFromLocation();
      if (accountType === "caregiver" && !CAREGIVER_SCREENS.has(requestedScreen)) {
        setScreenState("caregiverInbox");
        window.history.replaceState(
          { screen: "caregiverInbox" },
          "",
          `${window.location.pathname}${window.location.search}#/caregiverInbox`,
        );
        return;
      }
      setScreenState(requestedScreen);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [accountType, isPrototype, screen, token]);

  useEffect(() => {
    if (!isPrototype) return;
    setOnboardingComplete(
      sessionStorage.getItem("steady-prototype-tour-complete") === "true",
    );
    const data = buildPrototypeData(
      sessionStorage.getItem("steady-prototype-group") || "teen",
    );
    setName(data.name);
    setAgeGroup(data.ageGroup);
    setReadings(data.readings);
    setReminders(data.reminders);
    setProfile(data.profile);
    setInsulinSettings(data.insulinSettings);
  }, [isPrototype]);

  // Restore the signed-in user's saved data when a tab session is reopened.
  useEffect(() => {
    localStorage.removeItem("steady-token");
  }, []);

  useEffect(() => {
    if (!hasActiveAuthSession(token, isPrototype, sessionStorage)) return;
    let active = true;
    const capturedGeneration = sessionGeneration.capture();
    const controller = new AbortController();
    const isCurrentSession = () =>
      active &&
      sessionGeneration.isCurrent(capturedGeneration) &&
      hasActiveAuthSession(token, isPrototype, sessionStorage);

    async function loadProfile() {
      try {
        const response = await fetch(`${API_BASE}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!isCurrentSession()) return;

        if (!response.ok) {
          sessionGeneration.invalidate();
          sessionStorage.removeItem("steady-token");
          setToken("");
          setScreen("welcome", { replace: true });
          return;
        }

        const payload = await response.json();
        if (!isCurrentSession()) return;
        hydrateFromUser(payload.user);
        setOnboardingComplete(payload.user?.onboardingComplete ?? true);
        const connectionResponse = await fetch(`${API_BASE}/user/connections`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!isCurrentSession()) return;
        if (connectionResponse.ok) {
          const connections = await connectionResponse.json();
          if (!isCurrentSession()) return;
          setConnectionRequests(connections);
        }
        if (!isCurrentSession()) return;
        const requestedScreen = screenFromLocation();
        const restoredScreen =
          payload.user?.accountType === "caregiver"
            ? CAREGIVER_SCREENS.has(requestedScreen)
              ? requestedScreen
              : "caregiverInbox"
            : ["welcome", "auth", ...CAREGIVER_SCREENS].includes(requestedScreen)
              ? "dashboard"
              : requestedScreen;
        setScreen(restoredScreen, { replace: true });
      } catch (error) {
        if (isCurrentSession() && error.name !== "AbortError") {
          console.error("Failed to load user profile.", error);
        }
      }
    }

    loadProfile();
    return () => {
      active = false;
      controller.abort();
    };
  }, [token, isPrototype]);

  useEffect(() => {
    if (!hasActiveAuthSession(token, isPrototype, sessionStorage)) return;
    let active = true;
    const capturedGeneration = sessionGeneration.capture();
    let controller;
    const refreshConnections = async () => {
      try {
        controller?.abort();
        controller = new AbortController();
        const response = await fetch(`${API_BASE}/user/connections`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (
          !active ||
          !sessionGeneration.isCurrent(capturedGeneration) ||
          !hasActiveAuthSession(token, isPrototype, sessionStorage)
        )
          return;
        if (response.ok) {
          const connections = await response.json();
          if (
            active &&
            sessionGeneration.isCurrent(capturedGeneration) &&
            hasActiveAuthSession(token, isPrototype, sessionStorage)
          )
            setConnectionRequests(connections);
        }
      } catch {
        // A transient refresh failure should not interrupt the current screen.
      }
    };
    const interval = window.setInterval(refreshConnections, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
      controller?.abort();
    };
  }, [token, isPrototype]);

  useEffect(() => {
    if (accountType === "caregiver" && !CAREGIVER_SCREENS.has(screen)) {
      setScreen("caregiverInbox", { replace: true });
    }
  }, [accountType, screen]);

  // Keep API responses and initial state aligned with the values rendered by the app.
  function hydrateFromUser(user) {
    revisionRef.current = user.revision ?? 0;
    setName(user.name || "");
    setAgeGroup(user.ageGroup || "teen");
    setReadings(user.readings || defaultReadings);
    setReminders(user.reminders?.length ? user.reminders : defaultReminders);
    setProfile(user.profile || defaultProfile);
    setSharing(user.sharing || defaultSharing);
    setInsulinSettings({
      ...DEFAULT_INSULIN_SETTINGS,
      ...(user.insulinSettings || {}),
    });
    setAccountType(user.accountType || "patient");
    setSharedItems(user.sharedItems || []);
    setOnboardingComplete(user.onboardingComplete ?? true);
  }

  // Serialize field-scoped writes so rapid local edits advance revisions in order.
  async function persistUserState(
    nextOverrides = {},
    { throwOnError = false } = {},
  ) {
    if (!hasActiveAuthSession(token, isPrototype, sessionStorage)) {
      if (throwOnError) {
        throw new Error("Please sign in again to save your profile.");
      }
      return;
    }
    const requestToken = token;
    const capturedGeneration = sessionGeneration.capture();
    const isCurrentSession = () =>
      sessionGeneration.isCurrent(capturedGeneration) &&
      hasActiveAuthSession(requestToken, isPrototype, sessionStorage);
    const saveTask = saveQueueRef.current
      .catch(() => {})
      .then(async () => {
        if (!isCurrentSession()) {
          if (throwOnError) {
            throw new Error("Your session changed. Please sign in again.");
          }
          return;
        }
        const response = await fetch(`${API_BASE}/user/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${requestToken}`,
          },
          body: JSON.stringify({
            ...nextOverrides,
            revision: revisionRef.current,
          }),
        });
        if (!isCurrentSession()) {
          if (throwOnError) {
            throw new Error("Your session changed. Please sign in again.");
          }
          return;
        }
        if (response.status === 409) {
          setSaveConflict(true);
          if (throwOnError) {
            throw new Error(
              "Your account changed elsewhere. Reload the latest data before saving again.",
            );
          }
          return;
        }
        if (!response.ok) throw new Error("Profile save failed.");
        const payload = await response.json();
        if (!isCurrentSession()) {
          if (throwOnError) {
            throw new Error("Your session changed. Please sign in again.");
          }
          return;
        }
        revisionRef.current = payload.user.revision;
        return payload.user;
      });
    saveQueueRef.current = saveTask;
    try {
      return await saveTask;
    } catch (error) {
      console.error("Profile sync failed.", error);
      if (throwOnError) throw error;
    }
  }

  async function saveCaregiverProfile(details) {
    const user = await persistUserState(
      { profile: { ...profile, ...details } },
      { throwOnError: true },
    );
    setProfile(user.profile);
    setName(user.name);
  }

  async function refreshUserState() {
    if (!hasActiveAuthSession(token, isPrototype, sessionStorage)) return;
    const requestToken = token;
    const capturedGeneration = sessionGeneration.capture();
    const isCurrentSession = () =>
      sessionGeneration.isCurrent(capturedGeneration) &&
      hasActiveAuthSession(requestToken, isPrototype, sessionStorage);
    const response = await fetch(`${API_BASE}/user/me`, {
      headers: { Authorization: `Bearer ${requestToken}` },
    });
    if (!isCurrentSession()) return;
    if (!response.ok) throw new Error("Could not refresh the inbox.");
    const payload = await response.json();
    if (!isCurrentSession()) return;
    hydrateFromUser(payload.user);
    const connectionsResponse = await fetch(`${API_BASE}/user/connections`, {
      headers: { Authorization: `Bearer ${requestToken}` },
    });
    if (!isCurrentSession()) return;
    if (connectionsResponse.ok) {
      const connections = await connectionsResponse.json();
      if (isCurrentSession()) setConnectionRequests(connections);
    }
  }

  async function requestConnection(email) {
    if (!hasActiveAuthSession(token, isPrototype, sessionStorage)) {
      throw new Error("You need an active account to manage connections.");
    }
    const response = await fetch(`${API_BASE}/user/connections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(payload.message || "Could not send request.");
    await refreshUserState();
    return payload;
  }

  async function respondToConnection(connectionId, decision) {
    if (!hasActiveAuthSession(token, isPrototype, sessionStorage)) {
      throw new Error("You need an active account to manage connections.");
    }
    const response = await fetch(
      `${API_BASE}/user/connections/${connectionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Could not update request.");
    }
    await refreshUserState();
    return payload;
  }

  async function revokeConnection(connectionId) {
    if (!hasActiveAuthSession(token, isPrototype, sessionStorage)) {
      throw new Error("You need an active account to manage connections.");
    }
    const response = await fetch(
      `${API_BASE}/user/connections/${connectionId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(payload.message || "Could not remove pairing.");
    await refreshUserState();
  }

  // API actions used by the profile and caregiver inbox screens.
  async function sendSharedItemToCaregiver(item, caregiverEmail) {
    if (!hasActiveAuthSession(token, isPrototype, sessionStorage)) {
      throw new Error("You need to be signed in to share updates.");
    }
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

  // Session and prototype transitions reset or hydrate all account-scoped state.
  function handleAuthSuccess(user, authToken, isNewAccount = false) {
    sessionGeneration.invalidate();
    setSaveConflict(false);
    enterAuthenticatedSession(sessionStorage, authToken);
    setToken(authToken);
    setIsPrototype(false);
    hydrateFromUser(user);
    setTourStage(isNewAccount ? "prompt" : null);
    setScreen(
      user?.accountType === "caregiver" ? "caregiverInbox" : "dashboard",
      { replace: true },
    );
  }

  function resetUserState() {
    revisionRef.current = 0;
    sessionStorage.removeItem("steady-prototype");
    sessionStorage.removeItem("steady-prototype-group");
    sessionStorage.removeItem("steady-prototype-tour-complete");
    setName("");
    setAgeGroup("teen");
    setReadings(defaultReadings);
    setReminders(defaultReminders);
    setProfile(defaultProfile);
    setSharing(defaultSharing);
    setInsulinSettings(DEFAULT_INSULIN_SETTINGS);
    setAccountType("patient");
    setSharedItems([]);
    setConnectionRequests({ received: [], sent: [], connected: [] });
    setOnline(true);
    setIsPrototype(false);
    setEditingReading(null);
    setOnboardingComplete(false);
    setTourStage(null);
  }

  function startPrototype(group) {
    sessionGeneration.invalidate();
    setSaveConflict(false);
    const data = buildPrototypeData(group);
    resetUserState();
    enterPrototypeSession(sessionStorage, group);
    setToken("");
    setIsPrototype(true);
    setOnboardingComplete(false);
    setTourStage("prompt");
    setName(data.name);
    setAgeGroup(data.ageGroup);
    setReadings(data.readings);
    setReminders(data.reminders);
    setProfile(data.profile);
    setInsulinSettings(data.insulinSettings);
    setIsPrototype(true);
    setScreen("dashboard");
  }

  function closeTour() {
    setTourStage(null);
    setScreen(accountType === "caregiver" ? "caregiverInbox" : "dashboard", {
      replace: true,
    });
  }

  async function completeTour() {
    setOnboardingComplete(true);
    setTourStage(null);
    const homeScreen =
      accountType === "caregiver" ? "caregiverInbox" : "dashboard";
    setScreen(homeScreen, { replace: true });
    if (isPrototype) {
      sessionStorage.setItem("steady-prototype-tour-complete", "true");
      return;
    }
    await persistUserState({ onboardingComplete: true });
  }

  function handleLogout() {
    setLogoutPromptOpen(true);
  }

  function confirmLogout() {
    setLogoutPromptOpen(false);
    sessionGeneration.invalidate();
    setSaveConflict(false);
    sessionStorage.removeItem("steady-token");
    setToken("");
    resetUserState();
    setIsPrototype(false);
    setScreen("welcome", { replace: true });
  }

  // Reading mutations update local UI state and save the changed collection.
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

  // Keep caregiver navigation separate from patient medical screens.
  const isCaregiver = accountType === "caregiver";
  const routedScreen = isCaregiver
    ? CAREGIVER_SCREENS.has(screen)
      ? screen
      : "caregiverInbox"
    : screen === "caregiverProfile"
      ? "dashboard"
      : screen;

  // Analytics is initialized and screen-tracked only after consent is granted.
  useEffect(() => {
    if (analyticsConsent === "granted") initAnalytics();
  }, [analyticsConsent]);

  useEffect(() => {
    if (analyticsConsent === "granted") {
      trackScreen(routedScreen, { prototype: isPrototype });
    }
  }, [routedScreen, isPrototype, analyticsConsent]);

  function chooseAnalytics(choice) {
    setAnalyticsConsent(choice);
    setAnalyticsConsentState(choice);
  }
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
    <div
      className={`appOuter ${isCaregiver ? "caregiverApp" : "patientApp"} theme-${ageGroup}`}
    >
      <div className="phone">
        {isPrototype && (
          <div className="prototypeBanner" role="status">
            <span>
              <strong>PROTOTYPE</strong> · Sample data only. Not medical advice.
              Nothing is saved.
            </span>
            <button type="button" onClick={handleLogout}>
              Exit
            </button>
          </div>
        )}
        {saveConflict && (
          <div className="saveConflictBanner" role="alert">
            <p>
              This account changed in another tab. Reload the latest saved data
              before continuing; unsaved changes here will be lost.
            </p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload latest data
            </button>
          </div>
        )}
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
              onPrototype={startPrototype}
              onAuthSuccess={(user, authToken, isNewAccount) => {
                handleAuthSuccess(user, authToken, isNewAccount);
              }}
            />
          )}

          {routedScreen === "caregiverInbox" && (
            <CaregiverInboxPage
              name={name}
              email="Caregiver account"
              sharedItems={sharedItems}
              onRefresh={refreshUserState}
              connectionRequests={connectionRequests}
              onboardingComplete={onboardingComplete}
              onStartTour={() => setTourStage("tour")}
              onRequestConnection={requestConnection}
              onRespondToConnection={respondToConnection}
              onRevokeConnection={revokeConnection}
              onProfile={() => setScreen("caregiverProfile")}
              onLogout={handleLogout}
            />
          )}

          {routedScreen === "caregiverProfile" && (
            <CaregiverProfilePage
              name={name}
              profile={profile}
              onSave={saveCaregiverProfile}
              onBack={() => setScreen("caregiverInbox")}
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
              onboardingComplete={onboardingComplete}
              onStartTour={() => setTourStage("tour")}
              prototype={isPrototype}
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
                setScreen("dashboard");
              }}
            />
          )}

          {routedScreen === "glucoseHistory" && (
            <GlucoseHistoryPage
              readings={readings}
              profile={profile}
              reminders={reminders}
              prototype={isPrototype}
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
              prototype={isPrototype}
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
              latestReading={readings[readings.length - 1]}
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
              prototype={isPrototype}
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
              connectionRequests={connectionRequests}
              onRequestConnection={requestConnection}
              onRespondToConnection={respondToConnection}
              onRevokeConnection={revokeConnection}
              onBack={() => setScreen("dashboard")}
              onLogout={handleLogout}
            />
          )}
        </div>

        <GuidedTour
          stage={tourStage}
          screen={routedScreen}
          mode={
            isPrototype ? "prototype" : isCaregiver ? "caregiver" : "patient"
          }
          setScreen={setScreen}
          onStart={() => setTourStage("tour")}
          onClose={closeTour}
          onComplete={completeTour}
        />

        {showNav && <NavBar screen={routedScreen} setScreen={setScreen} />}

        {logoutPromptOpen && (
          <div
            className="modalBackdrop"
            role="presentation"
            onClick={() => setLogoutPromptOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setLogoutPromptOpen(false);
            }}
          >
            <section
              className="modalPanel logoutDialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="logout-dialog-title"
              aria-describedby="logout-dialog-description"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sectionKicker">
                {isPrototype ? "PROTOTYPE" : "ACCOUNT"}
              </div>
              <h2 id="logout-dialog-title">
                {isPrototype ? "Exit prototype?" : "Log out?"}
              </h2>
              <p id="logout-dialog-description">
                Any unsaved changes will be lost.
              </p>
              <div className="logoutDialogActions">
                <button
                  className="logoutDialogCancel"
                  type="button"
                  autoFocus
                  onClick={() => setLogoutPromptOpen(false)}
                >
                  Stay signed in
                </button>
                <button
                  className="logoutDialogConfirm"
                  type="button"
                  onClick={confirmLogout}
                >
                  {isPrototype ? "Exit prototype" : "Log out"}
                </button>
              </div>
            </section>
          </div>
        )}

        {analyticsConfigured && analyticsConsent === null && (
          <div className="consentBanner" role="dialog" aria-label="Analytics">
            <p>
              Steady uses Google Analytics to count which screens are opened, so
              we can improve the app. No health information, names or emails are
              sent. You can decline and the app works the same.
            </p>
            <div className="consentActions">
              <button type="button" onClick={() => chooseAnalytics("denied")}>
                Decline
              </button>
              <button
                type="button"
                className="consentAccept"
                onClick={() => chooseAnalytics("granted")}
              >
                Accept
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
