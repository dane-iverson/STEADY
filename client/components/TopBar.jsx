import React from "react";
import { ChevronLeft } from "lucide-react";
import { StatusPill } from "./StatusPill";

export function TopBar({ title, onBack, online, onToggleOnline }) {
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
        <div style={{ width: 32 }} />
      </div>
      <StatusPill online={online} onToggle={onToggleOnline} />
    </div>
  );
}
