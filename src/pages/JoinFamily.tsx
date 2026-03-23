import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

const JoinFamily = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setIsSent(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-12 animate-in fade-in zoom-in duration-1000">
        <div className="space-y-6">
          <div className="h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center text-amber-600 mx-auto shadow-inner">
            <Heart className="w-10 h-10 fill-current" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-medium text-stone-800">Kindred</h1>
            <p className="text-stone-500 font-light italic">A private archive for the Rossi family stories.</p>
          </div>
        </div>

        {!isSent ? (
          <form onSubmit={handleJoin} className="space-y-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
            <div className="space-y-4">
              <p className="text-sm text-stone-400 leading-relaxed">
                Enter your email to receive a magic link. <br />
                No passwords, just family.
              </p>
              <Input 
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-stone-50 border-none rounded-2xl text-center text-lg focus-visible:ring-amber-500/20"
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full h-14 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-lg font-medium group"
            >
              Enter the Archive
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        ) : (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-stone-800">Check your inbox</h2>
              <p className="text-stone-500 font-light leading-relaxed">
                We've sent a magic link to <span className="font-medium text-stone-700">{email}</span>. 
                Click it to step inside.
              </p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setIsSent(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              Use a different email
            </Button>
          </div>
        )}

        <footer className="pt-12">
          <p className="text-[10px] text-stone-300 uppercase tracking-[0.2em] font-medium">
            Private • Secure • Forever
          </p>
        </footer>
      </div>
    </div>
  );
};

export default JoinFamily;