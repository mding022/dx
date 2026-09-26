import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dx - Patient Diagnosis Simulations for Hack the Hill III",
  description: "A platform for simulated patient symptoms. Our submission to Hack the Hill III.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
