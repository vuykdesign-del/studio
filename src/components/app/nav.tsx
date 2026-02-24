"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, History } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Tracker", icon: Timer },
  { href: "/historial", label: "Historial", icon: History },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
