import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // The Supabase client handles the hash/code in the URL automatically,
      // but we can also manually verify if a token_hash is present.
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        toast.error("Authentication failed: " + error.message);
        navigate('/login');
      } else if (data.session) {
        toast.success("Welcome back!");
        navigate('/');
      } else {
        // If no session yet, we might be waiting for the redirect to finish
        // or it might be an invalid link.
        const timeout = setTimeout(() => {
          navigate('/login');
        }, 5000);
        return () => clearTimeout(timeout);
      }
    };

    handleAuth();
  }, [navigate]);

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