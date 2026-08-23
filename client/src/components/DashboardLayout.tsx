import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, Download, FolderKanban, LayoutDashboard, Moon, PanelLeft, Route, Sun } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar } from "./ui/sidebar";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: FolderKanban, label: "Proyectos", path: "/proyectos" },
  { icon: Route, label: "Roadmap", path: "/roadmap" },
  { icon: Activity, label: "Actividad", path: "/actividad" },
];

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, []);

  if (!prompt) return null;
  return <button className={compact ? "mobile-install-button" : "install-app-button"} onClick={async () => {
    await prompt.prompt();
    setPrompt(null);
  }} aria-label="Instalar CIR Projects"><Download className="h-4 w-4" />{!compact && <span>Instalar app</span>}</button>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SidebarProvider style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.75rem" } as CSSProperties}><DashboardLayoutContent>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const title = menuItems.find(item => location === item.path || (item.path === "/proyectos" && location.startsWith("/proyectos/")))?.label || "CIR Projects";

  return (
    <>
      {!isMobile && <Sidebar collapsible="icon" className="cir-sidebar">
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
          <InstallAppButton />
          <div className="user-block">
            <span className="personal-avatar" aria-hidden="true">N</span>
            {!isCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Naithsirc23</p><p className="truncate text-xs text-muted-foreground">Espacio personal</p></div>}
          </div>
        </SidebarFooter>
      </Sidebar>}
      <SidebarInset className="cir-main-shell">
        {isMobile && <header className="mobile-app-header"><button className="mobile-brand" onClick={() => setLocation("/")} aria-label="Ir a Overview"><span className="brand-symbol">C</span><span><b>{title}</b><small>Tu centro de proyectos</small></span></button><div className="mobile-header-actions"><InstallAppButton compact /><button className="mobile-theme-button" onClick={toggleTheme} aria-label={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}>{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button></div></header>}
        <main className="cir-main">{children}</main>
        {isMobile && <nav className="mobile-tab-bar" aria-label="Navegación principal">{menuItems.map(item => { const active = location === item.path || (item.path === "/proyectos" && location.startsWith("/proyectos/")); return <button key={item.path} className={active ? "mobile-tab active" : "mobile-tab"} onClick={() => setLocation(item.path)} aria-current={active ? "page" : undefined}><span><item.icon className="h-[19px] w-[19px]" /></span><small>{item.label}</small></button>; })}</nav>}
      </SidebarInset>
    </>
  );
}
