"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Props {
  right?: React.ReactNode;
}

export function NavBar({ right }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/shots") return pathname === "/shots" || pathname === "/shot";
    return pathname === href;
  }

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/shots", label: "All Shots" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <header className="border-b bg-background px-6 h-14 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold mr-3 select-none">Square Stats</span>
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={[
              "px-3 py-1.5 rounded-md text-sm transition-colors",
              isActive(href)
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}
