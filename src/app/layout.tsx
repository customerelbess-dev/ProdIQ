import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ConditionalNavbar } from "@/components/ConditionalNavbar";
import { ConditionalFooter } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProdIQ — AI Product Intelligence",
  description: "Know exactly what to sell and how to sell it before you lose money.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body
        className="relative flex min-h-full flex-col font-sans"
        style={{ background: "#040406", margin: 0 }}
      >
        <AnimatedBackground />
        <div className="relative z-[1] flex min-h-full flex-1 flex-col">
          <ConditionalNavbar />
          <div className="flex flex-1 flex-col">{children}</div>
          <ConditionalFooter />
        </div>
      </body>
    </html>
  );
}
