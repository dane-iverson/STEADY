import React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { BackButton } from "../components/BackButton";
import { Card } from "../components/Card";

const SOURCES = [
  {
    title: "NHS: Low blood sugar (hypoglycaemia)",
    url: "https://www.nhs.uk/conditions/low-blood-sugar-hypoglycaemia/",
  },
  {
    title: "CDC: Treating low blood sugar",
    url: "https://www.cdc.gov/diabetes/treatment/treatment-low-blood-sugar-hypoglycemia.html",
  },
  {
    title: "NHS: High blood sugar (hyperglycaemia)",
    url: "https://www.nhs.uk/conditions/high-blood-sugar-hyperglycaemia/",
  },
  {
    title: "NHS: Diabetic ketoacidosis and ketone levels",
    url: "https://www.nhs.uk/conditions/diabetic-ketoacidosis/",
  },
  {
    title: "Diabetes UK: DKA warning signs",
    url: "https://www.diabetes.org.uk/about-diabetes/looking-after-diabetes/complications/diabetic-ketoacidosis",
  },
  {
    title: "Diabetes UK: Managing diabetes during illness",
    url: "https://www.diabetes.org.uk/living-with-diabetes/life-with-diabetes/illness",
  },
  {
    title: "St John Ambulance: Recovery position",
    url: "https://www.sja.org.uk/first-aid-advice/recovery-position/",
  },
  {
    title: "Western Cape Government: South African emergency numbers",
    url: "https://www.westerncape.gov.za/know-who-you-can-call-emergency",
  },
];

