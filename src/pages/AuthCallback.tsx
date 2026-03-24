"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[AuthCallback] Error:", error.message);
        toast.error("Authentication failed. Please try logging in again.");
        navigate('/login');
        return;
      }

      if (session) {
        console.log("[AuthCallback] Session found, redirecting to home.");
        navigate('/');
      } else {
        console.log("[AuthCallback] No session found, redirecting to login.");
        navigate('/login');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6">
      <div className="animate-pulse flex flex-col items-center gap-6">
        <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
          <Heart className="w-10 h-10 fill-current" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-serif text-stone-800">Verifying your access...</h2>
          <p className="text-stone-400 italic">Opening the family archive.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;