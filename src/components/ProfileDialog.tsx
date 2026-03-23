import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { User, Settings, LogOut, ShieldCheck, Edit3 } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

const ProfileDialog = () => {
  const navigate = useNavigate();
  const { user, profiles } = useFamily();
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const profile = user ? profiles[user.id] : null;
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Profile updated!");
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full bg-stone-100 text-stone-500 h-20 w-20">
          <User className="w-10 h-10" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none bg-stone-50 p-8">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-stone-800 text-center">
            Your Profile
          </DialogTitle>
          <DialogDescription className="text-center text-stone-500">
            Manage your personal information and account settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-stone-400">First Name</label>
              <Input 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="bg-white border-stone-200 rounded-2xl h-14 text-lg focus-visible:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-stone-400">Last Name</label>
              <Input 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                className="bg-white border-stone-200 rounded-2xl h-14 text-lg focus-visible:ring-amber-500"
              />
            </div>
            <div className="pt-2">
              <p className="text-sm text-stone-400 text-center italic">
                Signed in as {user?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              variant="outline"
              className="w-full h-16 rounded-2xl border-stone-200 text-stone-700 hover:bg-stone-100 gap-2 text-lg"
              onClick={() => {
                setIsOpen(false);
                navigate('/edit-profile');
              }}
            >
              <Edit3 className="w-5 h-5" />
              Edit Full Profile
            </Button>
            
            {isAdmin && (
              <Button 
                variant="outline"
                className="w-full h-16 rounded-2xl border-amber-200 text-amber-700 hover:bg-amber-50 gap-2 text-lg"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin');
                }}
              >
                <ShieldCheck className="w-5 h-5" />
                Admin Dashboard
              </Button>
            )}
            <Button 
              className="w-full h-16 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-xl font-bold"
              onClick={handleSave}
              disabled={isLoading}
            >
              Quick Save
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;