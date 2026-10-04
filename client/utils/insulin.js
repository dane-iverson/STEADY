import { normalizeDecimalInput } from "./diabetes.js";

export const DEFAULT_INSULIN_SETTINGS = {
  insulinType: "Rapid-acting insulin",
  deliveryMethod: "Pen or syringe",
  carbRatio: "",
  sensitivity: "",
  targetGlucose: "",
  doseIncrement: "0.5",
  maxBolus: "",
  lowThreshold: "4.0",
  insulinDuration: "4",
};

// Meters show HI above 33.3 mmol/L.
const MAX_METER_GLUCOSE = 33.3;
const MAX_CARBS_G = 300;
const KETONE_CHECK_GLUCOSE = 14;

// Accepts "6,8" as well as "6.8"; empty input is NaN, not 0.
function toNumber(value) {
  const text = normalizeDecimalInput(value).trim();
  return text === "" ? NaN : Number(text);
}

function positiveNumber(value) {
  const number = toNumber(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

// Linear decay over the insulin action time; an unknown time counts as "just taken".
export function estimateInsulinOnBoard({ units, hoursAgo, durationHours = 4 }) {
  const dose = toNumber(units);
  if (!Number.isFinite(dose) || dose <= 0) return 0;
  const elapsed = toNumber(hoursAgo);
  const duration = positiveNumber(durationHours) || 4;
  const hours = Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0;
  return Math.max(0, dose * (1 - hours / duration));
}

export function calculateInsulinDose({
  glucose,
  carbs,
  insulinOnBoard = 0,
  settings = DEFAULT_INSULIN_SETTINGS,
  sick = false,
  ketones = "unchecked",
}) {
  const currentGlucose = toNumber(glucose);
  const carbohydrateGrams = toNumber(carbs);
  const activeInsulin =
    String(insulinOnBoard ?? "").trim() === "" ? 0 : toNumber(insulinOnBoard);
  const carbRatio = positiveNumber(settings.carbRatio);
  const sensitivity = positiveNumber(settings.sensitivity);
  const targetGlucose = positiveNumber(settings.targetGlucose);
  const increment = positiveNumber(settings.doseIncrement) || 0.5;
  const maxBolus = positiveNumber(settings.maxBolus);
  const lowThreshold = positiveNumber(settings.lowThreshold) || 4;
  const missingSettings = !carbRatio || !sensitivity || !targetGlucose;

  if (missingSettings) {
    return {
      status: "setup",
      reason: "Add the clinician-prescribed settings before calculating.",
    };
  }
  if (!Number.isFinite(currentGlucose) || currentGlucose <= 0) {
    return {
      status: "incomplete",
      reason: "Enter your current glucose reading.",
    };
  }
  if (currentGlucose > MAX_METER_GLUCOSE) {
    return {
      status: "stop",
      reason:
        "A reading above 33.3 mmol/L (HI on most meters) needs ketone checks and your high-glucose plan. Do not use this calculator.",
    };
  }
  if (
    !Number.isFinite(carbohydrateGrams) ||
    carbohydrateGrams < 0 ||
    carbohydrateGrams > MAX_CARBS_G
  ) {
    return {
      status: "incomplete",
      reason: `Enter the carbohydrates in grams, from 0 to ${MAX_CARBS_G} (use 0 for a correction only).`,
    };
  }
  if (!Number.isFinite(activeInsulin) || activeInsulin < 0) {
    return {
      status: "incomplete",
      reason: "Active insulin cannot be negative.",
    };
  }
  if (currentGlucose < lowThreshold) {
    return {
      status: "stop",
      reason:
        "Your glucose is below the configured low threshold. Follow your hypo plan and do not use a correction calculation.",
    };
  }
  if (ketones === "moderate" || ketones === "high") {
    return {
      status: "stop",
      reason:
        "Do not use a standard bolus calculation with moderate or high ketones. Follow your sick-day plan now.",
    };
  }
  if (sick && ketones === "unchecked") {
    return {
      status: "incomplete",
      reason:
        "You are unwell. Check your ketones and select the result before using the calculator.",
    };
  }
  if (sick && ketones !== "none") {
    return {
      status: "stop",
      reason:
        "You are unwell and have ketones. Follow your sick-day plan or contact your diabetes team.",
    };
  }

  const mealDose = carbohydrateGrams / carbRatio;
  // Below target the correction goes negative and reduces the meal dose, as pump calculators do.
  const correctionDose = (currentGlucose - targetGlucose) / sensitivity;
  const beforeRounding = Math.max(0, mealDose + correctionDose - activeInsulin);
  const roundedDose = Math.round(beforeRounding / increment) * increment;
  const totalDose = maxBolus ? Math.min(roundedDose, maxBolus) : roundedDose;

  const warnings = [];
  if (currentGlucose >= KETONE_CHECK_GLUCOSE && ketones === "unchecked") {
    warnings.push(
      `Your glucose is ${KETONE_CHECK_GLUCOSE} mmol/L or higher. Check ketones and follow your high-glucose plan before dosing.`,
    );
  }
  if (ketones === "trace") {
    warnings.push(
      "Trace or small ketones: follow your sick-day plan and recheck glucose and ketones.",
    );
  }
  if (correctionDose < 0) {
    warnings.push(
      "Your glucose is below target, so the meal dose was reduced.",
    );
  }

  return {
    status: "ready",
    mealDose,
    correctionDose,
    insulinOnBoard: activeInsulin,
    totalDose,
    capped: Boolean(maxBolus && roundedDose > maxBolus),
    warnings,
    exerciseGuidance:
      "Follow your personalised exercise plan. Do not apply an automatic percentage adjustment.",
    sicknessGuidance: sick
      ? "You marked that you are unwell. Follow your sick-day and ketone plan."
      : null,
  };
}
