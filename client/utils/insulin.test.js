import test from "node:test";
import assert from "node:assert/strict";
import { calculateInsulinDose, estimateInsulinOnBoard } from "./insulin.js";

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

test("accepts a decimal comma for glucose and carbs", () => {
  const result = calculateInsulinDose({
    glucose: "9,0",
    carbs: "45,5",
    settings,
  });
  assert.equal(result.status, "ready");
  assert.equal(result.mealDose, 4.55);
  assert.equal(result.correctionDose, 1);
});

test("an empty glucose field is incomplete, not a hypo", () => {
  assert.equal(
    calculateInsulinDose({ glucose: "", carbs: 30, settings }).status,
    "incomplete",
  );
});

test("below target the correction reduces the meal dose", () => {
  const result = calculateInsulinDose({ glucose: 5, carbs: 60, settings });
  assert.equal(result.status, "ready");
  assert.ok(result.correctionDose < 0);
  assert.equal(result.totalDose, 5.5);
});

test("meter HI readings and unchecked ketones while sick are blocked", () => {
  assert.equal(
    calculateInsulinDose({ glucose: 34, carbs: 0, settings }).status,
    "stop",
  );
  assert.equal(
    calculateInsulinDose({ glucose: 9, carbs: 30, sick: true, settings })
      .status,
    "incomplete",
  );
  assert.equal(
    calculateInsulinDose({
      glucose: 9,
      carbs: 30,
      sick: true,
      ketones: "none",
      settings,
    }).status,
    "ready",
  );
});

test("warns to check ketones at 14 mmol/L or higher", () => {
  const result = calculateInsulinDose({ glucose: 15, carbs: 0, settings });
  assert.equal(result.status, "ready");
  assert.equal(result.warnings.length, 1);
});

test("estimates insulin on board with a straight-line fall", () => {
  assert.equal(
    estimateInsulinOnBoard({ units: 5, hoursAgo: 1.5, durationHours: 4 }),
    3.125,
  );
  assert.equal(
    estimateInsulinOnBoard({ units: 5, hoursAgo: 5, durationHours: 4 }),
    0,
  );
  assert.equal(estimateInsulinOnBoard({ units: "", hoursAgo: 1 }), 0);
});
