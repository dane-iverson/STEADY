const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const CONSENT_KEY = "steady-analytics-consent";

let initialised = false;

export const analyticsConfigured = Boolean(MEASUREMENT_ID);

// "granted", "denied", or null when the user has not chosen yet.
export function getAnalyticsConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage blocked: the choice simply won't persist.
  }
}

export function initAnalytics() {
  if (initialised || !MEASUREMENT_ID || typeof document === "undefined") return;
  if (getAnalyticsConsent() !== "granted") return;
  initialised = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // Screens are tracked manually because the app has no router.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

// Only the screen name is sent: never readings, names or other health data.
export function trackScreen(screen, { prototype = false } = {}) {
  if (!initialised || !window.gtag) return;
  window.gtag("event", "screen_view", {
    screen_name: screen,
    app_mode: prototype ? "prototype" : "account",
  });
}
