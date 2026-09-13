import React from "react";
import { Wifi, WifiOff } from "lucide-react";

export function StatusPill({ online, onToggle }) {
  return (
    <button className="statusPill" onClick={onToggle}>
      {online ? <Wifi size={13} /> : <WifiOff size={13} />}
      <span>{online ? "Online · synced" : "Offline · saved on device"}</span>
    </button>
  );
}
