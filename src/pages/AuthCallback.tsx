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
      if (processed.current) return;
      processed.current = true;

      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const inviteToken = searchParams.get('token');

      console.log("[auth-callback] URL Parameters:", { 
        hasHash: !!token_hash, 
        type, 
        hasInvite: !!inviteToken,
        origin: window.location.origin 
      });

      try {
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (error) throw error;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (data.session) {
          console.log("[auth-callback] Session established for:", data.session.user.email);
          
          if (inviteToken) {
            await supabase
              .from('people')
              .update({ user_id: data.session.user.id })
              .eq('invite_token', inviteToken)
              .is('user_id', null);
          }

          toast.success("Welcome back!");
          navigate('/', { replace: true });
        } else {
          console.error("[auth-callback] No session found after verification.");
          navigate('/login', { replace: true });
        }
      } catch (error: any) {
        console.error("[auth-callback] Auth error:", error.message);
        toast.error("Authentication failed: " + error.message);
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