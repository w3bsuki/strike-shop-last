'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { mainNavItems } from "@/config/navigation";
import { useTranslations } from "@/lib/i18n/i18n-provider";
import Link from "next/link";

interface NavBarProps {
  className?: string;
}

export function NavBar({ className }: NavBarProps) {
  const t = useTranslations();

  return (
    <nav className={cn("hidden lg:flex items-center", className)}>
      <ul className="flex items-center gap-2">
        {mainNavItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="relative px-6 py-3 text-base font-typewriter font-semibold uppercase tracking-wide text-foreground hover:bg-black hover:text-white transition-all duration-200"
            >
              {item.titleKey ? t(item.titleKey) : item.title}
              {item.badge && (
                <span className="absolute -top-1 -right-1 text-xs font-typewriter font-semibold text-white bg-destructive px-1.5 py-0.5 rounded">
                  {item.badgeKey ? t(item.badgeKey) : item.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}