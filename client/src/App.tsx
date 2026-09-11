import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Corridors from "./pages/Corridors";
import WorkOrders from "./pages/WorkOrders";
import Analytics from "./pages/Analytics";
import Scenarios from "./pages/Scenarios";
import CoaSanction from "./pages/CoaSanction";
import SignalManagement from "./pages/SignalManagement";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/corridors" component={Corridors} />
      <Route path="/work-orders" component={WorkOrders} />
      <Route path="/signals" component={SignalManagement} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/scenarios" component={Scenarios} />
      <Route path="/coa-sanction" component={CoaSanction} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
