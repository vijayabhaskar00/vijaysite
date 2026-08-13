import { employment, credentials, education } from "./experience";

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export const nav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Contact", href: "/contact" },
];

export const social: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/vijayabhaskarjatoth/" },
  { label: "Facebook", href: "https://www.facebook.com/vijayabhaskarofficial" },
  { label: "Behance", href: "https://www.behance.net/jatothvijayabhaskar" },
];

export interface StatEntry {
  value: string;
  label: string;
}

// Counts are derived from the actual timeline data, not hand-typed, so a
// future edit to employment/credentials/education can't silently leave a
// stale number on the homepage.
export const stats: StatEntry[] = [
  { value: "2015", label: "Board member since" },
  {
    value: String(employment.length + credentials.length + education.length),
    label: "Roles & credentials",
  },
  { value: String(education.length), label: "Academic degrees" },
  { value: "HYD", label: "Based in Telangana" },
];

export const site = {
  name: "Vijaya Bhaskar Jatoth",
  shortName: "Vijaya Bhaskar",
  tagline: "Entrepreneur & Author",
  jobTitle: "Board Member, stuMagz",
  email: "me@vijayabhaskar.in",
  baseUrl: "https://vijayabhaskar.in",
  location: "Telangana, India",
  description:
    "Vijaya Bhaskar Jatoth is an entrepreneur based in Telangana, India, serving as a board member at stuMagz (now Student Tribe) and Chief Academic Advisor for Manipal University, Karnataka. He also works as a research-focused product and experience designer.",
  photo: {
    src: "/photo.jpg",
    alt: "Portrait of Vijaya Bhaskar Jatoth",
    width: 320,
    height: 320,
  },
};
