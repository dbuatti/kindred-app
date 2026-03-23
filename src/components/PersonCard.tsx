import React from 'react';
import { Person } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Quote, Mic, MessageSquare, History, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonCardProps {
  person: Person;
  onClick?: () => void;
}

const PersonCard = ({ person, onClick }: PersonCardProps) => {
  return (
    <Card 
      onClick={onClick}
      className="group overflow-hidden border-none bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer rounded-[2.5rem]"
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-48 aspect-[4/5] md:aspect-auto overflow-hidden shrink-0">
          {person.photoUrl ? (
            <img 
              src={person.photoUrl} 
              alt={person.name}
              className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
            />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
              <History className="w-10 h-10 text-stone-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent md:hidden" />
        </div>

        <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif font-medium text-stone-800 group-hover:text-amber-900 transition-colors">
                {person.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 font-medium uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {person.birthYear || 'Unknown'}
                </span>
                {person.birthPlace && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {person.birthPlace}
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <Quote className="absolute -left-2 -top-2 w-8 h-8 text-amber-600/5" />
              <p className="text-stone-600 italic font-serif leading-relaxed line-clamp-2 pl-4 border-l-2 border-amber-100">
                {person.vibeSentence}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-stone-50">
            <div className="flex flex-wrap gap-2">
              {person.personalityTags.slice(0, 2).map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="bg-stone-100 text-stone-500 hover:bg-stone-200 border-none rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-tighter"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3 text-stone-300">
              <span className="flex items-center gap-1 text-[10px] font-bold">
                <MessageSquare className="w-3 h-3" /> {person.memories.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonCard;