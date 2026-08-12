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
];

export const site = {
  name: "Vijaya Bhaskar Jatoth",
  shortName: "Vijaya Bhaskar",
  tagline: "Entrepreneur & Author",
  jobTitle: "Board Member, stuMagz",
  email: "me@vijayabhaskar.in",
  baseUrl: "https://vijayabhaskar.in",
  description:
    "Vijaya Bhaskar Jatoth is an entrepreneur based in Telangana, India, serving as a board member at stuMagz and Chief Academic Advisor for Manipal University, Karnataka.",
  photo: {
    src: "/photo.jpg",
    alt: "Portrait of Vijaya Bhaskar Jatoth",
    width: 320,
    height: 320,
  },
};