export function EmergencyPage({ profile, onBack }) {
  // tel: links only accept digits and a leading +.
  const dialNumber = (profile.contactNumber || "")
    .trim()
    .replace(/(?!^\+)[^\d]/g, "");
  const canDial = dialNumber.replace(/\D/g, "").length >= 3;

  function openSection(id) {
    const section = document.getElementById(id);
    section.focus({ preventScroll: true });
    section.scrollIntoView({ block: "start" });
  }

  return (
    <div className="screen emergencyScreen">
      <BackButton onClick={onBack} />
      <header className="emergencyIntro">
        <h2 className="screenTitle">Emergency &amp; safety</h2>
        <p className="screenSub">
          Recognise low or high blood glucose and know when to get help. For
          people with type 1 diabetes and anyone helping them.
        </p>
      </header>

      <section className="emergencyCritical" aria-labelledby="emergency-now">
        <div className="emergencySectionHeading">
          <ShieldAlert size={24} aria-hidden="true" />
          <div>
            <span className="emergencyEyebrow">Act immediately</span>
            <h3 id="emergency-now">Call for emergency help now</h3>
          </div>
        </div>
        <div
          className="emergencyCallActions"
          aria-label="South African emergency services"
        >
          <a className="emergencyCallPrimary" href="tel:112">
            <Phone size={18} aria-hidden="true" />
            <span>
              Call 112 <small>Mobile emergency / South Africa</small>
            </span>
          </a>
          <a className="emergencyCallSecondary" href="tel:10177">
            <Phone size={18} aria-hidden="true" />
            <span>
              Call 10177 <small>Ambulance / South Africa</small>
            </span>
          </a>
        </div>
        <ul className="stepsList bulletList">
          <li>
            <strong>Possible severe low:</strong> unconscious, having a seizure,
            not responding normally, or unable to swallow safely.
          </li>
          <li>
            <strong>Possible DKA:</strong> vomiting or stomach pain with high
            glucose, fast or deep breathing, fruity-smelling breath, marked
            drowsiness or confusion, or high ketones.
          </li>
        </ul>
        <p>
          Do not wait for a glucose or ketone test if these warning signs are
          present. Diabetic ketoacidosis (DKA) needs urgent hospital treatment.
        </p>
        <p className="emergencyCallHint">
          Give your location and say the person has diabetes. Follow the call
          handler's instructions. Do not drive yourself to hospital. These links
          open your device's dialler; Steady does not call or send
          your location automatically. Outside South Africa, use the local
          emergency number.
        </p>

        <div className="emergencySevereLow">
          <h4>If the person cannot swallow safely</h4>
          <ol className="stepsList">
            <li>
              <strong>Do not give food, drink or glucose gel by mouth.</strong>
              {" "}Do not give insulin to treat a suspected low.
            </li>
            <li>
              If unconscious but breathing normally, place them on their side
              in the recovery position. If not breathing normally, follow the
              emergency call handler's CPR instructions.
            </li>
            <li>
              For a suspected severe low, give their prescribed glucagon if
              available and you know how to use it. Follow the kit instructions
              and stay with them. Do not delay the emergency call.
            </li>
          </ol>
        </div>
      </section>

      <p className="emergencySupportNote">
        <strong>Children and teenagers:</strong> tell a parent, caregiver, teacher
        or another trusted adult immediately. Do not manage an emergency alone.
      </p>

      <nav
        className="emergencyQuickLinks"
        aria-label="Emergency guidance sections"
      >
        <button type="button" onClick={() => openSection("emergency-low")}>
          Low glucose
        </button>
        <button type="button" onClick={() => openSection("emergency-high")}>
          High glucose &amp; DKA
        </button>
        <button type="button" onClick={() => openSection("emergency-ketones")}>
          Ketone guide
        </button>
      </nav>

      <div className="emergencyGuidanceGrid">
        <Card className="emergencyLowGuidance" id="emergency-low" tabIndex={-1}>
          <div className="emergencySectionHeading">
            <ArrowDown size={22} aria-hidden="true" />
            <div>
              <span className="emergencyEyebrow">Hypoglycaemia</span>
              <h3>Low blood glucose</h3>
            </div>
          </div>
          <p className="emergencyThreshold">Usually below 4 mmol/L</p>
          <h4>Recognise it</h4>
          <p>
            Shaking, sweating, hunger, dizziness, a racing heartbeat, irritability,
            blurred vision or confusion. Lows can develop quickly; some people
            have few warning signs.
          </p>
          <h4>Only if awake and able to swallow safely</h4>
          <ol className="stepsList">
            <li>
              Stop activity, sit somewhere safe and check glucose if you can.
              Treat a suspected low promptly.
            </li>
            <li>
              Take fast-acting carbohydrate, such as glucose tablets or juice.
              A usual adult treatment is <strong>15 g carbohydrate</strong>;
              check the product label for the amount. Children may need less:
              use the amount in their diabetes team's hypo plan.
            </li>
            <li>
              <strong>Recheck after 10 to 15 minutes.</strong> If still below
              4 mmol/L, repeat fast-acting carbohydrate and check again after
              another 10 to 15 minutes.
            </li>
            <li>
              Once above 4 mmol/L and symptoms have improved, have your next meal
              or a longer-acting carbohydrate snack as your plan advises.
            </li>
          </ol>
          <p className="emergencyInlineNote">
            Diet drinks will not treat a low. Chocolate is not a good first
            treatment because fat slows sugar absorption.
          </p>
          <p className="emergencyEscalation">
            <strong>Get help:</strong> if the low is not improving with repeated
            treatment, contact your diabetes team urgently. If you become less
            alert or cannot swallow safely, someone should call emergency
            services immediately. Arrange a diabetes-team review after a severe
            low or repeated lows.
          </p>
        </Card>

        <Card className="emergencyHighGuidance" id="emergency-high" tabIndex={-1}>
          <div className="emergencySectionHeading">
            <ArrowUp size={22} aria-hidden="true" />
            <div>
              <span className="emergencyEyebrow">Hyperglycaemia</span>
              <h3>High blood glucose &amp; DKA</h3>
            </div>
          </div>
          <p className="emergencyThreshold">Above your agreed target range</p>
          <h4>Recognise it</h4>
          <p>
            Increased thirst, passing urine more often, tiredness or blurred
            vision. High glucose can follow illness, missed insulin or a pump
            problem. A brief high is not always an emergency, but lack of insulin
            can cause ketones to build up and lead to life-threatening DKA.
          </p>
          <h4>If there are no emergency warning signs</h4>
          <ol className="stepsList">
            <li>
              Check glucose.{" "}
              <strong>
                Check ketones when unwell, even if glucose is not very high
              </strong>
              , and when glucose is high as your sick-day plan advises.
            </li>
            <li>
              Follow your prescribed correction or sick-day plan. Do not stop
              insulin, even if not eating. Do not guess extra doses; contact
              your diabetes team if you do not have a plan or are unsure.
            </li>
            <li>
              Sip water or sugar-free fluids if able to swallow and keep them
              down. Water does not replace insulin or medical treatment.
            </li>
            <li>
              Recheck glucose and ketones at the intervals in your plan.
              Contact your diabetes team urgently if glucose stays high despite
              prescribed insulin, even if ketones are normal.
            </li>
          </ol>
          <p className="emergencyEscalation">
            <strong>Do not wait:</strong> vomiting, inability to keep fluids
            down, stomach pain with high glucose, fast or deep breathing,
            fruity breath, drowsiness or confusion need emergency assessment.
            Do not wait for a very high glucose number or a ketone result.
          </p>
          <p className="emergencyInlineNote">
            DKA can develop faster in children and people using insulin pumps.
          </p>
        </Card>
      </div>

      <Card className="emergencyKetoneGuide" id="emergency-ketones" tabIndex={-1}>
        <div className="emergencySectionHeading">
          <AlertTriangle size={22} aria-hidden="true" />
          <div>
            <span className="emergencyEyebrow">High glucose or illness</span>
            <h3>Blood ketones: when to get help</h3>
          </div>
        </div>
        <p>
          This NHS reference is general guidance, not a diagnosis. Follow your
          diabetes team's individual plan. Symptoms can require emergency help
          at any level.
        </p>
        <dl className="emergencyKetoneLevels">
          <div>
            <dt>Below 0.6 mmol/L</dt>
            <dd>
              Usually normal. Keep following your plan; a normal result does not
              rule out an emergency if you are seriously unwell.
            </dd>
          </div>
          <div>
            <dt>0.6 to 1.5 mmol/L</dt>
            <dd>
              Slightly raised. Retest in 2 hours. If unwell, contact your diabetes
              team urgently now.
            </dd>
          </div>
          <div className="emergencyKetoneUrgent">
            <dt>1.6 to 3.0 mmol/L</dt>
            <dd>
              Risk of DKA. Contact your diabetes team urgently now, even if you
              feel well.
            </dd>
          </div>
          <div className="emergencyKetoneCritical">
            <dt>Above 3.0 mmol/L</dt>
            <dd>
              Possible DKA. Call emergency services or go to an emergency
              department now. Do not drive yourself.
            </dd>
          </div>
        </dl>
        <p className="emergencyInlineNote">
          Urine strips use a different scale: do not compare a urine result with
          this blood-ketone guide. High urine ketones also need emergency
          assessment. If you cannot test but have DKA warning signs, get
          emergency help now. If urgent advice is unavailable or you worsen,
          seek emergency care.
        </p>
      </Card>

      <Card className="emergencyContactCard">
        <div className="emergencySectionHeading">
          <Phone size={22} aria-hidden="true" />
          <h3>Your support contact</h3>
        </div>
        <p>
          Let someone you trust know. This is not a substitute for emergency
          services.
        </p>
        <p className="emergencyContactName">
          {profile.contactName || "No contact saved"}
        </p>
        <p className="mutedSmall">
          {profile.contactNumber || "Add a support contact in your medical profile."}
        </p>
        {canDial && (
          <a
            className="btnGhost callButton"
            href={`tel:${dialNumber}`}
            aria-label={`Call ${profile.contactName || "support contact"} on ${profile.contactNumber}`}
          >
            <Phone size={16} aria-hidden="true" />
            Call {profile.contactName || "support contact"}
          </a>
        )}
      </Card>

      <details className="emergencySources">
        <summary>Sources &amp; guidance limits</summary>
        <p>
          Sources checked 29 October 2026. General first-aid information, not a
          personalised treatment plan or a clinician-reviewed protocol for
          this app. A qualified diabetes clinician should review this guidance
          before real-world care reliance.
        </p>
        <ul>
          {SOURCES.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title} <ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </details>
      <p className="emergencyDisclaimer">
        Steady cannot monitor symptoms, diagnose an emergency or summon help.
        Opening or reloading this page and following source links may require
        internet access. Phone calls require a working phone connection.
      </p>
    </div>
  );
}
