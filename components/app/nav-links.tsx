"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = { title: string; href: string; icon: LucideIcon; exact?: boolean };

const ADMIN_NAV: NavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Classes", href: "/admin/classes", icon: CalendarDays },
  { title: "People", href: "/admin/people", icon: Users },
];

const STUDENT_NAV: NavItem[] = [
  { title: "Classes", href: "/classes", icon: CalendarDays },
  { title: "Profile", href: "/profile", icon: UserRound },
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
