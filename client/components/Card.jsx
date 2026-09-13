import React from "react";

export function Card({ children, style }) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  );
}
