"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  Heart, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Check,
  Loader2,
  UserPlus,
  Search,
  Globe,
  MapPin,
  ChevronsUpDown
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractYear, cn } from '@/lib/utils';

const RELATIONSHIP_TYPES = [
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Sister", value: "sister" },
  { label: "Brother", value: "brother" },
  { label: "Grandmother", value: "grandmother" },
  { label: "Grandfather", value: "grandfather" },
  { label: "Daughter", value: "daughter" },
  { label: "Son", value: "son" },
  { label: "Spouse", value: "spouse" }
];

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Prefer not to say", value: "other" }
];

const INITIAL_SUGGESTIONS = [
  "Melbourne, Australia",
  "Sydney, Australia",
  "London, UK", 
  "New York, USA", 
  "Sicily, Italy"
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, people, loading: contextLoading, refreshData } = useFamily();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Place Autocomplete State
  const [isSearching, setIsSearching] = useState(false);
  const [placePopoverOpen, setPlacePopoverOpen] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    bio: '',
    claimedPersonId: null as string | null,
    newRelatives: [] as { name: string, type: string }[]
  });

  const [relativeName, setRelativeName] = useState('');
  const [relativeType, setRelativeType] = useState('mother');

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Birth Place Autocomplete Logic
  useEffect(() => {
    if (!formData.birthPlace || formData.birthPlace.length < 3) {
      if (!formData.birthPlace) setPlaceSuggestions(INITIAL_SUGGESTIONS);
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
        
        setPlaceSuggestions(Array.from(new Set(places as string[])));
      } catch (error) {
        console.error("Error fetching places:", error);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.birthPlace]);

  const addRelative = () => {
    if (!relativeName) return;
    setFormData(prev => ({
      ...prev,
      newRelatives: [...prev.newRelatives, { name: relativeName, type: relativeType }]
    }));
    setRelativeName('');
    toast.success(`Added ${relativeName} to your list.`);
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          gender: formData.gender,
          birth_date: formData.birthDate || null,
          birth_place: formData.birthPlace,
          bio: formData.bio,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const birthYear = extractYear(formData.birthDate);
      
      // 2. Link or Create Person record
      const personData = {
        user_id: user.id,
        name: fullName,
        gender: formData.gender,
        birth_year: birthYear,
        birth_date: formData.birthDate || null,
        birth_place: formData.birthPlace,
        vibe_sentence: formData.bio || "",
        personality_tags: ["✨ Family Member"],
        created_by_email: user.email,
        is_living: true
      };

      let myPersonId = formData.claimedPersonId;

      if (myPersonId) {
        const { error: updateErr } = await supabase
          .from('people')
          .update(personData)
          .eq('id', myPersonId);
        if (updateErr) throw updateErr;
      } else {
        const { data: person, error: pErr } = await supabase
          .from('people')
          .upsert(personData, { onConflict: 'user_id' })
          .select()
          .single();
        if (pErr) throw pErr;
        myPersonId = person.id;
      }

      // 3. Add Relatives
      for (const rel of formData.newRelatives) {
        const { data: relPerson, error: relErr } = await supabase
          .from('people')
          .insert({
            name: rel.name,
            vibe_sentence: "",
            personality_tags: [rel.type],
            created_by_email: user.email,
            is_living: true
          })
          .select()
          .single();

        if (!relErr && relPerson && myPersonId) {
          await supabase.from('relationships').insert({
            person_id: myPersonId,
            related_person_id: relPerson.id,
            relationship_type: rel.type
          });
        }
      }

      // CRITICAL: Refresh data and wait for it before navigating to break the loop
      await refreshData();
      
      toast.success("Welcome to the family archive!");
      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error("Something went wrong: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (contextLoading) return null;

  const unclaimedPeople = people.filter(p => !p.userId);

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-4xl font-serif font-medium text-stone-800">
            {step === 1 ? "Who are you?" : step === 2 ? "Your Roots" : "Your Connections"}
          </h1>
          <p className="text-stone-500 italic text-lg">
            {step === 1 ? "Just a name or nickname is fine to start." : step === 2 ? "Tell us a bit about your beginning." : "Who else should be in our storybook?"}
          </p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 min-h-[450px] flex flex-col">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <p className="text-sm text-stone-400 uppercase tracking-widest font-bold">Search for yourself</p>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                  <Input 
                    placeholder="Has someone already added you?" 
                    className="h-14 pl-12 bg-stone-50 border-none rounded-2xl text-lg"
                    onChange={(e) => {
                      const found = unclaimedPeople.find(p => p.name.toLowerCase().includes(e.target.value.toLowerCase()));
                      if (found && e.target.value.length > 2) {
                        updateField('claimedPersonId', found.id);
                        const names = found.name.split(' ');
                        updateField('firstName', names[0]);
                        updateField('lastName', names.slice(1).join(' '));
                        updateField('gender', found.gender || '');
                        // Prepopulate birth info if available
                        if (found.birthDate) updateField('birthDate', found.birthDate);
                        if (found.birthPlace) updateField('birthPlace', found.birthPlace);
                        if (found.vibeSentence) updateField('bio', found.vibeSentence);
                        
                        toast.success(`Found you! We've linked your profile to ${found.name}.`);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase">First Name</label>
                    <Input 
                      value={formData.firstName} 
                      onChange={(e) => updateField('firstName', e.target.value)} 
                      placeholder="e.g. Mary"
                      className="h-14 bg-stone-50 border-none rounded-2xl text-lg" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase">Last Name</label>
                    <Input 
                      value={formData.lastName} 
                      onChange={(e) => updateField('lastName', e.target.value)} 
                      placeholder="Optional"
                      className="h-14 bg-stone-50 border-none rounded-2xl text-lg" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase">Gender</label>
                  <Select onValueChange={(val) => updateField('gender', val)} value={formData.gender}>
                    <SelectTrigger className="h-14 bg-stone-50 border-none rounded-2xl text-lg">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {GENDER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-lg py-3">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase">Birth Date (Optional)</label>
                <Input 
                  type="text" 
                  placeholder="e.g. 15/05/1980" 
                  value={formData.birthDate} 
                  onChange={(e) => updateField('birthDate', e.target.value)} 
                  className="h-14 bg-stone-50 border-none rounded-2xl text-lg" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase">Birth Place (Optional)</label>
                <Popover open={placePopoverOpen} onOpenChange={setPlacePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={placePopoverOpen}
                      className="w-full justify-between bg-stone-50 border-none rounded-2xl h-14 text-lg font-normal text-stone-600 hover:bg-stone-100 px-6"
                    >
                      {formData.birthPlace || "Select or type..."}
                      {isSearching ? <Loader2 className="ml-2 h-5 w-5 animate-spin opacity-50" /> : <Globe className="ml-2 h-5 w-5 shrink-0 opacity-50" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 rounded-2xl border-stone-100 shadow-xl">
                    <Command className="rounded-2xl" shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search any city..." 
                        value={formData.birthPlace}
                        onValueChange={(val) => updateField('birthPlace', val)}
                        className="h-12 text-lg"
                      />
                      <CommandList>
                        {isSearching && (
                          <div className="p-4 text-center text-stone-400 text-sm italic flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Searching...
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
                        <CommandGroup heading="Suggestions">
                          {placeSuggestions.map((place) => (
                            <CommandItem
                              key={place}
                              value={place}
                              onSelect={() => {
                                updateField('birthPlace', place);
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase">A short bio</label>
                <Textarea value={formData.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder="Lover of books, keeper of secrets..." className="min-h-[120px] bg-stone-50 border-none rounded-2xl text-lg font-serif" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <p className="text-sm text-stone-400 font-medium">Add relatives who aren't here yet:</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Uncle Joe" 
                    value={relativeName}
                    onChange={(e) => setRelativeName(e.target.value)}
                    className="h-14 bg-stone-50 border-none rounded-2xl flex-1"
                  />
                  <select 
                    value={relativeType}
                    onChange={(e) => setRelativeType(e.target.value)}
                    className="h-14 bg-stone-50 border-none rounded-2xl px-4 text-stone-600 outline-none"
                  >
                    {RELATIONSHIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <Button onClick={addRelative} className="h-14 w-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white">
                    <UserPlus className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                {formData.newRelatives.map((rel, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <div>
                      <p className="font-medium text-stone-800">{rel.name}</p>
                      <p className="text-xs text-stone-400 uppercase tracking-widest">{rel.type}</p>
                    </div>
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-10 flex gap-4">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="h-14 px-8 rounded-2xl text-stone-400">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </Button>
            )}
            <Button 
              onClick={() => step < 3 ? setStep(s => s + 1) : handleComplete()}
              disabled={isSaving || (step === 1 && !formData.firstName)}
              className="flex-1 h-14 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-lg font-medium group"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                step < 3 ? (
                  <>Next Step <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                ) : "Finish & Enter Archive"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;