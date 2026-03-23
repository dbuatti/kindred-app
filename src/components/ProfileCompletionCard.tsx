"use client";

import React, { useMemo } from 'react';
import { Person } from '../types';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Briefcase, 
  User, 
  Camera, 
  Quote,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import SuggestionDialog from './SuggestionDialog';
import { cn } from '@/lib/utils';

interface ProfileCompletionCardProps {
  person: Person;
}

const ProfileCompletionCard = ({ person }: ProfileCompletionCardProps) => {
  const stats = useMemo(() => {
    const items = [
      { label: 'Birth Year', value: person.birthYear, icon: Calendar },
      { label: 'Birth Place', value: person.birthPlace, icon: MapPin },
      { label: 'Occupation', value: person.occupation, icon: Briefcase },
      { label: 'Gender', value: person.gender, icon: User },
      { label: 'Photo', value: person.photoUrl, icon: Camera },
      { label: 'Detailed Bio', value: person.vibeSentence && person.vibeSentence.length > 30, icon: Quote },
    ];

    const completedCount = items.filter(item => item.value).length;
    const percentage = Math.round((completedCount / items.length) * 100);
    const missing = items.filter(item => !item.value);

    return { percentage, missing, completedCount, total: items.length };
  }, [person]);

  if (stats.percentage === 100) return null;

  return (
    <section className="relative overflow-hidden bg-white rounded-[3rem] border-4 border-stone-100 shadow-sm p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-amber-600">
            <Sparkles className="w-6 h-6" />
            <h3 className="text-2xl font-serif font-bold text-stone-800">A Piece of the Puzzle</h3>
          </div>
          <p className="text-stone-500 text-lg leading-relaxed max-w-md">
            Our archive of <span className="font-bold text-stone-800">{person.name.split(' ')[0]}</span> is <span className="text-amber-700 font-bold">{stats.percentage}%</span> complete. Help us fill in the missing branches of our history.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="relative h-24 w-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-stone-100"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - stats.percentage / 100)}
                className="text-amber-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-serif font-bold text-stone-800">{stats.percentage}%</span>
          </div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Profile Strength</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
        {stats.missing.map((item) => (
          <div 
            key={item.label}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-100 group hover:bg-amber-50 hover:border-amber-100 transition-all duration-300"
          >
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-stone-300 group-hover:text-amber-600 shadow-sm transition-colors">
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center group-hover:text-amber-700">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-stone-50 relative z-10">
        <div className="flex items-center gap-2 text-stone-400 italic">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">Do you remember any of these details?</p>
        </div>
        <SuggestionDialog 
          person={person} 
          trigger={
            <Button className="h-14 px-8 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-lg font-bold shadow-lg gap-3 group">
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
              Add Missing Info
            </Button>
          }
        />
      </div>
    </section>
  );
};

export default ProfileCompletionCard;