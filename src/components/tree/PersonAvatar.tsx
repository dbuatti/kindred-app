"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Info, Bug, Heart, Users2, Skull, MapPin, Briefcase } from 'lucide-react';
import { cn, formatDisplayName } from '@/lib/utils';
import { getPersonUrl } from '@/lib/slugify';
import QuickAddMenu from '../QuickAddMenu';
import SmartSuggestionHover from '../SmartSuggestionHover';

interface PersonAvatarProps {
  person: any;
  me: any;
  relationships: any[];
  isHighlighted?: boolean;
  isInLineage?: boolean;
  isSelected?: boolean;
  debugMode?: boolean;
  level?: number;
  onSelect: (id: string) => void;
  settings?: {
    showDates: boolean;
    showPlaces: boolean;
    showOccupation: boolean;
  };
}

const PersonAvatar = ({ 
  person, 
  me, 
  relationships, 
  isHighlighted, 
  isInLineage, 
  isSelected, 
  debugMode, 
  level, 
  onSelect,
  settings = { showDates: true, showPlaces: false, showOccupation: false }
}: PersonAvatarProps) => {
  const navigate = useNavigate();
  
  const isMe = me && person.id === me.id;

  const getLabel = () => {
    if (isMe) return "You";

    const directRel = relationships.find(r => 
      (r.person_id === me?.id && r.related_person_id === person.id) || 
      (r.person_id === person.id && r.related_person_id === me?.id)
    );
    if (directRel) return directRel.relationship_type;
    
    const myParents = relationships
      .filter(r => (r.person_id === me?.id || r.related_person_id === me?.id) && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
      .map(r => r.person_id === me?.id ? r.related_person_id : r.person_id);

    const myUnclesAunts = relationships
      .filter(r => {
        const isSibling = ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase());
        return isSibling && (myParents.includes(r.person_id) || myParents.includes(r.related_person_id));
      })
      .map(r => myParents.includes(r.person_id) ? r.related_person_id : r.person_id);

    const isCousin = relationships.some(r => {
      const isChild = ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase());
      const isParent = ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase());
      return (isChild && myUnclesAunts.includes(r.person_id) && r.related_person_id === person.id) ||
             (isParent && myUnclesAunts.includes(r.related_person_id) && r.person_id === person.id);
    });

    if (isCousin) return "Cousin";
    
    return "Family";
  };

  const label = getLabel();
  const isCousin = label.toLowerCase().includes('cousin');
  const isDeceased = person.isLiving === false;

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onSelect(person.id);
      }} 
      className="flex flex-col items-center space-y-3 cursor-pointer group relative"
    >
      <QuickAddMenu personId={person.id} personName={person.name} />
      <SmartSuggestionHover personId={person.id} />
      
      <div className={cn(
        "h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-4 shadow-lg ring-2 transition-all duration-500 relative",
        isSelected ? "border-amber-600 ring-amber-300 scale-110 z-20 shadow-amber-200" :
        isHighlighted ? "border-amber-500 ring-amber-200 scale-105 z-20" : 
        isInLineage ? "border-amber-200 ring-amber-50 shadow-amber-100" :
        isCousin ? "border-stone-100 ring-stone-50 grayscale-[0.3]" :
        "border-white ring-stone-100 group-hover:ring-amber-400"
      )}>
        {person.photoUrl ? (
          <img src={person.photoUrl} className={cn("w-full h-full object-cover transition-all duration-700", isDeceased ? "grayscale-[0.6]" : "grayscale-[0.2] group-hover:grayscale-0")} />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
            <UserCircle className="w-10 h-10" />
          </div>
        )}
        
        {isDeceased && (
          <div className="absolute top-1 right-1 bg-stone-800/60 p-1 rounded-full">
            <Skull className="w-3 h-3 text-white/80" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <Info className="w-6 h-6 text-white" />
        </div>

        {debugMode && (
          <div className="absolute inset-0 bg-stone-900/80 flex flex-col items-center justify-center p-2 text-[8px] text-amber-400 font-mono leading-tight">
            <Bug className="w-3 h-3 mb-1" />
            <p className="truncate w-full text-center">ID: {person.id.substring(0, 6)}</p>
            <p>LVL: {level}</p>
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <h3 className={cn(
          "font-serif font-bold text-xs md:text-sm transition-colors",
          isSelected ? "text-amber-800" : isHighlighted ? "text-amber-700" : "text-stone-800"
        )}>
          {formatDisplayName(person.name)}
        </h3>
        <div className="flex flex-col items-center gap-0.5">
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest inline-block",
            isMe ? "bg-amber-100 text-amber-700" : 
            isCousin ? "bg-stone-100 text-stone-400" : "bg-stone-50 text-stone-400"
          )}>
            {label}
          </div>
          
          {settings.showDates && (person.birthYear || person.deathYear) && (
            <span className="text-[8px] text-stone-400 font-medium">
              {person.birthYear || '?'}{isDeceased ? `—${person.deathYear || '?'}` : ''}
            </span>
          )}

          {settings.showPlaces && person.birthPlace && (
            <div className="flex items-center gap-1 text-[8px] text-stone-400">
              <MapPin className="w-2 h-2" />
              <span className="truncate max-w-[80px]">{person.birthPlace}</span>
            </div>
          )}

          {settings.showOccupation && person.occupation && (
            <div className="flex items-center gap-1 text-[8px] text-stone-400">
              <Briefcase className="w-2 h-2" />
              <span className="truncate max-w-[80px]">{person.occupation}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonAvatar;