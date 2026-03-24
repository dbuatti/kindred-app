"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, ArrowRight, Mail, Loader2, AlertCircle, Github } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

const JoinFamily = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
  }, [navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    
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
    } catch (err: any) {
      const msg = err.message || "Failed to send magic link.";
      setError(msg);
      
      if (msg.toLowerCase().includes('rate limit')) {
        toast.error("Rate limit reached. Try using an email alias.");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectTo = token 
        ? `${window.location.origin}/auth/confirm?token=${token}`
        : `${window.location.origin}/auth/confirm`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error("Google login failed: " + err.message);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const redirectTo = token 
        ? `${window.location.origin}/auth/confirm?token=${token}`
        : `${window.location.origin}/auth/confirm`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error("GitHub login failed: " + err.message);
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
          <div className="space-y-6">
            <div className="space-y-8 bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100">
              <form onSubmit={handleJoin} className="space-y-6">
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-stone-400 font-bold tracking-widest">Or join with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="h-16 border-2 border-stone-100 rounded-2xl text-xl font-medium flex items-center justify-center gap-3 hover:bg-stone-50"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleGithubLogin}
                  className="h-16 border-2 border-stone-100 rounded-2xl text-xl font-medium flex items-center justify-center gap-3 hover:bg-stone-50"
                >
                  <Github className="w-6 h-6" />
                  GitHub
                </Button>
              </div>
            </div>

            {error?.toLowerCase().includes('rate limit') && (
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex gap-4 text-left animate-in slide-in-from-top-2">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-bold text-amber-900">Email Rate Limit Reached</p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Supabase limits how many emails we can send per hour. 
                    <br /><br />
                    <strong>Pro Tip:</strong> Try using an alias like <code className="bg-amber-100 px-1 rounded">{email.split('@')[0]}+1@{email.split('@')[1]}</code> or use a social login above.
                  </p>
                </div>
              </div>
            )}
          </div>
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