"use client";

import React, { useMemo } from 'react';
import { Person } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ChevronRight,
  Calendar,
  MapPin,
  Briefcase,
  User,
  Camera,
  Quote,
  Heart,
  GraduationCap,
  Shield,
  Eye,
  Utensils,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SuggestionDialog from './SuggestionDialog';

interface ProfileChecklistProps {
  person: Person;
}

const ProfileChecklist = ({ person }: ProfileChecklistProps) => {
  const items = useMemo(() => {
    const checklist = [
      { id: 'photo_url', label: 'Add a profile photo', value: person.photoUrl, icon: Camera },
      { id: 'vibe_sentence', label: 'Write a short bio', value: person.vibeSentence && person.vibeSentence.length > 10, icon: Quote },
      { id: 'birth_date', label: 'Confirm your birth date', value: person.birthDate, icon: Calendar },
      { id: 'birth_place', label: 'Add your birthplace', value: person.birthPlace, icon: MapPin },
      { id: 'occupation', label: 'Share your occupation', value: person.occupation, icon: Briefcase },
      { id: 'nickname', label: 'Add a nickname', value: person.nickname, icon: Tag },
      { id: 'middle_name', label: 'Add your middle name', value: person.middleName, icon: User },
      { id: 'education', label: 'Add your education', value: person.educationRecords && person.educationRecords.length > 0, icon: GraduationCap },
      { id: 'favorite_things', label: 'Share your favorite things', value: person.favoriteThings, icon: Utensils },
    ];

    if (person.gender?.toLowerCase() === 'female') {
      checklist.splice(2, 0, { id: 'maiden_name', label: 'Add your maiden name', value: person.maidenName, icon: Heart });
    }

    return checklist;
  }, [person]);

  const completedCount = items.filter(i => i.value).length;
  const totalCount = items.length;
  const isComplete = completedCount === totalCount;

  if (isComplete) return null;

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-stone-100 shadow-sm overflow-hidden">
      <div className="p-8 bg-amber-50/30 border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-amber-700">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-serif font-bold text-xl">Your Profile Quest</h3>
          </div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm">
            {completedCount} / {totalCount} Done
          </span>
        </div>
        <p className="text-stone-500 text-sm leading-relaxed italic">
          Help the family get to know you better. Complete these small tasks at your own pace.
        </p>
      </div>

      <div className="divide-y divide-stone-50">
        {items.map((item) => (
          <SuggestionDialog 
            key={item.id}
            person={person}
            initialField={item.id}
            trigger={
              <button className={cn(
                "w-full flex items-center justify-between p-5 hover:bg-stone-50 transition-colors group text-left",
                item.value && "opacity-60"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    item.value ? "bg-green-50 text-green-500" : "bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-600"
                  )}>
                    {item.value ? <CheckCircle2 className="w-5 h-5" /> : <item.icon className="w-5 h-5" />}
                  </div>
                  <span className={cn(
                    "text-base font-medium transition-colors",
                    item.value ? "text-stone-400 line-through" : "text-stone-700 group-hover:text-stone-900"
                  )}>
                    {item.label}
                  </span>
                </div>
                {!item.value && <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 transition-all group-hover:translate-x-1" />}
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default ProfileChecklist;