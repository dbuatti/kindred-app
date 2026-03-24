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

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profiles } = useFamily();
  const location = useLocation();

  // While the app is determining if we are logged in, show nothing (or a loader)
  // to prevent flickering or premature redirects
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-amber-100 rounded-full" />
          <p className="text-stone-400 font-serif italic">Opening the archive...</p>
        </div>
      </div>
    );
  }

  // If not logged in, send to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in but onboarding isn't done, send to onboarding
  const profile = profiles[user.id];
  if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Disable shortcuts on onboarding and auth pages
  const shortcutsDisabled = ['/onboarding', '/login', '/join'].includes(location.pathname);
  
  useKeyboardShortcuts([], shortcutsDisabled);
  
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
        {/* Public Routes */}
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/join" element={<PageWrapper><JoinFamily /></PageWrapper>} />
        <Route path="/auth/confirm" element={<PageWrapper><AuthCallback /></PageWrapper>} />
        
        {/* Protected Routes */}
        <Route path="/onboarding" element={<AuthGuard><PageWrapper><Onboarding /></PageWrapper></AuthGuard>} />
        <Route path="/edit-profile" element={<AuthGuard><PageWrapper><EditProfile /></PageWrapper></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><PageWrapper><Profile /></PageWrapper></AuthGuard>} />
        <Route path="/help" element={<AuthGuard><PageWrapper><Help /></PageWrapper></AuthGuard>} />
        <Route path="/tree" element={<AuthGuard><PageWrapper><FamilyTree /></PageWrapper></AuthGuard>} />
        <Route path="/complete" element={<AuthGuard><PageWrapper><CompleteArchive /></PageWrapper></AuthGuard>} />
        <Route path="/" element={<AuthGuard><PageWrapper><Index /></PageWrapper></AuthGuard>} />
        <Route path="/person/:slug" element={<AuthGuard><PageWrapper><PersonDetail /></PageWrapper></AuthGuard>} />
        <Route path="/admin" element={<AuthGuard><PageWrapper><AdminDashboard /></PageWrapper></AuthGuard>} />
        
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