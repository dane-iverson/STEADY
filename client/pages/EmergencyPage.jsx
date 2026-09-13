import React from "react";
import { ChevronLeft, Phone, WifiOff } from "lucide-react";
import { Card } from "../components/Card";

export function EmergencyPage({ profile, onBack }) {
  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <ChevronLeft size={16} /> Home
      </button>
      <div className="rowBetween">
        <h2 className="screenTitle" style={{ marginBottom: 2 }}>
          Emergency &amp; safety
        </h2>
      </div>
      <div className="offlineBadge">
        <WifiOff size={12} /> Always available, even offline
      </div>

      <Card>
        <div className="cardEyebrow" style={{ color: "#3E7CB8" }}>
          Low blood glucose (hypo)
        </div>
        <ol className="stepsList">
          <li>Stop what you're doing and sit down if you can.</li>
          <li>
            Have a fast-acting carb — e.g. juice, glucose tablets or regular
            soda.
          </li>
          <li>Wait 15 minutes, then check your glucose again.</li>
          <li>
            If still low, repeat. Once back in range, eat a small snack if your
            next meal is more than an hour away.
          </li>
        </ol>
      </Card>

      <Card>
        <div className="cardEyebrow" style={{ color: "#C1622B" }}>
          High blood glucose (hyper)
        </div>
        <ol className="stepsList">
          <li>Check your glucose to confirm it's high.</li>
          <li>
            Follow your care team's plan for correction insulin, if you have
            one.
          </li>
          <li>Drink water and avoid extra sugary food or drink.</li>
          <li>Recheck after the time your plan advises.</li>
        </ol>
      </Card>

      <Card>
        <div className="cardEyebrow">Get more help if…</div>
        <ul className="stepsList bulletList">
          <li>
            You feel confused, can't keep food or drink down, or can't treat a
            low yourself.
          </li>
          <li>
            You have vomiting, stomach pain, or fruity-smelling breath with a
            high reading.
          </li>
          <li>Symptoms don't improve after following the steps above.</li>
        </ul>
      </Card>

      <Card>
        <div className="rowBetween">
          <div className="cardEyebrow">Emergency contact</div>
          <Phone size={15} />
        </div>
        <div className="cardMainLine">{profile.contactName || "Not set"}</div>
        <div className="mutedSmall">
          {profile.contactNumber || "Add a contact in your profile"}
        </div>
        {profile.contactNumber && (
          <button className="btnPrimary" style={{ marginTop: 10 }}>
            Call {profile.contactName}
          </button>
        )}
      </Card>

      <p className="fineprint">
        This guidance is general and supportive information. It does not replace
        professional medical care — in a serious emergency, contact emergency
        services.
      </p>
    </div>
  );
}
