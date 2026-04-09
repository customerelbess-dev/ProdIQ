"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/dashboard")) {
    return null;
  }
  return <Navbar />;
}
