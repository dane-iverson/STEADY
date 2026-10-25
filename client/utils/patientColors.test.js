import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL("../styles/patient.css", import.meta.url),
  "utf8",
);
const parse = (block) =>
  Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi)].map((match) => [
      match[1],
      match[2],
    ]),
  );
const base = parse(css.match(/\.appOuter\.patientApp\s*\{([^}]+)\}/)[1]);

function luminance(hex) {
  const channels = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

for (const theme of ["child", "teen", "young_adult"]) {
  test(`${theme} patient palette meets text and control contrast thresholds`, () => {
    const overrides = css.match(
      new RegExp(`\\.appOuter\\.patientApp\\.theme-${theme}\\s*\\{([^}]+)\\}`),
    )[1];
    const colors = { ...base, ...parse(overrides) };
    const ratio = (first, second) => {
      const values = [luminance(colors[first]), luminance(colors[second])].sort(
        (left, right) => right - left,
      );
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    for (const surface of ["--surface", "--surface-muted", "--brand-tint"]) {
      for (const text of ["--ink", "--ink-soft", "--brand-dark"]) {
        assert.ok(ratio(text, surface) >= 4.5, `${text} on ${surface}`);
      }
    }
    assert.ok(ratio("--surface", "--brand") >= 4.5);
    for (const status of ["target", "low", "high", "critical"]) {
      assert.ok(ratio(`--status-${status}`, `--status-${status}-bg`) >= 4.5);
    }
    assert.ok(ratio("--input-border", "--surface") >= 3);
    assert.ok(ratio("--focus", "--surface") >= 3);
  });
}
