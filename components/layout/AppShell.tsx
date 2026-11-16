"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // The login page has no navigation and no user to show.
  if (pathname === "/login") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 text-gray-900">{children}</div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Header menuOpen={open} onToggleMenu={() => setOpen((o) => !o)} />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar open={open} onNavigate={() => setOpen(false)} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
