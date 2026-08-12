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
    src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjRFLi46ZHKuD1dGXQUXzrZrZvD_z263NiVUh3vTqe7aa9868W_QJXtYgy0NPtZfiY6hOHzRSqNAvrK36kKQNjgg5Wc8yA3U-ZlYPqPd3grM8xWa6h6EifLsjTBaNjp9vVt-TjaKWdwkbg/s320/IMG_20161016_011116.jpg",
    alt: "Portrait of Vijaya Bhaskar Jatoth",
    width: 320,
    height: 320,
  },
};
