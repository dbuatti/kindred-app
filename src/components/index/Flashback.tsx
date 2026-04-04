"use client";

import React, { useMemo } from 'react';
import { useFamily } from '../../context/FamilyContext';
import { Card } from '../ui/card';
import { History, ArrowRight, Quote, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPersonUrl } from '@/lib/slugify';
import { format, isSameDay, parseISO } from 'date-fns';

const Flashback = () => {
  const { people } = useFamily();
  const navigate = useNavigate();

  const flashback = useMemo(() => {
    const today = new Date();
    const all = people.flatMap(p => 
      p.memories.map(m => ({ ...m, personName: p.name, personId: p.id }))
    );

    // Look for memories from this day in any previous year
    const matches = all.filter(m => {
      const mDate = parseISO(m.createdAt);
      return mDate.getMonth() === today.getMonth() && 
             mDate.getDate() === today.getDate() && 
             mDate.getFullYear() < today.getFullYear();
    });

    if (matches.length === 0) return null;
    return matches[Math.floor(Math.random() * matches.length)];
  }, [people]);

  if (!flashback) return null;

  const yearsAgo = new Date().getFullYear() - new Date(flashback.createdAt).getFullYear();

  return (
    <Card 
      onClick={() => navigate(getPersonUrl(flashback.personId, flashback.personName))}
      className="bg-white border-stone-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
      
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            <History className="w-4 h-4" />
            On This Day, {yearsAgo} {yearsAgo === 1 ? 'Year' : 'Years'} Ago
          </div>
          <Sparkles className="w-4 h-4 text-amber-200" />
        </div>

        <div className="space-y-4">
          <Quote className="w-8 h-8 text-stone-100" />
          <p className="text-2xl font-serif italic text-stone-700 leading-tight line-clamp-3">
            "{flashback.content}"
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stone-50">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">About</p>
            <p className="text-lg font-serif text-stone-800">{flashback.personName}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Flashback;