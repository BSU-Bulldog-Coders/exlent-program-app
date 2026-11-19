"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, CalendarDotsIcon, CodeIcon, FolderSimpleIcon, SquaresFourIcon, TrophyIcon, UserIcon, UsersIcon, type Icon } from "@phosphor-icons/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = { title: string; href: string; icon: Icon; exact?: boolean };

const ADMIN_NAV: NavItem[] = [
  { title: "Home", href: "/", icon: BellIcon, exact: true },
  { title: "Overview", href: "/admin", icon: SquaresFourIcon, exact: true },
  { title: "Classes", href: "/admin/classes", icon: CalendarDotsIcon },
  { title: "Exercises", href: "/exercises", icon: CodeIcon },
  { title: "Resources", href: "/resources", icon: FolderSimpleIcon },
  { title: "Leaderboard", href: "/leaderboard", icon: TrophyIcon },
  { title: "People", href: "/admin/people", icon: UsersIcon },
];

const STUDENT_NAV: NavItem[] = [
  { title: "Home", href: "/", icon: BellIcon, exact: true },
  { title: "Classes", href: "/classes", icon: CalendarDotsIcon },
  { title: "Exercises", href: "/exercises", icon: CodeIcon },
  { title: "Resources", href: "/resources", icon: FolderSimpleIcon },
  { title: "Leaderboard", href: "/leaderboard", icon: TrophyIcon },
  { title: "Profile", href: "/profile", icon: UserIcon },
];

export function NavLinks({ role }: { role: "ADMIN" | "STUDENT" }) {
  const pathname = usePathname();
  const items = role === "ADMIN" ? ADMIN_NAV : STUDENT_NAV;

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
