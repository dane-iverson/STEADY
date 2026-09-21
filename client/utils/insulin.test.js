import test from "node:test";
import assert from "node:assert/strict";
import { calculateInsulinDose } from "./insulin.js";

const settings = {
  carbRatio: "10",
  sensitivity: "3",
  targetGlucose: "6",
  doseIncrement: "0.5",
  maxBolus: "10",
  lowThreshold: "4",
};

test("calculates meal and correction insulin with insulin on board", () => {
  const result = calculateInsulinDose({
    glucose: 12,
    carbs: 60,
    insulinOnBoard: 0.5,
    settings,
  });

  assert.equal(result.status, "ready");
  assert.equal(result.mealDose, 6);
  assert.equal(result.correctionDose, 2);
  assert.equal(result.totalDose, 7.5);
});

test("stops calculation for low glucose or significant ketones", () => {
  assert.equal(
    calculateInsulinDose({ glucose: 3.4, carbs: 40, settings }).status,
    "stop",
  );
  assert.equal(
    calculateInsulinDose({ glucose: 10, carbs: 40, ketones: "high", settings })
      .status,
    "stop",
  );
});

test("requires clinician-entered settings", () => {
  assert.equal(calculateInsulinDose({ glucose: 8, carbs: 40 }).status, "setup");
});

test("rejects negative active insulin input", () => {
  assert.equal(
    calculateInsulinDose({
      glucose: 8,
      carbs: 40,
      insulinOnBoard: -1,
      settings,
    }).status,
    "incomplete",
  );
});
