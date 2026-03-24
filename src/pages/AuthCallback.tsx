"use client";

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as any;
      const next = searchParams.get('next') || '/';

      try {
        // 1. If we have a token_hash (from custom email templates), verify it
        if (tokenHash && type) {
          console.log("[AuthCallback] Verifying OTP with token_hash...");
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type,
          });
          if (error) throw error;
        }

        // 2. Check if we now have a session (either from verifyOtp or automatic PKCE exchange)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session) {
          console.log("[AuthCallback] Session confirmed, entering archive.");
          // Small delay to ensure session is persisted to storage
          setTimeout(() => navigate(next, { replace: true }), 500);
        } else {
          // If no session after verification, something went wrong
          console.warn("[AuthCallback] No session found after verification.");
          toast.error("Session could not be established. Please try logging in again.");
          navigate('/login', { replace: true });
        }
      } catch (error: any) {
        console.error("[AuthCallback] Error:", error.message);
        toast.error("Authentication failed: " + error.message);
        navigate('/login', { replace: true });
      }
    };

    handleAuth();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="h-24 w-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 animate-pulse">
            <Heart className="w-12 h-12 fill-current" />
          </div>
          <div className="absolute inset-0 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-serif font-bold text-stone-800">Verifying your access...</h2>
          <p className="text-stone-400 italic text-lg">Opening the family archive.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;