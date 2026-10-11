import type { Metadata } from "next";
import type { ReactNode } from "react";
import { interFont } from "../lib/fonts";
import { AppProviders } from "../providers";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "WPS - Wood Production System",
  description: "Sistem produksi kayu berbasis pesanan pelanggan",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={interFont.variable}>
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
