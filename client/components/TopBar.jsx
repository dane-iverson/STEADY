import React from "react";
import { ChevronLeft, UserRound } from "lucide-react";
import { StatusPill } from "./StatusPill";

export function TopBar({ title, onBack, online, onToggleOnline, onProfile }) {
  return (
    <div className="topbar">
      <div className="topbarRow">
        {onBack ? (
          <button className="iconBtn" onClick={onBack} aria-label="Back">
            <ChevronLeft size={20} />
          </button>
        ) : (
          <div style={{ width: 32 }} />
        )}
        <h1>{title}</h1>
        <button
          className="iconBtn"
          onClick={onProfile}
          aria-label="Medical profile"
        >
          <UserRound size={19} />
        </button>
      </div>
      <StatusPill online={online} onToggle={onToggleOnline} />
    </div>
  );
}
