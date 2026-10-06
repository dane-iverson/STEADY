/**
 * Maps a date of birth (YYYY-MM-DD) to the app's age group.
 * Returns null for a missing, invalid or future date.
 * The cut-offs match `ageGroupFromDateOfBirth` in client/utils/diabetes.js.
 *
 * @param {string} dateOfBirth
 * @returns {"child" | "teen" | "young_adult" | null}
 */
export function ageGroupFromDateOfBirth(dateOfBirth) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (
    !dateOfBirth ||
    Number.isNaN(birthDate.getTime()) ||
    birthDate > new Date()
  ) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate(),
  );
  if (birthday > today) age -= 1;

  if (age <= 12) return "child";
  if (age <= 18) return "teen";
  return "young_adult";
}
