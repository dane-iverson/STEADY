import React from "react";
import { AGE_GROUPS } from "../data/appData";

export function AgeSelectPage({ onSelect }) {
  return (
    <div className="screen">
      <h2 className="screenTitle">How old are you?</h2>
      <p className="screenSub">
        We'll shape the app around your age group. You can change this later.
      </p>
      <div className="ageList">
        {Object.entries(AGE_GROUPS).map(([key, g]) => (
          <button
            key={key}
            className={`ageOption ageOption-${key}`}
            onClick={() => onSelect(key)}
          >
            <span className="ageOptionAccent" aria-hidden="true" />
            <span className="ageOptionYears">{g.label}</span>
            <span className="ageOptionName">{g.name}</span>
            <span className="ageOptionArrow" aria-hidden="true">
              &rarr;
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
