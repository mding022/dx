import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dx · Clinical practice",
  description: "A calm space for clinical simulation and diagnostic practice.",
  icons: { icon: "/dx-transparent.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
