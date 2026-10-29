import React from "react";
import { ChevronLeft } from "lucide-react";

export function BackButton({ onClick, destination = "home", disabled = false }) {
  return (
    <button
      className="linkBack"
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      <ChevronLeft size={20} aria-hidden="true" />
      Back to {destination}
    </button>
  );
}
