"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", prefix: "01" },
  { href: "/articles", label: "Artikelen", prefix: "02" },
  { href: "/rss-feeds", label: "RSS Feeds", prefix: "03" },
  { href: "/categories", label: "Categorieën", prefix: "04" },
  { href: "/prompts", label: "Prompts", prefix: "05" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-b-2 border-[#444]">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              px-8 py-3 font-[family-name:var(--font-body)] text-xs font-semibold
              uppercase tracking-widest border-r border-[#444] transition-all duration-100
              ${
                isActive
                  ? "bg-[#e8ff00] text-[#0a0a0a]"
                  : "text-[#888] hover:text-[#f5f5f0] hover:bg-[#2a2a2a]"
              }
            `}
          >
            [{item.prefix}] {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
