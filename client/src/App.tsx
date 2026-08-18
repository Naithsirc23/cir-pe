import DashboardLayout from "@/components/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ActivityPage from "@/pages/ActivityPage";
import NotFound from "@/pages/NotFound";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectsPage from "@/pages/ProjectsPage";
import RoadmapPage from "@/pages/RoadmapPage";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() { return <DashboardLayout><Switch><Route path="/" component={Home} /><Route path="/proyectos" component={ProjectsPage} /><Route path="/proyectos/:id" component={ProjectDetailPage} /><Route path="/roadmap" component={RoadmapPage} /><Route path="/actividad" component={ActivityPage} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></DashboardLayout>; }

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
