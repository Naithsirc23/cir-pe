import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AccessNotice } from "@/components/AccessNotice";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, FolderKanban, LayoutDashboard, LogIn, LogOut, Moon, PanelLeft, Route, Sun } from "lucide-react";
import type { CSSProperties } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar } from "./ui/sidebar";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: FolderKanban, label: "Proyectos", path: "/proyectos" },
  { icon: Route, label: "Roadmap", path: "/roadmap" },
  { icon: Activity, label: "Actividad", path: "/actividad" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SidebarProvider style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.75rem" } as CSSProperties}><DashboardLayoutContent>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const title = menuItems.find(item => location === item.path || (item.path === "/proyectos" && location.startsWith("/proyectos/")))?.label || "CIR Projects";

  return (
    <>
      <Sidebar collapsible="icon" className="cir-sidebar">
        <SidebarHeader className="cir-sidebar-header">
          <div className="flex w-full items-center gap-2.5">
            <button className="brand-lockup" onClick={() => setLocation("/")} aria-label="Ir a Overview">
              <span className="brand-symbol">C</span>
              {!isCollapsed && <span className="brand-name">CIR <em>Projects</em></span>}
            </button>
            <button onClick={toggleSidebar} className="sidebar-collapse" aria-label="Contraer navegación"><PanelLeft className="h-4 w-4" /></button>
          </div>
        </SidebarHeader>
        <SidebarContent className="cir-sidebar-content">
          <p className="sidebar-section-label group-data-[collapsible=icon]:hidden">ESPACIO DE TRABAJO</p>
          <SidebarMenu className="px-2">
            {menuItems.map(item => {
              const active = location === item.path || (item.path === "/proyectos" && location.startsWith("/proyectos/"));
              return <SidebarMenuItem key={item.path}>
                <SidebarMenuButton isActive={active} onClick={() => setLocation(item.path)} tooltip={item.label} className="cir-nav-button">
                  <item.icon className="h-[18px] w-[18px]" /><span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>;
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="cir-sidebar-footer">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="theme-toggle" onClick={toggleTheme} aria-label={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}>
                <span className="theme-toggle-icon">{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</span>
                {!isCollapsed && <span>{theme === "light" ? "Modo oscuro" : "Modo claro"}</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Cambiar tema</TooltipContent>
          </Tooltip>
          <div className="user-block">
            {loading ? <div className="user-loading" /> : user ? <>
              <Avatar className="h-9 w-9 border border-sidebar-border"><AvatarFallback>{user.name?.charAt(0).toUpperCase() || "N"}</AvatarFallback></Avatar>
              {!isCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.name || "Naithsirc23"}</p><p className="truncate text-xs text-muted-foreground">Espacio personal</p></div>}
              {!isCollapsed && <button onClick={logout} className="sidebar-signout" aria-label="Cerrar sesión"><LogOut className="h-4 w-4" /></button>}
            </> : <>
              <Avatar className="h-9 w-9 border border-sidebar-border"><AvatarFallback>N</AvatarFallback></Avatar>
              {!isCollapsed && <button onClick={() => startLogin()} className="sidebar-login">Iniciar sesión <LogIn className="h-3.5 w-3.5" /></button>}
            </>}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="cir-main-shell">
        {isMobile && <header className="mobile-header"><button className="mobile-trigger" onClick={toggleSidebar} aria-label="Abrir navegación"><PanelLeft className="h-5 w-5" /></button><span>{title}</span></header>}
        <main className="cir-main">{loading ? <div className="loading-state min-h-[65vh]">Cargando tu espacio de trabajo...</div> : user ? children : <AccessNotice />}</main>
      </SidebarInset>
    </>
  );
}
