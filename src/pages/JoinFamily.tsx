"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, ArrowRight, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

const JoinFamily = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, just send them home
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
  }, [navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const redirectTo = token 
        ? `${window.location.origin}/auth/confirm?token=${token}`
        : `${window.location.origin}/auth/confirm`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;
      
      setIsSent(true);
      toast.success("Magic link sent! Check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send magic link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-12 animate-in fade-in zoom-in duration-1000">
        <div className="space-y-6">
          <div className="h-24 w-24 rounded-full bg-stone-100 flex items-center justify-center text-amber-600 mx-auto shadow-inner">
            <Heart className="w-12 h-12 fill-current" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-medium text-stone-800">Kindred</h1>
            <p className="text-stone-500 text-lg font-light italic">Our private family storybook.</p>
          </div>
        </div>

        {!isSent ? (
          <form onSubmit={handleJoin} className="space-y-8 bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100">
            <div className="space-y-4">
              <p className="text-stone-600 leading-relaxed">
                {token 
                  ? "You've been invited to join our family archive. Enter your email to step inside."
                  : "Enter your email address to see our family stories and photos."}
              </p>
              <Input 
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 bg-stone-50 border-none rounded-2xl text-center text-xl focus-visible:ring-amber-500/20"
                required
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xl font-medium group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Step Inside
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-stone-100 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mx-auto">
              <Mail className="w-10 h-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-serif text-stone-800">Check your email</h2>
              <p className="text-stone-500 text-lg font-light leading-relaxed">
                We've sent a link to <span className="font-medium text-stone-700">{email}</span>. 
                Open your email and click the link to enter.
              </p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setIsSent(false)}
              className="text-stone-400 hover:text-stone-600 text-lg"
            >
              Use a different email
            </Button>
          </div>
        )}

        <footer className="pt-12">
          <p className="text-xs text-stone-300 uppercase tracking-[0.2em] font-medium">
            Private • Secure • Family Only
          </p>
        </footer>
      </div>
    </div>
  );
};

export default JoinFamily;