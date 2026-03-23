import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FamilyProvider, useFamily } from "./context/FamilyContext";
import { supabase } from "./integrations/supabase/client";
import Index from "./pages/Index";
import PersonDetail from "./pages/PersonDetail";
import JoinFamily from "./pages/JoinFamily";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;
  if (!session) return <Navigate to="/login" />;

  return <>{children}</>;
};

// New component to handle onboarding redirect
const OnboardingCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, profiles, loading } = useFamily();
  const location = useLocation();

  if (loading) return null;
  
  const profile = user ? profiles[user.id] : null;
  
  // If onboarding is not completed and we aren't already on the onboarding page
  if (user && profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FamilyProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/join" element={<JoinFamily />} />
            <Route path="/auth/confirm" element={<AuthCallback />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><OnboardingCheck><Index /></OnboardingCheck></ProtectedRoute>} />
            <Route path="/person/:id" element={<ProtectedRoute><OnboardingCheck><PersonDetail /></OnboardingCheck></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><OnboardingCheck><AdminDashboard /></OnboardingCheck></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </FamilyProvider>
  </QueryClientProvider>
);

export default App;