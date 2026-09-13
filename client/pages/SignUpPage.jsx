import React, { useState } from "react";
import { AGE_GROUPS } from "../data/appData";

export function SignUpPage({ ageGroup, onDone }) {
  const [name, setName] = useState("");

  return (
    <div className="screen">
      <h2 className="screenTitle">Let's set you up</h2>
      <p className="screenSub">
        Just a first name to get started — nothing else needed right now.
      </p>
      <label className="fieldLabel" htmlFor="name">
        First name
      </label>
      <input
        id="name"
        className="textInput"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div style={{ flex: 1 }} />
      <button
        className="btnPrimary"
        disabled={!name.trim()}
        onClick={() => onDone(name.trim() || "there")}
      >
        Continue
      </button>
      <p className="fineprint">Signed up as {AGE_GROUPS[ageGroup].name}</p>
    </div>
  );
}
