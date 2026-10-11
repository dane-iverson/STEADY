/**
 * Runtime configuration helpers shared by the route files.
 */

let mongoAvailable = false;

/**
 * True when a real MongoDB connection string is configured.
 * Without one the API falls back to the in-memory user list in db.js.
 */
export function databaseConfigured() {
  return mongoAvailable;
}

export function setDatabaseAvailable(available) {
  mongoAvailable = available;
}

/**
 * Secret used to sign and verify login tokens.
 * Production must provide JWT_SECRET; the fallback exists for local development only.
 */
export function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production.");
  }
  return "steady-dev-secret";
}

export function validateProductionConfig() {
  if (process.env.NODE_ENV !== "production") return;
  jwtSecret();
  if (
    !process.env.MONGODB_URI ||
    process.env.MONGODB_URI.includes("placeholder")
  ) {
    throw new Error("MONGODB_URI must be configured in production.");
  }
  if (!process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL must be configured in production.");
  }
}
