import localFont from "next/font/local";

export const interFont = localFont({
  src: "../../public/fonts/inter/Inter-Variable.woff2",
  display: "swap",
  variable: "--font-inter",
  weight: "100 900",
});
