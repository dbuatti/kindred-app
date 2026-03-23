"use client";

import React from 'react';
import { User, Skull, MapPin, Briefcase, Info, Target } from 'lucide-react';
import { cn, formatDisplayName } from '@/lib/utils';

interface PersonNodeProps {
  person: any;
  me: any;
  relationships: any[];
  isHighlighted?: boolean;
  isInLineage?: boolean;
  isSelected?: boolean;
  level?: number;
  onSelect: (id: string) => void;
  settings: {
    showDates: boolean;
    showPlaces: boolean;
    showOccupation: boolean;
  };
}

const PersonNode = ({ 
  person, 
  me, 
  relationships, 
  isHighlighted, 
  isInLineage, 
  isSelected, 
  onSelect,
  settings 
}: PersonNodeProps) => {
  const isMe = me && person.id === me.id;
  const isDeceased = person.isLiving === false;

  const getRole = () => {
    if (isMe) return "YOU";
    const rel = relationships.find(r => 
      (r.person_id === me?.id && r.related_person_id === person.id) || 
      (r.person_id === person.id && r.related_person_id === me?.id)
    );
    return rel ? rel.relationship_type.toUpperCase() : "RELATIVE";
  };

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onSelect(person.id);
      }}
      className={cn(
        "w-56 border-2 transition-all duration-200 cursor-pointer group relative bg-white",
        isSelected ? "border-amber-600 shadow-[4px_4px_0px_0px_rgba(217,119,6,1)] z-30" :
        isHighlighted ? "border-amber-500 shadow-[2px_2px_0px_0px_rgba(245,158,11,1)] z-20" :
        isInLineage ? "border-stone-800 bg-stone-50" : "border-stone-300 opacity-60"
      )}
    >
      {/* Header: Role & Status */}
      <div className={cn(
        "px-2 py-1 border-b-2 flex items-center justify-between text-[9px] font-bold tracking-tighter",
        isSelected ? "bg-amber-600 text-white border-amber-600" : "bg-stone-100 text-stone-600 border-stone-300"
      )}>
        <span className="flex items-center gap-1">
          {isMe && <Target className="w-3 h-3" />}
          {getRole()}
        </span>
        <span className="flex items-center gap-1">
          {isDeceased ? <Skull className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-green-500" />}
          {isDeceased ? "DECEASED" : "LIVING"}
        </span>
      </div>

      {/* Body: Name & Photo */}
      <div className="p-3 flex gap-3">
        <div className="w-12 h-12 border border-stone-200 bg-stone-50 shrink-0 overflow-hidden">
          {person.photoUrl ? (
            <img src={person.photoUrl} className={cn("w-full h-full object-cover", isDeceased && "grayscale")} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <User className="w-6 h-6" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-mono font-bold text-xs leading-tight truncate">
            {formatDisplayName(person.name)}
          </h3>
          {settings.showDates && (
            <p className="text-[10px] font-mono text-stone-500 mt-1">
              {person.birthYear || '????'} — {isDeceased ? (person.deathYear || '????') : 'PRESENT'}
            </p>
          )}
        </div>
      </div>

      {/* Footer: Facts */}
      {(settings.showPlaces || settings.showOccupation) && (
        <div className="px-3 pb-3 space-y-1 border-t border-stone-100 pt-2">
          {settings.showPlaces && person.birthPlace && (
            <div className="flex items-center gap-1.5 text-[9px] text-stone-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{person.birthPlace}</span>
            </div>
          )}
          {settings.showOccupation && person.occupation && (
            <div className="flex items-center gap-1.5 text-[9px] text-stone-500">
              <Briefcase className="w-3 h-3 shrink-0" />
              <span className="truncate">{person.occupation}</span>
            </div>
          )}
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -right-2 -top-2 bg-amber-600 text-white p-1 rounded-sm">
          <Info className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

export default PersonNode;