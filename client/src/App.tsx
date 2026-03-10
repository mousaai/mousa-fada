import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { VoiceFAB } from "./components/VoiceFAB";
import Analyze from "./pages/Analyze";
import Costs from "./pages/Costs";
import Projects from "./pages/Projects";
import DesignStudio from "./pages/DesignStudio";
import SarahChat from "./pages/SarahChat";
import ProjectDetail from "./pages/ProjectDetail";
import ARScan from "./pages/ARScan";
import MoodBoard from "./pages/MoodBoard";
import QuickAnalyze from "./pages/QuickAnalyze";
import DesignIdeas from "./pages/DesignIdeas";
import SmartCapture from "./pages/SmartCapture";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/analyze"} component={Analyze} />
      <Route path={"/quick"} component={QuickAnalyze} />
      <Route path={"/costs"} component={Costs} />
      <Route path={"/projects"} component={Projects} />
      <Route path={"/projects/:id"} component={ProjectDetail} />
      <Route path={"/design-studio"} component={DesignStudio} />
      <Route path={"/studio"} component={DesignStudio} />
      <Route path={"/sarah-chat"} component={SarahChat} />
      <Route path={"/chat"} component={SarahChat} />
      <Route path={"/ar-scan"} component={ARScan} />
      <Route path={"/mood-board"} component={MoodBoard} />
      <Route path={"/moodboard"} component={MoodBoard} />
      <Route path={"/design-ideas"} component={DesignIdeas} />
      <Route path={"/ideas"} component={DesignIdeas} />
      <Route path={"/smart-capture"} component={SmartCapture} />
      <Route path={"/capture"} component={SmartCapture} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
          <VoiceFAB />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
