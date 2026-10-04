import { formatReadingStamp } from "../utils/diabetes.js";
import { DEFAULT_INSULIN_SETTINGS } from "../utils/insulin.js";

// Fixed sample values (mmol/L) per day: before breakfast, after lunch, before dinner, bedtime.
const SAMPLE_DAYS = [
  [5.8, 8.4, 6.2, 7.1],
  [6.4, 9.6, 5.5, 8.2],
  [3.7, 7.2, 6.8, 7.9],
  [6.1, 11.3, 6.6, 9.0],
  [5.2, 7.7, 15.2, 8.8],
  [6.9, 8.1, 6.0, 7.4],
  [5.6, 10.2, 7.3, 8.5],
  [6.3, 7.5, 5.9, 6.8],
  [7.0, 12.4, 6.4, 8.0],
  [5.9, 8.8, 6.1, 7.2],
  [6.2, 9.1, 5.8, 7.6],
  [4.8, 7.9, 6.5, 8.3],
  [6.6, 8.6, 7.1, 7.7],
  [5.7, 8.0, 6.3, 7.0],
];

const SLOTS = [
  { hour: 7, minute: 15, context: "Before meal" },
  { hour: 13, minute: 40, context: "After meal" },
  { hour: 17, minute: 55, context: "Before meal" },
  { hour: 21, minute: 30, context: "Random" },
];

function buildMockReadings() {
  const now = new Date();
  const readings = [];
  SAMPLE_DAYS.forEach((values, index) => {
    const daysAgo = SAMPLE_DAYS.length - 1 - index;
    values.forEach((value, slotIndex) => {
      const slot = SLOTS[slotIndex];
      const date = new Date(now);
      date.setDate(now.getDate() - daysAgo);
      date.setHours(slot.hour, slot.minute, 0, 0);
      if (date > now) return;
      readings.push({
        id: `prototype-reading-${index}-${slotIndex}`,
        v: value,
        context: slot.context,
        date: date.toISOString(),
        time: formatReadingStamp(date),
      });
    });
  });
  return readings;
}

function buildMockReminders() {
  const at = (hour, minute, offsetDays = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };
  return [
    {
      id: "prototype-reminder-1",
      title: "Morning glucose check",
      kind: "Glucose check",
      when: at(7, 0),
      repeat: "Daily",
      on: true,
    },
    {
      id: "prototype-reminder-2",
      title: "Lunchtime insulin",
      kind: "Insulin",
      when: at(12, 30),
      repeat: "Daily",
      on: true,
    },
    {
      id: "prototype-reminder-3",
      title: "Clinic appointment",
      kind: "Appointment",
      when: at(15, 0, 10),
      repeat: "Never",
      on: false,
    },
  ];
}

// Ages are applied to today's date so each persona stays in its age group.
const PROTOTYPE_PERSONAS = {
  child: {
    name: "Tester",
    age: 9,
    weight: "30 kg",
    height: "135 cm",
  },
  teen: {
    name: "Tester",
    age: 15,
    weight: "55 kg",
    height: "165 cm",
  },
  young_adult: {
    name: "Tester",
    age: 25,
    weight: "68 kg",
    height: "172 cm",
  },
};

function isoDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function buildPrototypeData(ageGroup = "teen") {
  const persona = PROTOTYPE_PERSONAS[ageGroup] || PROTOTYPE_PERSONAS.teen;
  return {
    name: persona.name,
    ageGroup: PROTOTYPE_PERSONAS[ageGroup] ? ageGroup : "teen",
    readings: buildMockReadings(),
    reminders: buildMockReminders(),
    profile: {
      name: persona.name,
      surname: "Prototype",
      height: persona.height,
      weight: persona.weight,
      gender: "Female",
      otherMedication: "None (sample data)",
      allergies: "None (sample data)",
      dateOfBirth: isoDaysAgo(Math.round(persona.age * 365.25) + 30),
      status: "Type 1 diabetes",
      contactName: "Sample Parent",
      contactNumber: "000 000 0000",
      hba1c: "7.2",
      hba1cDate: isoDaysAgo(42),
      glucoseRanges: {
        veryLowMax: 3,
        lowMax: 4,
        targetMax: 7.8,
        highMax: 14,
      },
    },
    insulinSettings: {
      ...DEFAULT_INSULIN_SETTINGS,
      carbRatio: "10",
      sensitivity: "3",
      targetGlucose: "6",
      maxBolus: "10",
    },
  };
}
