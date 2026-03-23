"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  UserCircle, 
  Edit3, 
  ShieldCheck, 
  LogOut, 
  Mail,
  Calendar,
  MapPin
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

const ADMIN_EMAIL = "daniele.buatti@gmail.com";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profiles, loading } = useFamily();

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Loading...</div>;

  const profile = user ? profiles[user.id] : null;
  const isAdmin = user?.email === ADMIN_EMAIL;
  const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 'Family Member';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-20">
      <header className="bg-white border-b-8 border-stone-100 px-8 py-8 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="rounded-full h-14 w-14 text-stone-500"
          >
            <ArrowLeft className="w-8 h-8" />
          </Button>
          <h1 className="text-3xl font-serif font-bold text-stone-800">Your Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-12 space-y-10">
        {/* Profile Header Card */}
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border-4 border-stone-100 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-40 w-40 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 border-8 border-stone-50 shadow-inner">
              <UserCircle className="w-24 h-24" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-serif font-bold text-stone-800">{fullName}</h2>
            <p className="text-xl text-stone-400 italic flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" /> {user?.email}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 pt-4 text-stone-500">
            {profile?.birth_date && (
              <div className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
                Born {new Date(profile.birth_date).getFullYear()}
              </div>
            )}
            {profile?.birth_place && (
              <div className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-amber-600" />
                {profile.birth_place}
              </div>
            )}
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/edit-profile')}
            className="w-full h-24 bg-white hover:bg-stone-50 text-stone-800 border-4 border-stone-100 rounded-[2rem] text-2xl font-bold shadow-sm flex items-center justify-between px-10 group"
          >
            <div className="flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Edit3 className="w-8 h-8" />
              </div>
              Edit Profile Details
            </div>
            <ArrowLeft className="w-8 h-8 rotate-180 text-stone-300" />
          </Button>

          {isAdmin && (
            <Button 
              onClick={() => navigate('/admin')}
              className="w-full h-24 bg-white hover:bg-amber-50 text-amber-900 border-4 border-amber-100 rounded-[2rem] text-2xl font-bold shadow-sm flex items-center justify-between px-10 group"
            >
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                Admin Dashboard
              </div>
              <ArrowLeft className="w-8 h-8 rotate-180 text-amber-200" />
            </Button>
          )}

          <Button 
            onClick={handleSignOut}
            variant="ghost"
            className="w-full h-24 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-[2rem] text-2xl font-bold flex items-center justify-center gap-4"
          >
            <LogOut className="w-8 h-8" />
            Sign Out
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;