import { Baloo_2, Nunito } from "next/font/google";

export const baloo2 = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700", "800"],
});

export const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
