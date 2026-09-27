import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dx | Clinical Simulation for Medical Students",
  description: "Practice patient conversations, make a diagnosis, and learn from every case with Dx.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
