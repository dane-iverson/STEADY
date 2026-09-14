import React from "react";
import { Activity, ChevronLeft, UserRound } from "lucide-react";
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
        <div className="topbarIdentity">
          <div className="topbarBrandMark">
            <Activity size={15} strokeWidth={2.8} />
          </div>
          <div>
            <span className="topbarEyebrow">STEADY CARE</span>
            <h1>{title}</h1>
          </div>
        </div>
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
