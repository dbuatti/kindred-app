"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  ArrowRight, 
  Check,
  Loader2,
  Search,
  X,
  Sparkles,
  UserCheck,
  User
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { extractYear } from '@/lib/utils';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, people, profiles, loading: contextLoading, refreshData } = useFamily();
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selfSearchQuery, setSelfSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    claimedPersonId: null as string | null,
  });

  // Load existing progress if any
  useEffect(() => {
    if (!contextLoading && user && profiles[user.id]) {
      const profile = profiles[user.id];
      if (!profile.onboarding_completed) {
        setFormData(prev => ({
          ...prev,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
        }));

        const claimed = people.find(p => p.userId === user.id);
        if (claimed) {
          setFormData(prev => ({ ...prev, claimedPersonId: claimed.id }));
        }
      }
      setIsInitialLoading(false);
    } else if (!contextLoading) {
      setIsInitialLoading(false);
    }
  }, [contextLoading, user, profiles, people]);

  const handleClaimPerson = (person: any) => {
    const names = person.name.split(' ');
    setFormData({
      claimedPersonId: person.id,
      firstName: names[0],
      lastName: names.slice(1).join(' '),
    });
    setSelfSearchQuery('');
    toast.success(`Linked to ${person.name}!`);
  };

  const handleComplete = async () => {
    if (!user || !formData.firstName) return;
    setIsSaving(true);

    try {
      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // 2. Link or Create Person record
      if (formData.claimedPersonId) {
        await supabase
          .from('people')
          .update({
            user_id: user.id,
            name: fullName,
          })
          .eq('id', formData.claimedPersonId);
      } else {
        await supabase
          .from('people')
          .upsert({
            user_id: user.id,
            name: fullName,
            vibe_sentence: "",
            personality_tags: ["✨ Family Member"],
            created_by_email: user.email,
            is_living: true
          }, { onConflict: 'user_id' });
      }

      await refreshData();
      toast.success("Welcome to the family archive!");
      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error("Something went wrong: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const unclaimedPeople = useMemo(() => people.filter(p => !p.userId), [people]);
  
  const selfSearchResults = useMemo(() => {
    if (!selfSearchQuery || selfSearchQuery.length < 2) return [];
    return unclaimedPeople.filter(p => 
      p.name.toLowerCase().includes(selfSearchQuery.toLowerCase())
    ).slice(0, 5);
  }, [selfSearchQuery, unclaimedPeople]);

  if (contextLoading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6">
        <div className="animate-pulse flex flex-col items-center gap-6">
          <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
            <Heart className="w-10 h-10 fill-current" />
          </div>
          <h2 className="text-2xl font-serif text-stone-800">Opening the archive...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-4xl font-serif font-medium text-stone-800">Welcome Home</h1>
          <p className="text-stone-500 italic text-lg">Let's get you settled into the family storybook.</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 flex flex-col gap-10">
          {/* Search Section */}
          <div className="space-y-6">
            <div className="bg-amber-50/50 p-6 rounded-3xl border-2 border-amber-100 space-y-4">
              <div className="flex items-center gap-3 text-amber-700">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-lg font-serif font-bold">Are you already in the tree?</h2>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">
                Search for your name. If a relative has already added you, we can link your account right now.
              </p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input 
                  placeholder="Search for your name..." 
                  className="h-14 pl-12 bg-white border-stone-200 rounded-2xl text-lg shadow-sm focus-visible:ring-amber-500/20"
                  value={selfSearchQuery}
                  onChange={(e) => setSelfSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {selfSearchResults.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-amber-200 overflow-hidden animate-in fade-in slide-in-from-top-2 shadow-xl">
                {selfSearchResults.map(person => (
                  <button
                    key={person.id}
                    onClick={() => handleClaimPerson(person)}
                    className="w-full px-6 py-5 text-left hover:bg-amber-50 transition-colors flex items-center justify-between group border-b border-stone-100 last:border-none"
                  >
                    <div className="flex items-center gap-4">
                      <UserCheck className="w-6 h-6 text-amber-600" />
                      <div>
                        <p className="text-lg font-bold text-stone-800">{person.name}</p>
                        <p className="text-xs text-stone-400 uppercase tracking-widest">Added by {person.createdByEmail.split('@')[0]}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-amber-600 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {formData.claimedPersonId && !selfSearchQuery && (
              <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-bold text-green-900">Profile Linked!</p>
                </div>
                <button onClick={() => setFormData(prev => ({ ...prev, claimedPersonId: null }))} className="text-xs font-bold text-stone-400 uppercase hover:text-red-500">Change</button>
              </div>
            )}
          </div>

          <div className="space-y-6 pt-6 border-t border-stone-100">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-stone-400" />
              <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Confirm Your Name</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase ml-1">First Name</label>
                <Input 
                  value={formData.firstName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} 
                  placeholder="e.g. Mary"
                  className="h-14 bg-stone-50 border-none rounded-2xl text-lg focus-visible:ring-amber-500/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase ml-1">Last Name</label>
                <Input 
                  value={formData.lastName} 
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} 
                  placeholder="Current/Married Name"
                  className="h-14 bg-stone-50 border-none rounded-2xl text-lg focus-visible:ring-amber-500/20" 
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleComplete}
            disabled={isSaving || !formData.firstName}
            className="w-full h-16 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-xl font-medium group shadow-xl"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Enter the Archive <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;