"use client";

import React from 'react';
import { Person } from '@/types';
import { Card } from '@/components/ui/card';
import { 
  User, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Tag, 
  Heart, 
  Skull, 
  GraduationCap, 
  Shield, 
  Eye, 
  Utensils,
  Info,
  Fingerprint
} from 'lucide-react';
import { cn, formatFamilyDate } from '@/lib/utils';

interface PersonDetailsGridProps {
  person: Person;
}

const PersonDetailsGrid = ({ person }: PersonDetailsGridProps) => {
  const sections = [
    {
      title: "Identity",
      icon: Fingerprint,
      items: [
        { label: "Full Name", value: person.name, icon: User },
        { label: "Middle Name", value: person.middleName, icon: User },
        { label: "Nickname", value: person.nickname, icon: Tag },
        { label: "Maiden Name", value: person.maidenName, icon: Heart },
        { label: "Gender", value: person.gender, icon: User },
      ]
    },
    {
      title: "Life Events",
      icon: Calendar,
      items: [
        { label: "Birth Date", value: person.birthDate || person.birthYear, icon: Calendar },
        { label: "Birth Place", value: person.birthPlace, icon: MapPin },
        { label: "Occupation", value: person.occupation, icon: Briefcase },
      ]
    },
    {
      title: "Passing",
      icon: Skull,
      condition: !person.isLiving,
      items: [
        { label: "Date of Passing", value: person.deathDate || person.deathYear, icon: Skull },
        { label: "Place of Passing", value: person.deathPlace, icon: MapPin },
        { label: "Final Resting Place", value: person.burialPlace, icon: MapPin },
      ]
    },
    {
      title: "Legacy & Traits",
      icon: Info,
      items: [
        { label: "Education", value: person.education, icon: GraduationCap },
        { label: "Military Service", value: person.militaryService, icon: Shield },
        { label: "Physical Traits", value: person.physicalTraits, icon: Eye },
        { label: "Favorite Things", value: person.favoriteThings, icon: Utensils },
      ]
    }
  ];

  // Filter out sections that have no items with values
  const activeSections = sections.filter(section => {
    if (section.condition === false) return false;
    return section.items.some(item => item.value && item.value.trim() !== "");
  });

  if (activeSections.length === 0) return null;

  return (
    <section className="space-y-8 py-12 border-t border-stone-100">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
          <Info className="w-5 h-5" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-stone-800">Archive Record</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {activeSections.map((section) => (
          <Card key={section.title} className="p-8 rounded-[2.5rem] border-none bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-stone-50 pb-4">
              <section.icon className="w-5 h-5 text-amber-600" />
              <h3 className="text-xl font-serif font-bold text-stone-800">{section.title}</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {section.items.filter(i => i.value && i.value.trim() !== "").map((item) => (
                <div key={item.label} className="flex items-start gap-4 group">
                  <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-300 group-hover:text-amber-600 group-hover:bg-amber-50 transition-colors shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{item.label}</p>
                    <p className="text-lg text-stone-700 font-medium leading-tight">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default PersonDetailsGrid;