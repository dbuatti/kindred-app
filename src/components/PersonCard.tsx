import React from 'react';
import { Person } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Quote, MessageSquare, History, MapPin, Calendar, Share2, Users } from 'lucide-react';
import { cn, formatDisplayName, formatFamilyDate } from '@/lib/utils';
import { toast } from 'sonner';
import { getPersonUrl } from '@/lib/slugify';

interface PersonCardProps {
  person: Person;
  relatives?: any[];
  onClick?: () => void;
  searchQuery?: string;
}

const PersonCard = ({ person, relatives = [], onClick, searchQuery }: PersonCardProps) => {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-100 text-amber-900 rounded-sm px-0.5">{part}</mark>
          ) : part
        )}
      </span>
    );
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${getPersonUrl(person.id, person.name)}`;
    if (navigator.share) {
      navigator.share({ title: person.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const birthDisplay = person.birthDate ? formatFamilyDate(person.birthDate) : (person.birthYear || 'Unknown Year');

  // Create a summary of relatives, prioritizing parents/spouses but including others like cousins
  const connectionSummary = relatives
    .sort((a, b) => {
      const priority = ['mother', 'father', 'spouse', 'wife', 'husband', 'parent'];
      const aPrio = priority.some(p => a.type.toLowerCase().includes(p)) ? 0 : 1;
      const bPrio = priority.some(p => b.type.toLowerCase().includes(p)) ? 0 : 1;
      return aPrio - bPrio;
    })
    .slice(0, 2)
    .map(r => `${r.type} of ${r.name.split(' ')[0]}`)
    .join(' • ');

  return (
    <Card 
      onClick={onClick}
      className="group overflow-hidden border-none bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer rounded-2xl"
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-48 aspect-[4/5] md:aspect-auto overflow-hidden shrink-0">
          {person.photoUrl ? (
            <img 
              src={person.photoUrl} 
              alt={person.name}
              className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
            />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
              <History className="w-10 h-10 text-stone-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent md:hidden" />
        </div>

        <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-serif font-medium text-stone-800 group-hover:text-amber-900 transition-colors">
                  {highlightText(formatDisplayName(person.name), searchQuery || '')}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Calendar className="w-3 h-3" /> {birthDisplay}
                  </span>
                  {person.birthPlace && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> {person.birthPlace}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-stone-50 text-stone-300 hover:text-amber-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {connectionSummary && (
              <div className="flex items-center gap-2 text-stone-500 text-sm font-medium bg-stone-50/50 p-3 rounded-xl border border-stone-100/50">
                <Users className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="italic">{connectionSummary}</span>
              </div>
            )}

            {person.vibeSentence && person.vibeSentence.trim() !== "" && (
              <div className="relative">
                <Quote className="absolute -left-2 -top-2 w-8 h-8 text-amber-600/5" />
                <p className="text-stone-600 italic font-serif leading-relaxed line-clamp-2 pl-4 border-l-2 border-amber-100 text-base">
                  {highlightText(person.vibeSentence, searchQuery || '')}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-stone-50">
            <div className="flex flex-wrap gap-2">
              {person.personalityTags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="bg-stone-100 text-stone-500 hover:bg-stone-200 border-none rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3 text-stone-300">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                <MessageSquare className="w-3.5 h-3.5" /> {person.memories.length} Stories
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonCard;