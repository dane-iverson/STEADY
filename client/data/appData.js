export const AGE_GROUPS = {
  child: { label: "5–12", name: "Children", tone: "child" },
  teen: { label: "13–18", name: "Adolescents", tone: "teen" },
  young_adult: { label: "19–25", name: "Young adults", tone: "adult" },
};

export const LOW = 4.0;
export const HIGH = 7.8;
export const UNIT = "mmol/L";

export const COPY = {
  child: {
    greeting: "Hi",
    dashSubtitle: "Let's check in on your day.",
    eduIntro:
      "Here's what's true about your body and your diabetes, in plain words.",
    saveMsg: "Nice! Your reading is saved.",
  },
  teen: {
    greeting: "Hey",
    dashSubtitle: "Here's where things stand today.",
    eduIntro:
      "The facts, without the lecture — for the stuff you actually deal with.",
    saveMsg: "Saved. Nice work keeping track.",
  },
  adult: {
    greeting: "Welcome back",
    dashSubtitle: "Your overview for today.",
    eduIntro:
      "Practical, evidence-based information for day-to-day management.",
    saveMsg: "Reading saved to your log.",
  },
};

export const DAILY = [
  { t: "7am", v: 5.4 },
  { t: "10am", v: 6.1 },
  { t: "1pm", v: 8.9 },
  { t: "4pm", v: 5.9 },
  { t: "7pm", v: 9.5 },
  { t: "10pm", v: 6.7 },
];

export const WEEKLY = [
  { t: "Mon", v: 6.9 },
  { t: "Tue", v: 5.7 },
  { t: "Wed", v: 8.2 },
  { t: "Thu", v: 4.8 },
  { t: "Fri", v: 6.3 },
  { t: "Sat", v: 9.1 },
  { t: "Sun", v: 6.4 },
];

export const EDUCATION = [
  {
    id: "basics",
    title: "T1DM basics",
    icon: "Droplet",
    body: "Type 1 diabetes means your pancreas makes little or no insulin. Insulin is a hormone that lets sugar (glucose) from food move out of your blood and into your cells for energy. Without it, glucose builds up in your blood, so insulin has to be replaced every day — by injection or pump.",
  },
  {
    id: "glucose",
    title: "Blood glucose management",
    icon: "TrendingUp",
    body: "Blood glucose changes throughout the day because of food, activity, stress, growth and illness. Checking regularly and writing down what you notice helps you and your care team see patterns and adjust your plan — it isn't about getting a 'perfect' number every time.",
  },
  {
    id: "insulin",
    title: "Insulin, in brief",
    icon: "Info",
    body: "Insulin doses are set by your diabetes team based on food, activity and your individual needs. This app does not calculate doses for you — always follow the plan your healthcare team has given you, and speak to them before making changes.",
  },
  {
    id: "hypo",
    title: "Hypoglycaemia (low)",
    icon: "Sunrise",
    body: "A low happens when blood glucose drops below your target range. It can cause shakiness, sweating, confusion or hunger. Treating it quickly and correctly matters — see the Emergency tab for step-by-step guidance.",
  },
  {
    id: "hyper",
    title: "Hyperglycaemia (high)",
    icon: "Sunset",
    body: "A high happens when blood glucose rises above your target range. It can develop from missed insulin, illness, stress or extra food. Persistent highs need attention — see the Emergency tab for guidance on what to do and when to get help.",
  },
  {
    id: "everyday",
    title: "Everyday self-management",
    icon: "Moon",
    body: "Small routines — checking glucose at similar times, carrying fast-acting carbs, telling people around you what to do if you go low — make daily management steadier and less overwhelming over time.",
  },
];
