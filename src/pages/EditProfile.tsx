"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, UserCircle } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profiles, loading: contextLoading } = useFamily();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    bio: ''
  });

  useEffect(() => {
    if (user && profiles[user.id]) {
      const profile = profiles[user.id];
      setFormData({
        firstName: profile.first_name || '',
        middleName: profile.middle_name || '',
        lastName: profile.last_name || '',
        birthDate: profile.birth_date || '',
        birthPlace: profile.birth_place || '',
        bio: profile.bio || ''
      });
    }
  }, [user, profiles]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          birth_date: formData.birthDate || null,
          birth_place: formData.birthPlace,
          bio: formData.bio,
          onboarding_completed: true, // Mark as completed when they save
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Also update the 'people' record for this user so they appear in the tree
      const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');
      await supabase.from('people').upsert({
        user_id: user.id,
        name: fullName || user.email?.split('@')[0],
        birth_year: formData.birthDate ? formData.birthDate.split('-')[0] : '',
        birth_place: formData.birthPlace,
        vibe_sentence: formData.bio || "A member of the family archive.",
        personality_tags: ["✨ Family Member"],
        created_by_email: user.email,
      }, { onConflict: 'user_id' });

      toast.success("Profile saved successfully!");
      navigate('/');
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (contextLoading) return <div className="p-20 text-center text-2xl font-serif">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-20">
      <header className="bg-white border-b-8 border-stone-100 px-8 py-8 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="rounded-full h-14 px-6 text-stone-500 gap-2">
            <ArrowLeft className="w-6 h-6" /> Back
          </Button>
          <h1 className="text-3xl font-serif font-bold text-stone-800">Edit Your Profile</h1>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-8 py-12 space-y-12">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border-4 border-stone-100 space-y-10">
          <div className="flex justify-center">
            <div className="h-32 w-32 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 border-4 border-stone-50">
              <UserCircle className="w-20 h-20" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-widest text-stone-400">First Name</label>
              <Input 
                value={formData.firstName} 
                onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                className="h-16 bg-stone-50 border-none rounded-2xl text-xl px-6 focus-visible:ring-amber-500/20" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-widest text-stone-400">Middle Name</label>
              <Input 
                value={formData.middleName} 
                onChange={(e) => setFormData({...formData, middleName: e.target.value})} 
                className="h-16 bg-stone-50 border-none rounded-2xl text-xl px-6 focus-visible:ring-amber-500/20" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-widest text-stone-400">Last Name</label>
              <Input 
                value={formData.lastName} 
                onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                className="h-16 bg-stone-50 border-none rounded-2xl text-xl px-6 focus-visible:ring-amber-500/20" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-widest text-stone-400">Birth Date</label>
              <Input 
                type="date"
                value={formData.birthDate} 
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})} 
                className="h-16 bg-stone-50 border-none rounded-2xl text-xl px-6 focus-visible:ring-amber-500/20" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-widest text-stone-400">Birth Place</label>
              <Input 
                value={formData.birthPlace} 
                onChange={(e) => setFormData({...formData, birthPlace: e.target.value})} 
                placeholder="e.g. London, UK"
                className="h-16 bg-stone-50 border-none rounded-2xl text-xl px-6 focus-visible:ring-amber-500/20" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-widest text-stone-400">A short bio or "vibe"</label>
              <Textarea 
                value={formData.bio} 
                onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                placeholder="Tell the family a bit about yourself..."
                className="min-h-[150px] bg-stone-50 border-none rounded-2xl text-xl font-serif p-6 focus-visible:ring-amber-500/20" 
              />
            </div>
          </div>

          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-24 bg-stone-800 hover:bg-stone-900 text-white rounded-[2rem] text-2xl font-bold shadow-xl gap-4"
          >
            {isSaving ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Save className="w-8 h-8" /> Save Profile</>}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;