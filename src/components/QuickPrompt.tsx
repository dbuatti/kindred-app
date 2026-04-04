"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Sparkles, Check, X, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const PROMPT_FIELDS = [
  { id: 'birth_place', label: 'Where was {name} born?', placeholder: 'e.g. Melbourne, Australia' },
  { id: 'occupation', label: "What was {name}'s main job?", placeholder: 'e.g. Teacher, Nurse...' },
  { id: 'nickname', label: "Did {name} have a nickname?", placeholder: 'e.g. "Bibi" or "Skip"' },
  { id: 'middle_name', label: "What is {name}'s middle name?", placeholder: 'e.g. Maria' },
  { id: 'maiden_name', label: "What was {name}'s maiden name?", placeholder: 'Family name at birth', condition: (p: any) => p.gender?.toLowerCase() === 'female' },
  { id: 'vibe_sentence', label: "How would you describe {name} in one sentence?", placeholder: 'e.g. A lover of books and quiet mornings.' },
];

const QuickPrompt = () => {
  const { people, relationships, user, addSuggestion, updatePerson, isAdmin } = useFamily();
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Find the user's own person record
  const myPerson = useMemo(() => people.find(p => p.userId === user?.id), [people, user]);

  // 2. Generate quests (Self first, then immediate relatives)
  const potentialQuests = useMemo(() => {
    const quests: any[] = [];
    if (!myPerson) return [];

    // Priority 1: User's own missing info
    PROMPT_FIELDS.forEach(field => {
      const isMissing = !myPerson[field.id as keyof typeof myPerson];
      const conditionMet = !field.condition || field.condition(myPerson);
      if (isMissing && conditionMet) {
        quests.push({
          person: myPerson,
          field: field.id,
          label: field.label.replace('{name}', 'you'),
          placeholder: field.placeholder,
          isSelf: true
        });
      }
    });

    // Priority 2: Immediate relatives
    const immediateTypes = ['mother', 'father', 'sister', 'brother', 'son', 'daughter', 'spouse', 'wife', 'husband'];
    const immediateRelatives = relationships
      .filter(r => (r.person_id === myPerson.id || r.related_person_id === myPerson.id) && 
                   immediateTypes.includes(r.relationship_type.toLowerCase()))
      .map(r => {
        const relId = r.person_id === myPerson.id ? r.related_person_id : r.person_id;
        return people.find(p => p.id === relId);
      })
      .filter((p): p is any => !!p);

    immediateRelatives.forEach(rel => {
      PROMPT_FIELDS.forEach(field => {
        const isMissing = !rel[field.id as keyof typeof rel];
        const conditionMet = !field.condition || field.condition(rel);
        if (isMissing && conditionMet) {
          quests.push({
            person: rel,
            field: field.id,
            label: field.label.replace('{name}', rel.name.split(' ')[0]),
            placeholder: field.placeholder,
            isSelf: false
          });
        }
      });
    });

    return quests;
  }, [myPerson, people, relationships]);

  const currentQuest = potentialQuests[currentIndex % potentialQuests.length];

  const handleSave = async () => {
    if (!answer.trim() || !currentQuest) return;

    setIsSaving(true);
    try {
      // If it's the user's own profile, they can update it directly
      if (currentQuest.isSelf || isAdmin) {
        await updatePerson(currentQuest.person.id, { [currentQuest.field]: answer });
        toast.success("Your profile has been updated!");
      } else {
        await addSuggestion({
          personId: currentQuest.person.id,
          fieldName: currentQuest.field,
          suggestedValue: answer,
          suggestedByEmail: user?.email || 'family@kindred.com'
        });
        toast.success("Suggestion sent to the family inbox!");
      }
      setAnswer('');
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      toast.error("Couldn't save that. Try again?");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentQuest) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white border-4 border-amber-100 rounded-[2rem] p-4 md:p-6 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-8">
        <div className="flex items-center gap-4 shrink-0">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em]">
              {currentQuest.isSelf ? "Complete Your Profile" : "Family Quest"}
            </p>
            <h3 className="text-lg font-serif font-bold text-stone-800 leading-tight">
              {currentQuest.label}
            </h3>
          </div>
        </div>

        <div className="flex-1 w-full relative">
          <Input 
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={currentQuest.placeholder}
            className="h-14 bg-stone-50 border-none rounded-2xl px-6 text-lg focus-visible:ring-amber-500/20 pr-32"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button 
              onClick={handleSave}
              disabled={!answer.trim() || isSaving}
              className="h-10 px-4 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest gap-2"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => { setAnswer(''); setCurrentIndex(prev => prev + 1); }}
            className="p-3 text-stone-300 hover:text-stone-500 transition-colors rounded-full hover:bg-stone-50"
            title="Skip question"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickPrompt;