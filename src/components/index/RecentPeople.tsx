"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, UserCircle } from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { Person } from '@/types';

interface RecentPeopleProps {
  people: Person[];
}

const RecentPeople = ({ people }: RecentPeopleProps) => {
  const navigate = useNavigate();

  if (people.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] px-2">
        <Clock className="w-3 h-3" />
        Quick Jump
      </div>
      <div className="flex items-center gap-6 overflow-x-auto pb-2 no-scrollbar px-2">
        {people.map(p => (
          <button 
            key={p.id}
            onClick={() => navigate(getPersonUrl(p.id, p.name))}
            className="flex flex-col items-center gap-2 shrink-0 group transition-transform active:scale-95"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-stone-100 group-hover:ring-amber-400 transition-all duration-500">
                {p.photoUrl ? (
                  <img src={p.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" />
                ) : (
                  <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-300">
                    <UserCircle className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white shadow-sm border border-stone-50 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
              </div>
            </div>
            <span className="text-[10px] font-bold text-stone-500 group-hover:text-stone-800 uppercase tracking-widest transition-colors">
              {p.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default RecentPeople;