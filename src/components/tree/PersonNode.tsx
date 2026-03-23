"use client";

import React from 'react';
import { User, Skull, Target } from 'lucide-react';
import { cn, formatDisplayName } from '@/lib/utils';

interface PersonNodeProps {
  person: any;
  me: any;
  relationships: any[];
  isHighlighted?: boolean;
  isInLineage?: boolean;
  isSelected?: boolean;
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

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onSelect(person.id);
      }}
      className={cn(
        "w-48 border-2 transition-all duration-200 cursor-pointer bg-white z-10",
        isSelected ? "border-amber-600 shadow-[4px_4px_0px_0px_rgba(217,119,6,1)]" :
        isHighlighted ? "border-amber-500 shadow-[2px_2px_0px_0px_rgba(245,158,11,1)]" :
        isInLineage ? "border-stone-800" : "border-stone-300 opacity-80"
      )}
    >
      <div className={cn(
        "px-2 py-0.5 border-b-2 text-[8px] font-bold flex justify-between",
        isSelected ? "bg-amber-600 text-white border-amber-600" : "bg-stone-100 text-stone-500 border-stone-300"
      )}>
        <span>{isMe ? "YOU" : "MEMBER"}</span>
        {isDeceased && <Skull className="w-2.5 h-2.5" />}
      </div>

      <div className="p-2 flex items-center gap-3">
        <div className="w-8 h-8 border border-stone-200 bg-stone-50 shrink-0 overflow-hidden">
          {person.photoUrl ? (
            <img src={person.photoUrl} className={cn("w-full h-full object-cover", isDeceased && "grayscale")} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <User className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-mono font-bold text-[10px] leading-tight truncate">
            {formatDisplayName(person.name)}
          </h3>
          {settings.showDates && (
            <p className="text-[8px] font-mono text-stone-400">
              {person.birthYear || '????'} — {isDeceased ? (person.deathYear || '????') : 'PRES'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonNode;