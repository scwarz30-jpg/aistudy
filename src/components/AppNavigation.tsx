"use client";

import { Activity, BookOpen, Home, UserRound, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    icon: Home,
    label: "홈",
  },
  {
    href: "/meal-plan",
    icon: Utensils,
    label: "식단",
  },
  {
    href: "/check-in",
    icon: Activity,
    label: "체크",
  },
  {
    href: "/guidance",
    icon: BookOpen,
    label: "가이드",
  },
  {
    href: "/onboarding",
    icon: UserRound,
    label: "프로필",
  },
];

const hiddenPathPrefixes = ["/login", "/signup"];

export function AppNavigation() {
  const pathname = usePathname();

  if (
    pathname === "/" ||
    hiddenPathPrefixes.some((path) => pathname.startsWith(path))
  ) {
    return null;
  }

  return (
    <nav className="app-nav" aria-label="주요 메뉴">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`app-nav__link ${isActive ? "is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
