"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionSwitcher } from "@/components/SessionSwitcher";

interface Props {
  right?: React.ReactNode;
}

export function NavBar({ right }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/shots") return pathname === "/shots" || pathname === "/shot";
    if (href === "/bag") return pathname === "/bag";
    if (href === "/compare") return pathname === "/compare";
    return pathname === href;
  }

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/shots", label: "All Shots" },
    { href: "/bag", label: "Bag Gapping" },
    { href: "/compare", label: "Compare" },
    { href: "/profile", label: "Settings" },
  ];

  return (
    <header className="border-b bg-background px-6 h-14 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-1">
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
        <SessionSwitcher />
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}
