export interface TimelineEntry {
  period: string;
  org: string;
  role: string;
  description: string;
}

export const employment: TimelineEntry[] = [
  {
    period: "2015 — Present",
    org: "stuMagz",
    role: "Board Member",
    description:
      "Appointed Executive Chairman of the board. Chief Academic Advisor for Manipal University, Karnataka.",
  },
  {
    period: "2009 — 2011",
    org: "Tsearch.in",
    role: "Marketing Manager",
    description:
      "Developed marketing strategy in line with company objectives, coordinated marketing campaigns with sales activities, and managed the marketing budget.",
  },
];

export const credentials: TimelineEntry[] = [
  {
    period: "2019",
    org: "ATAL Innovation Mission, Niti Aayog – GOI",
    role: "Mentor of Change",
    description:
      "Supports and reviews school-level innovation projects, giving feedback to management and students to improve outcomes.",
  },
  {
    period: "2015",
    org: "Microsoft",
    role: "SharePoint Developer",
    description: "Developed and implemented SharePoint-based solutions.",
  },
];
