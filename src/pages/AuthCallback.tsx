import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (token_hash && type) {
        console.log("[auth-callback] Verifying token...", { type });
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          console.error("[auth-callback] Verification error:", error.message);
          toast.error("Verification failed: " + error.message);
          navigate('/login');
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("[auth-callback] Session error:", sessionError.message);
        toast.error("Authentication failed: " + sessionError.message);
        navigate('/login');
      } else if (data.session) {
        console.log("[auth-callback] Success! Redirecting home.");
        toast.success("Welcome back!");
        navigate('/');
      } else {
        console.warn("[auth-callback] No session found, redirecting to login.");
        navigate('/login');
      }
    };

    handleAuth();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto" />
        <h2 className="text-2xl font-serif text-stone-800">Verifying your link...</h2>
        <p className="text-stone-500 italic">Just a moment while we step inside.</p>
      </div>
    </div>
  );
};

export default AuthCallback;