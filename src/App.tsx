import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FamilyProvider, useFamily } from "./context/FamilyContext";
import { supabase } from "./integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import Index from "./pages/Index";
import PersonDetail from "./pages/PersonDetail";
import JoinFamily from "./pages/JoinFamily";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import Onboarding from "./pages/Onboarding";
import EditProfile from "./pages/EditProfile";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import CompleteArchive from "./pages/CompleteArchive";
import FamilyTree from "./pages/FamilyTree";
import DataExportButton from "./components/DataExportButton";
import ShortcutHelpDialog from "./components/ShortcutHelpDialog";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

const OnboardingCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, profiles, loading } = useFamily();
  const location = useLocation();

  if (loading) return null;
  
  const profile = user ? profiles[user.id] : null;
  
  if (user && profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  // Initialize global shortcuts
  useKeyboardShortcuts();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/join" element={<PageWrapper><JoinFamily /></PageWrapper>} />
        <Route path="/auth/confirm" element={<PageWrapper><AuthCallback /></PageWrapper>} />
        <Route path="/onboarding" element={<ProtectedRoute><PageWrapper><Onboarding /></PageWrapper></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><PageWrapper><EditProfile /></PageWrapper></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><PageWrapper><Help /></PageWrapper></ProtectedRoute>} />
        <Route path="/tree" element={<ProtectedRoute><OnboardingCheck><PageWrapper><FamilyTree /></PageWrapper></OnboardingCheck></ProtectedRoute>} />
        <Route path="/complete" element={<ProtectedRoute><OnboardingCheck><PageWrapper><CompleteArchive /></PageWrapper></OnboardingCheck></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><OnboardingCheck><PageWrapper><Index /></PageWrapper></OnboardingCheck></ProtectedRoute>} />
        <Route path="/person/:slug" element={<ProtectedRoute><OnboardingCheck><PageWrapper><PersonDetail /></PageWrapper></OnboardingCheck></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><OnboardingCheck><PageWrapper><AdminDashboard /></PageWrapper></OnboardingCheck></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FamilyProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnimatedRoutes />
          <DataExportButton />
          <ShortcutHelpDialog />
        </BrowserRouter>
      </TooltipProvider>
    </FamilyProvider>
  </QueryClientProvider>
);

export default App;