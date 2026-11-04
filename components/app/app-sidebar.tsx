import { QrCodeIcon } from "@phosphor-icons/react/ssr";
import { NavLinks } from "@/components/app/nav-links";
import { UserMenu } from "@/components/app/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { CurrentUser } from "@/lib/dal";

export function AppSidebar({ user }: { user: CurrentUser }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <QrCodeIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-heading text-xl leading-none tracking-tight">ExLENT Program</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {user.role === "ADMIN" ? "Admin" : "Student"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavLinks role={user.role} />
      </SidebarContent>
      <SidebarFooter>
        <UserMenu
          id={user.id}
          name={user.name}
          email={user.email}
          image={user.image}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
