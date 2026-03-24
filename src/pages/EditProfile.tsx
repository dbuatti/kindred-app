"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, UserCircle, ChevronsUpDown, Check, Briefcase, Heart, User, MapPin, Globe } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const INITIAL_SUGGESTIONS = [
  "Melbourne, Australia",
  "Sydney, Australia",
  "London, UK", 
  "New York, USA", 
  "Sicily, Italy"
];

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Prefer not to say", value: "other" }
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profiles, loading: contextLoading } = useFamily();
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [placePopoverOpen, setPlacePopoverOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nickname: '',
    maidenName: '',
    occupation: '',
    birthDate: '',
    birthPlace: '',
    bio: '',
    gender: ''
  });

  useEffect(() => {
    if (user && profiles[user.id]) {
      const profile = profiles[user.id];
      setFormData({
        firstName: profile.first_name || '',
        middleName: profile.middle_name || '',
        lastName: profile.last_name || '',
        nickname: profile.nickname || '',
        maidenName: profile.maiden_name || '',
        occupation: profile.occupation || '',
        birthDate: profile.birth_date || '',
        birthPlace: profile.birth_place || '',
        bio: profile.bio || '',
        gender: profile.gender || ''
      });
    }
  }, [user, profiles]);

  useEffect(() => {
    if (!formData.birthPlace || formData.birthPlace.length < 3) {
      if (!formData.birthPlace) setSuggestions(INITIAL_SUGGESTIONS);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.birthPlace)}&limit=6&addressdetails=1`
        );
        const data = await response.json();
        const places = data.map((item: any) => {
          const addr = item.address;
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.hamlet;
          const state = addr.state || addr.region;
          const country = addr.country;
          
          if (city && country) {
            return `${city}${state ? `, ${state}` : ''}, ${country}`;
          }
          return item.display_name.split(',').slice(0, 3).join(',');
        });
        
        setSuggestions(Array.from(new Set(places as string[])));
      } catch (error) {
        console.error("Error fetching places:", error);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.birthPlace]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          middle_name: formData.middleName,
          nickname: formData.nickname,
          maiden_name: formData.maidenName,
          occupation: formData.occupation,
          birth_date: formData.birthDate,
          birth_place: formData.birthPlace,
          bio: formData.bio,
          gender: formData.gender,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');
      
      // Extract year for the people table if it's a full date
      let birthYear = '';
      if (formData.birthDate && formData.birthDate.length >= 4) {
        const parts = formData.birthDate.split(/[-/]/);
        const yearPart = parts.find(p => p.length === 4);
        if (yearPart) birthYear = yearPart;
      }

      await supabase.from('people').upsert({
        user_id: user.id,
        name: fullName || user.email?.split('@')[0],
        gender: formData.gender,
        birth_year: birthYear,
        birth_date: formData.birthDate,
        birth_place: formData.birthPlace,
        occupation: formData.occupation,
        vibe_sentence: formData.bio || "",
        personality_tags: ["✨ Family Member"],
        created_by_email: user.email,
        is_living: true // Ensure the user is marked as living
      }, { onConflict: 'user_id' });

      toast.success("Profile saved successfully!");
      navigate('/profile');
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
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/profile')} className="rounded-full h-14 px-6 text-stone-500 gap-2">
            <ArrowLeft className="w-6 h-6" /> Back
          </Button>
          <h1 className="text-3xl font-serif font-bold text-stone-800">Edit Your Profile</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border-4 border-stone-100 space-y-10">
          <div className="flex justify-center">
            <div className="h-32 w-32 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 border-4 border-stone-50">
              <UserCircle className="w-20 h-20" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10">
            <div className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-2">
                <User className="w-5 h-5 text-amber-600" /> Names & Identity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">First Name</label>
                  <Input 
                    value={formData.firstName} 
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                    className="h-14 bg-stone-50 border-none rounded-2xl text-lg px-6 focus-visible:ring-amber-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Last Name</label>
                  <Input 
                    value={formData.lastName} 
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                    className="h-14 bg-stone-50 border-none rounded-2xl text-lg px-6 focus-visible:ring-amber-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Gender</label>
                  <Select onValueChange={(val) => setFormData({...formData, gender: val})} value={formData.gender}>
                    <SelectTrigger className="h-14 bg-stone-50 border-none rounded-2xl text-lg px-6">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {GENDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-lg py-3">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Nickname</label>
                  <Input 
                    value={formData.nickname} 
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})} 
                    placeholder="e.g. 'Bibi'"
                    className="h-14 bg-stone-50 border-none rounded-2xl text-lg px-6 focus-visible:ring-amber-500/20" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-2">
                <Briefcase className="w-5 h-5 text-amber-600" /> Life & Work
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Occupation</label>
                  <Input 
                    value={formData.occupation} 
                    onChange={(e) => setFormData({...formData, occupation: e.target.value})} 
                    placeholder="e.g. Teacher, Engineer..."
                    className="h-14 bg-stone-50 border-none rounded-2xl text-lg px-6 focus-visible:ring-amber-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Birth Date (DD, DD/MM, or DD/MM/YYYY)</label>
                  <Input 
                    type="text"
                    value={formData.birthDate} 
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})} 
                    placeholder="e.g. 15/05/1980"
                    className="h-14 bg-stone-50 border-none rounded-2xl text-lg px-6 focus-visible:ring-amber-500/20" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Birth Place</label>
                <Popover open={placePopoverOpen} onOpenChange={setPlacePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={placePopoverOpen}
                      className="w-full justify-between bg-stone-50 border-none rounded-2xl h-14 text-lg font-normal text-stone-600 hover:bg-stone-100 focus:ring-amber-500/20 px-6"
                    >
                      {formData.birthPlace || "Select or type..."}
                      {isSearching ? <Loader2 className="ml-2 h-5 w-5 animate-spin opacity-50" /> : <Globe className="ml-2 h-5 w-5 shrink-0 opacity-50" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 rounded-2xl border-stone-100 shadow-xl">
                    <Command className="rounded-2xl" shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search any city in the world..." 
                        value={formData.birthPlace}
                        onValueChange={(val) => setFormData({...formData, birthPlace: val})}
                        className="h-12 text-lg"
                      />
                      <CommandList>
                        {isSearching && (
                          <div className="p-4 text-center text-stone-400 text-sm italic flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Searching global database...
                          </div>
                        )}
                        <CommandEmpty>
                          <button 
                            className="w-full text-left px-4 py-3 text-amber-600 hover:bg-amber-50 rounded-xl flex items-center gap-2"
                            onClick={() => setPlacePopoverOpen(false)}
                          >
                            <MapPin className="w-4 h-4" />
                            Use "{formData.birthPlace}"
                          </button>
                        </CommandEmpty>
                        <CommandGroup heading={formData.birthPlace.length >= 3 ? "Search Results" : "Common Places"}>
                          {suggestions.map((place) => (
                            <CommandItem
                              key={place}
                              value={place}
                              onSelect={() => {
                                setFormData({...formData, birthPlace: place});
                                setPlacePopoverOpen(false);
                              }}
                              className="rounded-xl py-2 text-lg"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.birthPlace === place ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {place}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-2">
                <Heart className="w-5 h-5 text-amber-600" /> Your Story
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">A short bio or "vibe"</label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                  placeholder="Tell the family a bit about yourself..."
                  className="min-h-[150px] bg-stone-50 border-none rounded-2xl text-xl font-serif p-6 focus-visible:ring-amber-500/20" 
                />
              </div>
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