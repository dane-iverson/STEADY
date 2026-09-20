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
  {
    id: "food-nutrition",
    title: "Food & nutrition",
    icon: "BookOpen",
    audience: "all",
    body: "Food affects blood glucose, energy and mood. Learn how regular meals, carbohydrates, hydration and flexible planning can fit into your care plan. Your diabetes team can help you understand portions and insulin timing without turning food into a list of rules.",
  },
  {
    id: "exercise-activity",
    title: "Exercise & physical activity",
    icon: "TrendingUp",
    audience: "all",
    body: "Movement can change glucose during activity and for several hours afterwards. Check your care plan for when to monitor, carry fast-acting carbohydrate and adjust food or insulin. Start gradually and ask your care team about activities that are new to you.",
  },
  {
    id: "diabetes-technology",
    title: "Diabetes technology",
    icon: "Droplet",
    audience: "all",
    body: "Meters, continuous glucose monitors, pumps and apps can make patterns easier to notice. Technology supports your decisions, but readings and alerts still need context. Keep a backup plan for supplies, batteries and access to your care team.",
  },
  {
    id: "sickness-illness",
    title: "Sickness & illness",
    icon: "Sunrise",
    audience: "all",
    body: "Illness can raise or lower glucose even when you are eating less. Follow your personal sick-day plan, keep monitoring and stay hydrated. Contact your diabetes team promptly if you cannot keep fluids down, have ketones or are unsure what to do.",
  },
  {
    id: "mental-wellbeing",
    title: "Mental & emotional well-being",
    icon: "Moon",
    audience: "all",
    body: "Living with diabetes can be tiring and stressful. Feeling frustrated does not mean you are failing. Small routines, honest conversations and support from family, friends or a professional can make care feel more manageable.",
  },
  {
    id: "checkups-appointments",
    title: "Diabetes check-ups & appointments",
    icon: "Info",
    audience: "all",
    body: "Regular appointments are a chance to review patterns, growth, wellbeing, medicines, technology and practical questions. Bring your readings or device, note concerns beforehand and ask for explanations that make sense to you.",
  },
  {
    id: "school",
    title: "Diabetes at school",
    icon: "BookOpen",
    audience: "child",
    body: "A written school plan can help teachers and staff know how to support glucose checks, meals, insulin, activity and lows. Children should know which trusted adults to ask for help and should never feel they have to manage an emergency alone.",
  },
  {
    id: "growing-up",
    title: "Growing up with T1DM",
    icon: "Sunrise",
    audience: "child",
    body: "Growing bodies can change insulin needs, appetite, activity and emotions. Care responsibilities can gradually be shared between children, caregivers and the diabetes team in a way that builds confidence without removing support too quickly.",
  },
  {
    id: "parents-caregivers",
    title: "Parents & caregivers",
    icon: "Users",
    audience: "child",
    body: "Caregivers can support routines while helping a child feel included rather than defined by diabetes. Agree on simple plans for school, sleepovers, sport and emergencies, and make room for the child's questions and feelings.",
  },
  {
    id: "puberty",
    title: "Diabetes & puberty",
    icon: "Sunrise",
    audience: "teen",
    body: "Hormonal changes during puberty can make glucose patterns less predictable and insulin needs may change. This is a normal development stage, not a personal failure. Share changes with your diabetes team so your plan can keep up.",
  },
  {
    id: "school-exams",
    title: "Diabetes & school or exams",
    icon: "BookOpen",
    audience: "teen",
    body: "Plan ahead for exams, deadlines and changing routines. Tell the school what support you need, keep supplies nearby and ask about reasonable arrangements if glucose or treatment affects concentration.",
  },
  {
    id: "independence",
    title: "Independence & responsibility",
    icon: "TrendingUp",
    audience: "teen",
    body: "Independence develops step by step. Practise checking supplies, recognising patterns, explaining your care and knowing when to involve an adult or your healthcare team. Support can remain available while responsibility grows.",
  },
  {
    id: "friends-relationships",
    title: "Friends, relationships & social life",
    icon: "Users",
    audience: "teen",
    body: "You decide how much to share and with whom. A trusted friend can learn how to recognise and respond to a low. Diabetes does not prevent friendships or relationships, and the right people will respect your needs.",
  },
  {
    id: "alcohol-recreation-teen",
    title: "Diabetes, alcohol & recreational activities",
    icon: "ShieldAlert",
    audience: "teen",
    body: "Alcohol and recreational substances can affect judgement, food intake and glucose, and can hide warning signs of a low. Talk honestly with your healthcare team about risk reduction and never manage a concerning situation alone.",
  },
  {
    id: "body-image",
    title: "Body image",
    icon: "User",
    audience: "teen",
    body: "Changes in your body, devices and injection sites can affect confidence. Your body deserves care rather than criticism. Speak with someone you trust if worries about weight, eating or appearance start affecting your health.",
  },
  {
    id: "independent-management",
    title: "Managing diabetes independently",
    icon: "TrendingUp",
    audience: "young_adult",
    body: "Independent management includes planning supplies, prescriptions, appointments, meals, activity and sick days. Build systems that fit your real routine and keep a backup plan for disruptions.",
  },
  {
    id: "university-work",
    title: "University & work",
    icon: "BookOpen",
    audience: "young_adult",
    body: "New schedules, shifts and living arrangements can change diabetes routines. Identify practical support, tell the people who need to know and keep treatment supplies accessible during study or work.",
  },
  {
    id: "alcohol-social-life",
    title: "Alcohol & social life",
    icon: "ShieldAlert",
    audience: "young_adult",
    body: "Alcohol can affect glucose for many hours and may make low symptoms harder to notice. Follow your personal plan, eat as advised, carry treatment for lows and make sure someone trusted knows how to help.",
  },
  {
    id: "driving",
    title: "Driving and diabetes",
    icon: "Info",
    audience: "young_adult",
    body: "Safe driving means knowing your local requirements, checking glucose as advised and carrying supplies. Do not drive if you are low or impaired, and follow the treatment and recheck steps in your care plan.",
  },
  {
    id: "relationships-sexual-health",
    title: "Relationships & sexual health",
    icon: "Users",
    audience: "young_adult",
    body: "Diabetes can be part of honest conversations about intimacy, contraception, fertility and wellbeing. Your healthcare team can offer confidential, practical advice and help you plan care around your goals.",
  },
  {
    id: "travel",
    title: "Travel & diabetes",
    icon: "Moon",
    audience: "young_adult",
    body: "Travel planning may include extra supplies, prescriptions, storage, time-zone changes, insurance and a letter for security checks. Keep essential treatment in your hand luggage and ask your team about the trip you are planning.",
  },
  {
    id: "transition-adult-care",
    title: "Healthcare & transition to adult care",
    icon: "Info",
    audience: "young_adult",
    body: "Moving to adult care is a process, not a single appointment. Keep a record of your medicines, devices, targets, contacts and questions. Make sure you know how to book follow-up care and request supplies in your new service.",
  },
];
