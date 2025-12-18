import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/auth/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

export default function AppLayout() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menu = [
    { to: "/dashboard", label: t("nav.dashboard") },
    { to: "/history", label: t("nav.history") },
    { to: "/results", label: t("nav.results") },
    { to: "/settings", label: t("nav.settings") },
  ];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between px-2 py-2">
            <span className="font-semibold">{t("app.title")}</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {menu.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={pathname === item.to}>
                  <NavLink to={item.to}>{item.label}</NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <Button variant="ghost" className="justify-start" onClick={handleLogout}>
            {t("nav.logout")}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <header className="flex items-center justify-between border-b bg-background px-4 py-2">
            <SidebarTrigger />
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </header>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
