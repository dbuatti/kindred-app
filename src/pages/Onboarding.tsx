"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  UserPlus,
  Search
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

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

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, people, loading: contextLoading } = useFamily();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
          birth_date: formData.birthDate || null,
          birth_place: formData.birthPlace,
          bio: formData.bio,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // 2. Upsert Person record (prevents 409 Conflict)
      const personData = {
        user_id: user.id,
        name: fullName,
        birth_year: formData.birthDate ? formData.birthDate.split('-')[0] : '',
        birth_place: formData.birthPlace,
        vibe_sentence: formData.bio || "A member of the family archive.",
        personality_tags: ["✨ Family Member"],
        created_by_email: user.email,
      };

      const { data: person, error: pErr } = await supabase
        .from('people')
        .upsert(personData, { onConflict: 'user_id' })
        .select()
        .single();

      if (pErr) throw pErr;
      const myPersonId = person.id;

      // 3. Add Relatives
      for (const rel of formData.newRelatives) {
        const { data: relPerson, error: relErr } = await supabase
          .from('people')
          .insert({
            name: rel.name,
            vibe_sentence: `A beloved ${rel.type} in our family.`,
            personality_tags: [rel.type],
            created_by_email: user.email
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

      toast.success("Welcome to the family archive!");
      navigate('/');
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
                        toast.success(`Found you! We've linked your profile to ${found.name}.`);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase">First Name or Nickname</label>
                    <Input 
                      value={formData.firstName} 
                      onChange={(e) => updateField('firstName', e.target.value)} 
                      placeholder="e.g. Mary or Aunt Mary"
                      className="h-14 bg-stone-50 border-none rounded-2xl text-lg" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase">Last Name (Optional)</label>
                    <Input 
                      value={formData.lastName} 
                      onChange={(e) => updateField('lastName', e.target.value)} 
                      placeholder="If you know it"
                      className="h-14 bg-stone-50 border-none rounded-2xl text-lg" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase">Birth Date (Optional)</label>
                <Input type="date" value={formData.birthDate} onChange={(e) => updateField('birthDate', e.target.value)} className="h-14 bg-stone-50 border-none rounded-2xl text-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase">Birth Place (Optional)</label>
                <Input value={formData.birthPlace} onChange={(e) => updateField('birthPlace', e.target.value)} placeholder="City, Country" className="h-14 bg-stone-50 border-none rounded-2xl text-lg" />
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
                <p className="text-sm text-stone-400 font-medium">Add relatives who aren't here yet (Nicknames are fine!):</p>
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