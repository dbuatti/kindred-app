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

      // If we have a token_hash (Option 2 from the docs), verify it manually
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          toast.error("Verification failed: " + error.message);
          navigate('/login');
          return;
        }
      }

      // Check if we have a session now
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        toast.error("Authentication failed: " + sessionError.message);
        navigate('/login');
      } else if (data.session) {
        toast.success("Welcome back!");
        navigate('/');
      } else {
        // Fallback for slow redirects
        const timeout = setTimeout(() => {
          navigate('/login');
        }, 5000);
        return () => clearTimeout(timeout);
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