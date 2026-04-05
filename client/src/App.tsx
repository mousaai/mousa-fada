import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthGate from "./components/AuthGate";
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
import VoiceDesigner from "./pages/VoiceDesigner";
import FurnitureStore from "./pages/FurnitureStore";
import CreditsDoc from "@/pages/CreditsDoc";
import PlanDesign from "@/pages/PlanDesign";
import UrbanDesign from "@/pages/UrbanDesign";
import Login from "@/pages/Login";

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
      <Route path={"/voice-designer"} component={VoiceDesigner} />
      <Route path={"/draw"} component={VoiceDesigner} />
      <Route path={"/furniture"} component={FurnitureStore} />
      <Route path={"/store"} component={FurnitureStore} />
      <Route path={"/credits-doc"} component={CreditsDoc} />
      <Route path={"/plan-design"} component={PlanDesign} />
      <Route path={"/plan"} component={PlanDesign} />
      <Route path={"/urban-design"} component={UrbanDesign} />
      <Route path={"/urban"} component={UrbanDesign} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Login} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AuthGate>
            <Toaster richColors position="top-center" />
            <Router />
            <VoiceFAB />
          </AuthGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
