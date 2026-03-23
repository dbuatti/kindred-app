import React from 'react';
import { Person } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Quote, Mic, MessageSquare, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonCardProps {
  person: Person;
  onClick?: () => void;
}

const PersonCard = ({ person, onClick }: PersonCardProps) => {
  return (
    <Card 
      onClick={onClick}
      className="group overflow-hidden border-none bg-stone-50/50 shadow-sm hover:shadow-md transition-all duration-500 cursor-pointer rounded-3xl"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {person.photoUrl ? (
          <img 
            src={person.photoUrl} 
            alt={person.name}
            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full bg-stone-200 flex items-center justify-center">
            <History className="w-12 h-12 text-stone-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <h3 className="text-2xl font-serif font-medium leading-tight">{person.name}</h3>
          <p className="text-sm opacity-90 font-light">
            {person.birthYear} {person.birthPlace && `• ${person.birthPlace}`}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Quote className="w-5 h-5 text-amber-600 shrink-0 mt-1 opacity-50" />
          <p className="text-stone-700 italic font-serif leading-relaxed">
            {person.vibeSentence}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {person.personalityTags.map(tag => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="bg-stone-200/50 text-stone-700 hover:bg-stone-200 border-none rounded-full px-3 py-1 text-xs font-normal"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="pt-4 flex items-center justify-between text-stone-400 text-xs border-t border-stone-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> {person.memories.length}
            </span>
            <span className="flex items-center gap-1">
              <Mic className="w-3 h-3" /> {person.memories.filter(m => m.type === 'voice').length}
            </span>
          </div>
          <span>Added by {person.createdByEmail.split('@')[0]}</span>
        </div>
      </div>
    </Card>
  );
};

export default PersonCard;