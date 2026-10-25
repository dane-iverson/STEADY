import test from "node:test";
import assert from "node:assert/strict";
import { createSessionGeneration } from "./sessionGeneration.js";

test("a delayed response cannot apply after its session is invalidated", async () => {
  const session = createSessionGeneration();
  const capturedGeneration = session.capture();
  let resolveResponse;
  let appliedUser = null;
  const response = new Promise((resolve) => {
    resolveResponse = resolve;
  });
  const applyResponse = async () => {
    const user = await response;
    if (!session.isCurrent(capturedGeneration)) return false;
    appliedUser = user;
    return true;
  };

  const applying = applyResponse();
  session.invalidate();
  resolveResponse({ name: "Previous account" });

  assert.equal(await applying, false);
  assert.equal(appliedUser, null);
});

test("responses from the active session remain applicable", () => {
  const session = createSessionGeneration();
  const capturedGeneration = session.capture();
  assert.equal(session.isCurrent(capturedGeneration), true);
});
