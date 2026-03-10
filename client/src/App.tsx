import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import Costs from "./pages/Costs";
import Projects from "./pages/Projects";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/analyze"} component={Analyze} />
      <Route path={"/costs"} component={Costs} />
      <Route path={"/projects"} component={Projects} />
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
