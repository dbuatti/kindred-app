import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      // Prevent double-processing in Strict Mode
      if (processed.current) return;
      processed.current = true;

      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const inviteToken = searchParams.get('token');

      try {
        if (token_hash && type) {
          console.log("[auth-callback] Verifying token...", { type });
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });

          if (error) throw error;
        }

        // Wait a tiny bit for the session to propagate
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (data.session) {
          console.log("[auth-callback] Success! Checking for invite token...");
          
          if (inviteToken) {
            const { error: linkError } = await supabase
              .from('people')
              .update({ user_id: data.session.user.id })
              .eq('invite_token', inviteToken)
              .is('user_id', null);

            if (linkError) console.error("[auth-callback] Error linking profile:", linkError.message);
          }

          toast.success("Welcome back!");
          // Use replace to prevent going back to the callback page
          navigate('/', { replace: true });
        } else {
          console.warn("[auth-callback] No session found, redirecting to login.");
          navigate('/login', { replace: true });
        }
      } catch (error: any) {
        console.error("[auth-callback] Auth error:", error.message);
        toast.error("Authentication failed. Please try again.");
        navigate('/login', { replace: true });
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