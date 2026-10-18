import React, { useEffect, useState } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function daysInMonth(year, month) {
  if (!month) return 31;
  return new Date(year || 2000, month, 0).getDate();
}

function partsFromDate(value) {
  const [year = "", month = "", day = ""] = value?.split("-") || [];
  return { year, month, day };
}

export function DateOfBirthPicker({
  value = "",
  onChange,
  idPrefix = "date-of-birth",
  required = false,
}) {
  const [parts, setParts] = useState(() => partsFromDate(value));
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (value) setParts(partsFromDate(value));
  }, [value]);

  function updatePart(key, nextValue) {
    const nextParts = { ...parts, [key]: nextValue };
    if (key === "month" || key === "year") {
      const maxDay = daysInMonth(
        Number(nextParts.year),
        Number(nextParts.month),
      );
      if (Number(nextParts.day) > maxDay) nextParts.day = "";
    }
    if (nextParts.year && nextParts.month && nextParts.day) {
      const selectedDate = new Date(
        Number(nextParts.year),
        Number(nextParts.month) - 1,
        Number(nextParts.day),
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) nextParts.day = "";
    }
    setParts(nextParts);
    if (nextParts.year && nextParts.month && nextParts.day) {
      onChange(`${nextParts.year}-${nextParts.month}-${nextParts.day}`);
    } else {
      onChange("");
    }
  }

  const maxDay = daysInMonth(Number(parts.year), Number(parts.month));
  const days = Array.from({ length: maxDay }, (_, index) => index + 1).filter(
    (day) => {
      if (Number(parts.year) < currentYear) return true;
      if (Number(parts.year) > currentYear) return false;
      const month = Number(parts.month);
      const today = new Date();
      return (
        month < today.getMonth() + 1 ||
        (month === today.getMonth() + 1 && day <= today.getDate())
      );
    },
  );

  return (
    <div className="dobPicker" role="group" aria-label="Date of birth">
      <div>
        <label className="fieldLabel" htmlFor={`${idPrefix}-day`}>
          Day
        </label>
        <select
          id={`${idPrefix}-day`}
          className="textInput"
          value={parts.day}
          required={required}
          onChange={(event) => updatePart("day", event.target.value)}
        >
          <option value="">Day</option>
          {days.map((day) => (
            <option key={day} value={String(day).padStart(2, "0")}>
              {day}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="fieldLabel" htmlFor={`${idPrefix}-month`}>
          Month
        </label>
        <select
          id={`${idPrefix}-month`}
          className="textInput"
          value={parts.month}
          required={required}
          onChange={(event) =>
            updatePart("month", event.target.value.padStart(2, "0"))
          }
        >
          <option value="">Month</option>
          {MONTHS.map((month, index) => (
            <option key={month} value={String(index + 1).padStart(2, "0")}>
              {month}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="fieldLabel" htmlFor={`${idPrefix}-year`}>
          Year
        </label>
        <select
          id={`${idPrefix}-year`}
          className="textInput"
          value={parts.year}
          required={required}
          onChange={(event) => updatePart("year", event.target.value)}
        >
          <option value="">Year</option>
          {Array.from(
            { length: currentYear - 1899 },
            (_, index) => currentYear - index,
          ).map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
