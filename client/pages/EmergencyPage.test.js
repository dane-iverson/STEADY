import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let server;
let EmergencyPage;

before(async () => {
  server = await createServer({
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
  ({ EmergencyPage } = await server.ssrLoadModule(
    "/client/pages/EmergencyPage.jsx",
  ));
});

after(async () => {
  await server?.close();
});

function render(profile = {}) {
  return renderToStaticMarkup(
    React.createElement(EmergencyPage, { profile, onBack() {} }),
  );
}

test("severe-emergency warnings and emergency calls precede routine treatment", () => {
  const html = render();
  const emergency = html.indexOf('id="emergency-now"');
  const severe = html.indexOf("Do not give food, drink or glucose gel by mouth.");
  const routine = html.indexOf('id="emergency-low"');
  assert.ok(emergency >= 0 && emergency < severe && severe < routine);
  assert.ok(html.indexOf('href="tel:112"') < routine);
  assert.ok(html.indexOf('href="tel:10177"') < routine);
  assert.match(html, /unconscious, having a seizure/);
  assert.match(html, /not responding normally, or unable to swallow safely/);
  assert.match(html, /breathing normally, place them on their side/);
  assert.match(html, /not breathing normally, follow the/);
  assert.match(html, /prescribed glucagon/);
  assert.match(html, /Do not delay the emergency call/);
});

test("low-glucose guidance distinguishes swallowing safety and children's treatment", () => {
  const html = render();
  assert.match(html, /Only if awake and able to swallow safely/);
  assert.match(html, /Usually below 4 mmol\/L/);
  assert.match(html, /15 g carbohydrate/);
  assert.match(html, /Children may need less/);
  assert.match(html, /Recheck after 10 to 15 minutes/);
  assert.match(html, /If still below 4 mmol\/L/);
  assert.match(html, /Once above 4 mmol\/L and symptoms have improved/);
  assert.match(html, /low is not improving with repeated/);
});

test("high-glucose and ketone guidance escalates symptoms independently of readings", () => {
  const html = render();
  assert.match(html, /Check ketones when unwell, even if glucose/);
  assert.match(html, /Do not stop/);
  assert.match(html, /insulin, even if not eating/);
  assert.match(html, /Do not guess extra doses/);
  assert.match(html, /even if ketones are normal/);
  assert.match(html, /Do not wait for a very high glucose number or a ketone result/);
  for (const range of [
    "Below 0.6 mmol/L",
    "0.6 to 1.5 mmol/L",
    "1.6 to 3.0 mmol/L",
    "Above 3.0 mmol/L",
  ]) {
    assert.ok(html.includes(`<dt>${range}</dt>`), range);
  }
  assert.match(html, /Retest in 2 hours/);
  assert.match(html, /even if you/);
  assert.match(html, /feel well/);
  assert.match(html, /Urine strips use a different scale/);
  assert.match(html, /If you cannot test but have DKA warning signs/);
});

test("emergency numbers stay separate from the optional saved support contact", () => {
  const empty = render();
  assert.equal((empty.match(/href="tel:/g) || []).length, 2);
  assert.match(empty, /No contact saved/);
  assert.match(empty, /not a substitute for emergency services/);
  const saved = render({
    contactName: "Support person",
    contactNumber: "+27 (82) 123-4567",
  });
  assert.match(saved, /href="tel:\+27821234567"/);
  assert.match(saved, /Call Support person/);
  assert.equal(
    (render({ contactNumber: "not a number" }).match(/href="tel:/g) || []).length,
    2,
  );
});

test("guidance includes authoritative sources and honest capability limits", () => {
  const html = render();
  assert.match(html, /Sources checked 29 October 2026/);
  for (const domain of [
    "www.nhs.uk",
    "www.cdc.gov",
    "www.diabetes.org.uk",
    "www.westerncape.gov.za",
    "www.sja.org.uk",
  ]) {
    assert.ok(html.includes(`href="https://${domain}/`), domain);
  }
  assert.match(html, /not a/);
  assert.match(html, /clinician-reviewed protocol/);
  assert.match(html, /does not call or send/);
  assert.match(html, /may require/);
  assert.doesNotMatch(html, /Always available|even offline/);
  assert.doesNotMatch(html, /href="#emergency-/);
});

test("personal chart colour ranges do not change first-aid reference thresholds", () => {
  assert.equal(
    render({
      glucoseRanges: { veryLowMax: 1, lowMax: 2, targetMax: 20, highMax: 30 },
    }),
    render(),
  );
});

test("recovery illustration is local, accessible and accompanied by safety and licence text", () => {
  const html = render();
  const start = html.indexOf('<figure class="emergencyRecoveryFigure">');
  const end = html.indexOf("</figure>", start);
  assert.ok(start > html.indexOf("Do not delay the emergency call"));
  const figure = html.slice(start, end);
  assert.match(figure, /Only for someone unconscious but breathing normally/);
  assert.match(figure, /CPR instructions instead/);
  assert.match(figure, /src="\/client\/assets\/recovery-position.svg"/);
  assert.match(figure, /width="650" height="250"/);
  assert.match(figure, /alt="A person lying on their side/);
  assert.match(figure, /Recovery position by Rama/);
  assert.match(figure, /Background removed by Mrmw; used here unchanged/);
  assert.match(figure, /https:\/\/commons.wikimedia.org\/wiki\/File:Recovery_position.svg/);
  assert.match(figure, /https:\/\/creativecommons.org\/licenses\/by-sa\/3.0\/fr\//);
});

test("recovery guidance explains airway protection, positioning and continuing observation", () => {
  const html = render();
  const figure = html.slice(
    html.indexOf('<figure class="emergencyRecoveryFigure">'),
    html.indexOf("</figure>"),
  );
  assert.match(figure, /Why use it\?/);
  assert.match(figure, /tongue to block the airway/);
  assert.match(figure, /helps keep the airway open/);
  assert.match(figure, /drain out of the mouth/);
  assert.match(figure, /does not treat low blood glucose/);
  assert.match(figure, /Arm and hand:/);
  assert.match(figure, /Leg and side:/);
  assert.match(figure, /hip and knee are bent at right angles/);
  assert.match(figure, /Head and airway:/);
  assert.match(figure, /tilt the head back and lift the chin/);
  assert.match(figure, /Stay and check:/);
  assert.match(figure, /breathing stops or becomes abnormal/);
  assert.match(figure, /Possible neck or back injury\?/);
  assert.match(html, /https:\/\/www.redcross.org.uk\/first-aid\/learn-first-aid\/unresponsive-and-breathing/);
});
