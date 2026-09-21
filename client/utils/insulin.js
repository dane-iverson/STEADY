export const DEFAULT_INSULIN_SETTINGS = {
  insulinType: "Rapid-acting insulin",
  deliveryMethod: "Pen or syringe",
  carbRatio: "",
  sensitivity: "",
  targetGlucose: "",
  doseIncrement: "0.5",
  maxBolus: "",
  lowThreshold: "4.0",
};

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function calculateInsulinDose({
  glucose,
  carbs,
  insulinOnBoard = 0,
  settings = DEFAULT_INSULIN_SETTINGS,
  sick = false,
  ketones = "none",
}) {
  const currentGlucose = Number(glucose);
  const carbohydrateGrams = Number(carbs);
  const activeInsulin = Number(insulinOnBoard);
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
  if (
    !Number.isFinite(currentGlucose) ||
    !Number.isFinite(carbohydrateGrams) ||
    carbohydrateGrams < 0 ||
    !Number.isFinite(activeInsulin) ||
    activeInsulin < 0
  ) {
    return {
      status: "incomplete",
      reason: "Enter a valid glucose reading and carbohydrate amount.",
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
  if (sick && ketones !== "none") {
    return {
      status: "stop",
      reason:
        "You are unwell and have ketones. Follow your sick-day plan or contact your diabetes team.",
    };
  }

  const mealDose = carbohydrateGrams / carbRatio;
  const correctionDose = Math.max(
    0,
    (currentGlucose - targetGlucose) / sensitivity,
  );
  const beforeRounding = Math.max(0, mealDose + correctionDose - activeInsulin);
  const roundedDose = Math.round(beforeRounding / increment) * increment;
  const totalDose = maxBolus ? Math.min(roundedDose, maxBolus) : roundedDose;

  return {
    status: "ready",
    mealDose,
    correctionDose,
    insulinOnBoard: activeInsulin,
    totalDose,
    capped: Boolean(maxBolus && roundedDose > maxBolus),
    exerciseGuidance:
      "Follow your personalised exercise plan. Do not apply an automatic percentage adjustment.",
    sicknessGuidance: sick
      ? "You marked that you are unwell. Follow your sick-day and ketone plan."
      : null,
  };
}
