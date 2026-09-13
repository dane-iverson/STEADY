import React from "react";
import { Droplet } from "lucide-react";

export function WelcomePage({ onNext }) {
  return (
    <div className="screen center">
      <div className="brandMark">
        <Droplet size={30} strokeWidth={2.2} />
      </div>
      <h1 className="brandTitle">Steady</h1>
      <p className="brandSub">
        A day-to-day companion for living with Type&nbsp;1 diabetes.
      </p>
      <div style={{ flex: 1 }} />
      <button className="btnPrimary" onClick={onNext}>
        Get started
      </button>
      <p className="fineprint">
        Built for children, adolescents and young adults with T1DM.
      </p>
    </div>
  );
}
