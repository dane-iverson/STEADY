import test from "node:test";
import assert from "node:assert/strict";
import {
  enterAuthenticatedSession,
  enterPrototypeSession,
  hasActiveAuthSession,
  resolveStoredSession,
} from "./sessionMode.js";

function createStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("prototype entry clears the active auth token", () => {
  const storage = createStorage({ "steady-token": "private-token" });
  enterPrototypeSession(storage, "teen");

  assert.equal(storage.getItem("steady-token"), null);
  assert.deepEqual(resolveStoredSession(storage), { token: "", isPrototype: true });
  assert.equal(hasActiveAuthSession("private-token", false, storage), false);
  assert.equal(hasActiveAuthSession("", true, storage), false);
});

test("mixed persisted flags restart in prototype-only mode", () => {
  const storage = createStorage({
    "steady-token": "private-token",
    "steady-prototype": "true",
    "steady-prototype-group": "teen",
  });

  assert.deepEqual(resolveStoredSession(storage), { token: "", isPrototype: true });
  assert.equal(storage.getItem("steady-token"), null);
});

test("a stale prototype flag is removed when entering an authenticated session", () => {
  const storage = createStorage({
    "steady-prototype": "true",
    "steady-prototype-group": "teen",
    "steady-prototype-tour-complete": "true",
  });
  enterAuthenticatedSession(storage, "new-account-token");

  assert.deepEqual(resolveStoredSession(storage), {
    token: "new-account-token",
    isPrototype: false,
  });
  assert.equal(hasActiveAuthSession("new-account-token", false, storage), true);
  assert.equal(hasActiveAuthSession("new-account-token", true, storage), false);
});

test("authenticated requests require the matching real-account session", () => {
  const storage = createStorage({ "steady-token": "token-a" });
  assert.equal(hasActiveAuthSession("token-a", false, storage), true);
  assert.equal(hasActiveAuthSession("token-b", false, storage), false);
  assert.equal(hasActiveAuthSession("token-a", true, storage), false);
  storage.setItem("steady-prototype", "true");
  assert.equal(hasActiveAuthSession("token-a", false, storage), false);
});