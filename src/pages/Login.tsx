import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
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
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-12 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center text-amber-600 mx-auto shadow-sm">
            <Heart className="w-10 h-10 fill-current" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-medium text-stone-800">Welcome to Kindred</h1>
            <p className="text-stone-500 italic">Our private family storybook.</p>
          </div>
        </div>

        {!isSent ? (
          <form onSubmit={handleLogin} className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-8">
            <div className="space-y-4">
              <p className="text-stone-600 text-center leading-relaxed">
                Enter your email to receive a secure login link.
              </p>
              <Input 
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-stone-50 border-none rounded-2xl text-center text-lg focus-visible:ring-amber-500/20"
                required
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-lg font-medium group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send Magic Link
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-stone-100 space-y-8 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mx-auto">
              <Mail className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-serif text-stone-800">Check your email</h2>
              <p className="text-stone-500 font-light leading-relaxed">
                We've sent a link to <span className="font-medium text-stone-700">{email}</span>.
              </p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setIsSent(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              Try a different email
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;