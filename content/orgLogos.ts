/** Root-relative paths (under public/logos) to each organization's real,
 * officially-sourced logo mark. Organizations without a confident, lightweight
 * official source (e.g. a defunct site, or a file too heavy to ship) are
 * intentionally omitted here -- OrgMark falls back to a generated monogram
 * for any org name missing from this map. */
export const orgLogos: Record<string, string> = {
  stuMagz: "/logos/studenttribe.png",
  Microsoft: "/logos/microsoft.svg",
  Behance: "/logos/behance.svg",
  "Mahatma Gandhi Institute of Technology": "/logos/mgit.png",
  "ATAL Innovation Mission, Niti Aayog – GOI": "/logos/aim.png",
};
