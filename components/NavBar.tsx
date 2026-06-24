"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionSwitcher } from "@/components/SessionSwitcher";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/contexts/SessionContext";

interface Props {
  right?: React.ReactNode;
}

export function NavBar({ right }: Props) {
  const pathname = usePathname();
  const { analysis, hideOutliers, setHideOutliers } = useSession();

  function isActive(href: string) {
    if (href === "/shots") return pathname === "/shots" || pathname === "/shot";
    if (href === "/bag") return pathname === "/bag";
    if (href === "/compare") return pathname === "/compare";
    return pathname === href;
  }

  const links = [
    { href: "/", label: "Dashboard", short: "Dash" },
    { href: "/shots", label: "All Shots", short: "Shots" },
    { href: "/bag", label: "Bag Gapping", short: "Bag" },
    { href: "/compare", label: "Compare", short: "Compare" },
    { href: "/profile", label: "Settings", short: "Settings" },
  ];

  return (
    <header className="border-b bg-background px-3 sm:px-6 h-14 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
        {links.map(({ href, label, short }) => (
          <Link
            key={href}
            href={href}
            className={[
              "px-2 sm:px-3 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap",
              isActive(href)
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            ].join(" ")}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{short}</span>
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {analysis && analysis.outlierIndices.size > 0 && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span
              className={[
                "hidden sm:inline text-xs transition-colors",
                hideOutliers ? "text-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              Hide outliers
              {hideOutliers && (
                <span className="ml-1 tabular-nums">({analysis.outlierIndices.size})</span>
              )}
            </span>
            <Switch checked={hideOutliers} onCheckedChange={setHideOutliers} />
          </label>
        )}
        <SessionSwitcher />
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}
