"use client";

import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as any;
      const next = searchParams.get('next') || '/';

      console.log("[AuthCallback] Starting verification...", { type, hasToken: !!tokenHash });

      try {
        // 1. Verify the OTP token if present (from custom email templates)
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type,
          });
          if (error) throw error;
          console.log("[AuthCallback] OTP verified successfully.");
        }

        // 2. Double check we have a session now
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          console.log("[AuthCallback] Session established for:", session.user.email);
          toast.success("Welcome back to the archive!");
          
          // Small delay to ensure Supabase internal state and Context sync up
          setTimeout(() => {
            navigate(next, { replace: true });
          }, 800);
        } else {
          // If no session and no token, we might have landed here by mistake
          if (!tokenHash) {
            console.warn("[AuthCallback] No session or token found. Redirecting to login.");
            navigate('/login', { replace: true });
          } else {
            throw new Error("Verification succeeded but no session was created.");
          }
        }
      } catch (error: any) {
        console.error("[AuthCallback] Auth error:", error.message);
        toast.error("Authentication failed: " + (error.message || "Unknown error"));
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