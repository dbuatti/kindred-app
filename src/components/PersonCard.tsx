import React from 'react';
import { Person } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Quote, MessageSquare, History, MapPin, Calendar, Share2, Users, ArrowRight } from 'lucide-react';
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
      toast.success("Link copied to clipboard!", {
        icon: <Share2 className="w-4 h-4 text-amber-600" />
      });
    }
  };

  let birthDisplay = person.birthYear;
  if (!birthDisplay && person.birthDate) {
    const match = person.birthDate.match(/\d{4}/);
    birthDisplay = match ? match[0] : formatFamilyDate(person.birthDate);
  } else if (!birthDisplay) {
    birthDisplay = 'Year Unknown';
  }

  const connectionSummary = relatives
    .sort((a, b) => {
      const priority = ['mother', 'father', 'spouse', 'wife', 'husband', 'parent'];
      const aPrio = priority.some(p => a.type.toLowerCase().includes(p)) ? 0 : 1;
      const bPrio = priority.some(p => b.type.toLowerCase().includes(p)) ? 0 : 1;
      return aPrio - bPrio;
    })
    .slice(0, 2)
    .map(r => {
      const type = r.type.charAt(0).toUpperCase() + r.type.slice(1).toLowerCase();
      return `${type} of ${r.name.split(' ')[0]}`;
    })
    .join(' • ');

  return (
    <Card 
      onClick={onClick}
      className="group overflow-hidden border-none bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer rounded-[2rem] hover:-translate-y-1"
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-56 aspect-[4/5] md:aspect-auto overflow-hidden shrink-0">
          {person.photoUrl ? (
            <img 
              src={person.photoUrl} 
              alt={person.name}
              className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
              <History className="w-12 h-12 text-stone-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent md:hidden" />
          
          <div className="absolute bottom-4 left-4 md:hidden">
            <Badge className="bg-amber-500 text-white border-none rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {birthDisplay}
            </Badge>
          </div>
        </div>

        <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <h3 className="text-3xl font-serif font-medium text-stone-800 group-hover:text-amber-900 transition-colors leading-tight">
                  {highlightText(formatDisplayName(person.name), searchQuery || '')}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5" /> {birthDisplay}
                  </span>
                  {person.birthPlace && (
                    <span className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg">
                      <MapPin className="w-3.5 h-3.5" /> {person.birthPlace}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="p-2.5 rounded-full bg-stone-50 text-stone-300 hover:text-amber-600 hover:bg-amber-50 transition-all"
                  title="Share profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {connectionSummary && (
              <div className="flex items-center gap-3 text-stone-500 text-sm font-medium bg-stone-50/50 p-4 rounded-2xl border border-stone-100/50 group-hover:bg-amber-50/30 transition-colors">
                <Users className="w-4.5 h-4.5 text-stone-400 shrink-0" />
                <span className="italic leading-relaxed">{connectionSummary}</span>
              </div>
            )}

            {person.vibeSentence && person.vibeSentence.trim() !== "" && (
              <div className="relative">
                <Quote className="absolute -left-3 -top-3 w-10 h-10 text-amber-600/5" />
                <p className="text-stone-600 italic font-serif leading-relaxed line-clamp-2 pl-5 border-l-2 border-amber-100 text-lg">
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
                  className="bg-stone-50 text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-600 border-none rounded-full px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 text-stone-300 group-hover:text-amber-600 transition-colors">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                <MessageSquare className="w-4 h-4" /> {person.memories.length}
              </span>
              <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonCard;