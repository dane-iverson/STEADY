import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stylesheet = readFileSync(
  new URL("../styles/caregiver.css", import.meta.url),
  "utf8",
);
const tokens = Object.fromEntries(
  [...stylesheet.matchAll(/(--[\w-]+):\s*(#[\da-f]{3,6});/gi)].map((match) => [
    match[1],
    match[2],
  ]),
);

function luminance(hex) {
  const full =
    hex.length === 4
      ? hex
          .slice(1)
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : hex.slice(1);
  const channels = [0, 2, 4]
    .map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first, second) {
  const lightness = [luminance(tokens[first]), luminance(tokens[second])].sort(
    (left, right) => right - left,
  );
  return (lightness[0] + 0.05) / (lightness[1] + 0.05);
}

test("caregiver text and semantic status palettes meet normal-text AA contrast", () => {
  for (const [foreground, background] of [
    ["--ink", "--surface"],
    ["--ink-soft", "--surface"],
    ["--surface", "--brand"],
    ["--surface", "--brand-dark"],
    ...["info", "success", "warning", "danger"].map((role) => [
      `--cg-${role}`,
      `--cg-${role}-surface`,
    ]),
  ]) {
    assert.ok(
      contrast(foreground, background) >= 4.5,
      `${foreground} on ${background}`,
    );
  }
});

test("caregiver control borders and focus rings meet non-text contrast", () => {
  assert.ok(contrast("--cg-control-border", "--surface") >= 3);
  assert.ok(contrast("--cg-focus", "--surface") >= 3);
});
