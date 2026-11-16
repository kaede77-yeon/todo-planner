"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export default function Sidebar({ open, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside
      id="sidebar"
      className={`${open ? "block" : "hidden"} border-b border-gray-200 bg-white md:block md:w-56 md:shrink-0 md:border-b-0 md:border-r`}
    >
      <nav aria-label="주 메뉴" className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
