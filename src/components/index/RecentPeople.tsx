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
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
        <Clock className="w-3 h-3" />
        Recently Visited
      </div>
      <div className="flex flex-wrap gap-3">
        {people.map(p => (
          <button 
            key={p.id}
            onClick={() => navigate(getPersonUrl(p.id, p.name))}
            className="flex items-center gap-3 bg-white border border-stone-100 px-4 py-2 rounded-full shadow-sm hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
          >
            <div className="h-6 w-6 rounded-full overflow-hidden bg-stone-100">
              {p.photoUrl ? (
                <img src={p.photoUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0" />
              ) : (
                <UserCircle className="w-full h-full text-stone-300" />
              )}
            </div>
            <span className="text-sm font-medium text-stone-700">{p.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default RecentPeople;