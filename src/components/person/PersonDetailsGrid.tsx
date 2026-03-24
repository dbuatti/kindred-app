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
  Fingerprint,
  BookOpen
} from 'lucide-react';
import { cn, getFullLegalName } from '@/lib/utils';

interface PersonDetailsGridProps {
  person: Person;
}

interface DetailItem {
  label: string;
  value: string | React.ReactNode | undefined | null;
  icon: any;
  highlight?: boolean;
}

interface DetailSection {
  title: string;
  icon: any;
  condition?: boolean;
  items: DetailItem[];
}

const PersonDetailsGrid = ({ person }: PersonDetailsGridProps) => {
  const fullLegalName = getFullLegalName(person);
  const hasMiddleName = person.middleName && person.middleName.toLowerCase() !== 'na';

  const sections: DetailSection[] = [
    {
      title: "Identity",
      icon: Fingerprint,
      items: [
        { label: "Full Legal Name", value: fullLegalName, icon: User, highlight: hasMiddleName },
        { label: "Display Name", value: person.name, icon: User },
        { label: "Middle Name(s)", value: person.middleName, icon: Tag },
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
        { 
          label: "Education", 
          value: person.educationRecords && person.educationRecords.length > 0 ? (
            <div className="space-y-4 mt-2">
              {person.educationRecords.map((edu) => (
                <div key={edu.id} className="border-l-2 border-amber-100 pl-4 py-1">
                  <p className="font-bold text-stone-800">{edu.schoolName}</p>
                  <p className="text-sm text-stone-600">{edu.degree}</p>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {edu.location} {edu.startYear || edu.endYear ? `• ${edu.startYear || '?'}${edu.endYear ? ` — ${edu.endYear}` : ''}` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : person.education, 
          icon: GraduationCap 
        },
        { label: "Military Service", value: person.militaryService, icon: Shield },
        { label: "Physical Traits", value: person.physicalTraits, icon: Eye },
        { label: "Favorite Things", value: person.favoriteThings, icon: Utensils },
      ]
    }
  ];

  const activeSections = sections.filter(section => {
    if (section.condition === false) return false;
    return section.items.some(item => item.value && (typeof item.value === 'string' ? item.value.trim() !== "" : true));
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
              {section.items.filter(i => i.value && (typeof i.value === 'string' ? i.value.trim() !== "" : true)).map((item) => (
                <div key={item.label} className="flex items-start gap-4 group">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
                    item.highlight ? "bg-amber-50 text-amber-600" : "bg-stone-50 text-stone-300 group-hover:text-amber-600 group-hover:bg-amber-50"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{item.label}</p>
                    <div className={cn(
                      "text-lg text-stone-700 font-medium leading-tight",
                      item.highlight && "text-stone-900 font-bold"
                    )}>
                      {item.value}
                    </div>
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