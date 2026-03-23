import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Heart } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center text-amber-600 mx-auto">
            <Heart className="w-10 h-10 fill-current" />
          </div>
          <h1 className="text-3xl font-serif font-medium text-stone-800">Welcome to Kindred</h1>
          <p className="text-stone-500 italic">Sign in to access your family archive.</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#d97706',
                  brandAccent: '#b45309',
                },
                radii: {
                  buttonRadius: '1rem',
                  inputRadius: '1rem',
                }
              }
            }
          }}
          providers={[]}
          theme="light"
        />
      </div>
    </div>
  );
};

export default Login;