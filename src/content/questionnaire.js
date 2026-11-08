// ─────────────────────────────────────────────────────────────
//  Strengths and Difficulties Questionnaire
//  Answers are sent straight into the existing Google Form, so they
//  still appear under "Responses" in Google Forms as before.
//
//  The "entry" numbers come from the Google Form itself. If a question
//  is added to the Google Form, its entry number must be added here.
// ─────────────────────────────────────────────────────────────
window.QUESTIONNAIRE = {
  action:
    "https://docs.google.com/forms/d/e/1FAIpQLSet3-AtiKHTWfMbUWwl3DG3R89cgJ3m88bSDi_w_gSDhLpGjQ/formResponse",
  original:
    "https://docs.google.com/forms/d/e/1FAIpQLSet3-AtiKHTWfMbUWwl3DG3R89cgJ3m88bSDi_w_gSDhLpGjQ/viewform",

  intro:
    "Please answer based on your child's behaviour over the last six months or this school year. " +
    "For each statement, choose the one answer that fits best. Everything you share is kept confidential.",

  parentPhone: { entry: "entry.1685270148", label: "Your cellphone number (parent)", required: false },
  childName: { entry: "entry.1449005772", label: "Name of child", required: true },
  gender: { entry: "entry.1431601660", label: "Is your child…", options: ["Male", "Female"], required: true },
  // Google Forms date fields are sent as three parts: _year, _month, _day
  birthDate: { entry: "entry.1688173688", label: "Date of birth", required: true },
  comments: { entry: "entry.1369130152", label: "Do you have any other comments or concerns?", required: true },

  // The three answers must match the Google Form exactly.
  scale: ["Not True", "Somewhat True", "Certainly True"],
  scaleLabels: ["Not true", "Somewhat true", "Certainly true"],

  statements: [
    ["entry.1124475589", "Considerate of other people's feelings"],
    ["entry.929011326", "Restless, overactive, cannot stay still for long"],
    ["entry.1584962025", "Often complains of headaches, stomach-aches or sickness"],
    ["entry.1813129000", "Shares readily with other children (treats, toys, pencils etc)"],
    ["entry.1358825648", "Often has temper tantrums or hot tempers"],
    ["entry.434880695", "Rather solitary, tends to play alone"],
    ["entry.1428608795", "Generally obedient, usually does what adults request"],
    ["entry.61084595", "Many worries, often seems worried"],
    ["entry.2062155501", "Helpful if someone is hurt, upset or feeling ill"],
    ["entry.184163131", "Constantly fidgeting or squirming"],
    ["entry.294187485", "Has at least one good friend"],
    ["entry.359228446", "Often fights with other children or bullies them"],
    ["entry.453471996", "Often unhappy, down-hearted or tearful"],
    ["entry.588194494", "Generally liked by other children"],
    ["entry.2097577449", "Easily distracted, concentration wanders"],
    ["entry.194996675", "Nervous or clingy in new situations, easily loses confidence"],
    ["entry.374908750", "Kind to younger children"],
    ["entry.770584714", "Often lies or cheats"],
    ["entry.1080032664", "Picked on or bullied by other children"],
    ["entry.1268204758", "Often volunteers to help others (parents, teachers, other children)"],
    ["entry.1494028861", "Thinks things out before acting"],
    ["entry.1486467019", "Steals from home, school or elsewhere"],
    ["entry.1338242455", "Gets on better with adults than with other children"],
    ["entry.920900883", "Many fears, easily scared"],
    ["entry.1511336142", "Sees tasks through to the end, good attention span"],
  ],
  perStep: 5,

  thanks: {
    title: "Thank you for taking the time to fill in the questionnaire.",
    body: "I will get back to you as soon as I can with feedback and more information.",
    signoff: "Kind regards, Letitia",
  },
};
