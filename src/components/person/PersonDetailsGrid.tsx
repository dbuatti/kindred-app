"use client";

import React from 'react';
import { Person } from '@/types';
import { Card } from '@/components/ui/card';
import { 
  GraduationCap, 
  Shield, 
  Eye, 
  Utensils, 
  MapPin, 
  Heart, 
  Tag,
  Info,
  ScrollText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonDetailsGridProps {
  person: Person;
}

const PersonDetailsGrid = ({ person }: PersonDetailsGridProps) => {
  const details = [
    {
      id: 'education',
      label: 'Education & Mentors',
      value: person.education,
      icon: GraduationCap,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      id: 'military',
      label: 'Military Service',
      value: person.militaryService,
      icon: Shield,
      color: 'text-slate-600',
      bg: 'bg-slate-50'
    },
    {
      id: 'traits',
      label: 'Physical Traits',
      value: person.physicalTraits,
      icon: Eye,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      id: 'favorites',
      label: 'Favorite Things',
      value: person.favoriteThings,
      icon: Utensils,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    {
      id: 'burial',
      label: 'Final Resting Place',
      value: person.burialPlace,
      icon: MapPin,
      color: 'text-stone-600',
      bg: 'bg-stone-50',
      hide: person.isLiving
    }
  ].filter(d => d.value && !d.hide);

  if (details.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
          <ScrollText className="w-5 h-5" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-stone-800">The Full Record</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {details.map((detail) => (
          <Card 
            key={detail.id}
            className="p-8 rounded-[2.5rem] border-none bg-white shadow-sm hover:shadow-md transition-all duration-500 group relative overflow-hidden"
          >
            <div className={cn(
              "absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 opacity-20 transition-opacity group-hover:opacity-30",
              detail.bg
            )} />
            
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                  detail.bg,
                  detail.color
                )}>
                  <detail.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  {detail.label}
                </span>
              </div>
              
              <p className="text-xl font-serif text-stone-700 leading-relaxed italic">
                "{detail.value}"
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default PersonDetailsGrid;