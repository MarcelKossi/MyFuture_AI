import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TranslationProvider } from "@/hooks/useTranslation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SecurityProvider } from "@/components/SecurityProvider";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/auth/AuthProvider";
import RequireAuth from "@/auth/RequireAuth";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/protected/Dashboard";
import OrientationHistory from "@/pages/protected/OrientationHistory";
import Results from "@/pages/protected/Results";
import Settings from "@/pages/protected/Settings";
import StartOrientation from "@/pages/protected/StartOrientation";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <SecurityProvider>
      <QueryClientProvider client={queryClient}>
        <TranslationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  <Route
                    element={
                      <RequireAuth>
                        <AppLayout />
                      </RequireAuth>
                    }
                  >
                    <Route path="/start-orientation" element={<StartOrientation />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/history" element={<OrientationHistory />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </TooltipProvider>
        </TranslationProvider>
      </QueryClientProvider>
    </SecurityProvider>
  </ErrorBoundary>
);

export default App;
