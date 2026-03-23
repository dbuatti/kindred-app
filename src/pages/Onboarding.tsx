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
  Sparkles, 
  User, 
  Calendar, 
  MapPin, 
  Users,
  Check,
  Loader2,
  ChevronsUpDown
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COMMON_PLACES = [
  "London, UK",
  "New York, USA",
  "Dublin, Ireland",
  "Sicily, Italy",
  "Paris, France",
  "Berlin, Germany",
  "Rome, Italy",
  "Madrid, Spain",
  "Sydney, Australia",
  "Toronto, Canada",
  "Brooklyn, NY",
  "Chicago, IL"
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, people, profiles, loading: contextLoading } = useFamily();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [placePopoverOpen, setPlacePopoverOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    bio: '',
    relatedTo: [] as string[]
  });

  // Pre-fill data if it exists
  useEffect(() => {
    if (user && profiles[user.id]) {
      const profile = profiles[user.id];
      const person = people.find(p => p.userId === user.id);
      
      setFormData({
        firstName: profile.first_name || '',
        middleName: profile.middle_name || '',
        lastName: profile.last_name || '',
        birthDate: profile.birth_date || '',
        birthPlace: profile.birth_place || '',
        bio: profile.bio || person?.vibeSentence || '',
        relatedTo: [] 
      });
    }
  }, [user, profiles, people]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleRelation = (personId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedTo: prev.relatedTo.includes(personId) 
        ? prev.relatedTo.filter(id => id !== personId)
        : [...prev.relatedTo, personId].slice(0, 2)
    }));
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
          middle_name: formData.middleName,
          last_name: formData.lastName,
          birth_date: formData.birthDate || null,
          birth_place: formData.birthPlace,
          bio: formData.bio,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 2. Create/Update Person record for the user
      const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');
      const { data: personData, error: personError } = await supabase
        .from('people')
        .upsert({
          user_id: user.id,
          name: fullName || user.email?.split('@')[0],
          birth_year: formData.birthDate ? formData.birthDate.split('-')[0] : '',
          birth_place: formData.birthPlace,
          vibe_sentence: formData.bio || "A member of the family archive.",
          personality_tags: ["✨ Family Member"],
          created_by_email: user.email,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (personError) throw personError;

      // 3. Create Relationships
      if (formData.relatedTo.length > 0 && personData) {
        const relations = formData.relatedTo.map(relatedId => ({
          person_id: personData.id,
          related_person_id: relatedId,
          relationship_type: 'family'
        }));

        await supabase.from('relationships').insert(relations);
      }

      toast.success("Profile updated successfully!");
      navigate('/');
    } catch (error: any) {
      toast.error("Something went wrong: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (contextLoading) return null;

  const steps = [
    { title: "Your Identity", description: "How should the family address you?", icon: <User className="w-6 h-6" /> },
    { title: "Your Roots", description: "Where and when did your story begin?", icon: <Calendar className="w-6 h-6" /> },
    { title: "Connections", description: "Who are you closest to in this archive?", icon: <Users className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-12">
        <div className="flex items-center justify-between px-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500",
                step > i + 1 ? "bg-amber-600 text-white" : 
                step === i + 1 ? "bg-stone-800 text-white shadow-lg scale-110" : 
                "bg-stone-100 text-stone-400"
              )}>
                {step > i + 1 ? <Check className="w-5 h-5" /> : s.icon}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-[2px] w-12 rounded-full", step > i + 1 ? "bg-amber-200" : "bg-stone-100")} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif font-medium text-stone-800">{steps[step-1].title}</h1>
          <p className="text-stone-500 italic text-lg">{steps[step-1].description}</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 min-h-[400px] flex flex-col">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-widest text-stone-400">First Name</label>
                <Input value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="e.g. Elizabeth" className="h-14 bg-stone-50 border-none rounded-2xl text-lg focus-visible:ring-amber-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-widest text-stone-400">Middle Name(s)</label>
                <Input value={formData.middleName} onChange={(e) => updateField('middleName', e.target.value)} placeholder="e.g. Rose" className="h-14 bg-stone-50 border-none rounded-2xl text-lg focus-visible:ring-amber-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-widest text-stone-400">Last Name</label>
                <Input value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="e.g. Bennett" className="h-14 bg-stone-50 border-none rounded-2xl text-lg focus-visible:ring-amber-500/20" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-widest text-stone-400">Birth Date</label>
                <Input type="date" value={formData.birthDate} onChange={(e) => updateField('birthDate', e.target.value)} className="h-14 bg-stone-50 border-none rounded-2xl text-lg focus-visible:ring-amber-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-widest text-stone-400">Birth Place</label>
                <Popover open={placePopoverOpen} onOpenChange={setPlacePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={placePopoverOpen}
                      className="w-full justify-between bg-stone-50 border-none rounded-2xl h-14 text-lg font-normal text-stone-600 hover:bg-stone-100 focus:ring-amber-500/20"
                    >
                      {formData.birthPlace || "Select or type..."}
                      <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 rounded-2xl border-stone-100 shadow-xl">
                    <Command className="rounded-2xl">
                      <CommandInput 
                        placeholder="Search or type place..." 
                        value={formData.birthPlace}
                        onValueChange={(val) => updateField('birthPlace', val)}
                      />
                      <CommandList>
                        <CommandEmpty>No common place found. Keep typing...</CommandEmpty>
                        <CommandGroup heading="Suggestions">
                          {COMMON_PLACES.map((place) => (
                            <CommandItem
                              key={place}
                              value={place}
                              onSelect={() => {
                                updateField('birthPlace', place);
                                setPlacePopoverOpen(false);
                              }}
                              className="rounded-xl"
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
                <label className="text-xs font-medium uppercase tracking-widest text-stone-400">A short bio or "vibe"</label>
                <Textarea value={formData.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder="e.g. Lover of old books and strong tea..." className="min-h-[120px] bg-stone-50 border-none rounded-2xl text-lg font-serif focus-visible:ring-amber-500/20" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <p className="text-stone-400 text-sm text-center">Select up to 2 people you are related to.</p>
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {people.filter(p => p.userId !== user?.id).map(p => (
                  <button key={p.id} onClick={() => toggleRelation(p.id)} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left", formData.relatedTo.includes(p.id) ? "border-amber-500 bg-amber-50" : "border-stone-50 bg-stone-50 hover:border-stone-200")}>
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-stone-200 shrink-0">
                      {p.photoUrl && <img src={p.photoUrl} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">{p.name}</p>
                      <p className="text-xs text-stone-400">{p.birthYear}</p>
                    </div>
                    {formData.relatedTo.includes(p.id) && <Check className="w-5 h-5 text-amber-600" />}
                  </button>
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
              disabled={isSaving}
              className="flex-1 h-14 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-lg font-medium group"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                step < 3 ? (
                  <>Next Step <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                ) : "Save Profile"
              )}
            </Button>
          </div>
        </div>
        <p className="text-center text-stone-300 text-xs uppercase tracking-widest">All information is optional. You can skip anything.</p>
      </div>
    </div>
  );
};

export default Onboarding;