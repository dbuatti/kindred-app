"use client";

import React from 'react';
import { User, Skull } from 'lucide-react';
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
        "w-48 border transition-all duration-300 cursor-pointer bg-white z-10",
        isSelected ? "border-amber-600 ring-1 ring-amber-600 shadow-lg" :
        isHighlighted ? "border-amber-400 ring-1 ring-amber-400" :
        isInLineage ? "border-stone-800" : "border-stone-200 opacity-60"
      )}
    >
      {/* Minimal Status Bar */}
      <div className={cn(
        "px-2 py-0.5 border-b text-[7px] font-bold tracking-widest flex justify-between items-center",
        isSelected ? "bg-amber-600 text-white border-amber-600" : "bg-stone-50 text-stone-400 border-stone-100"
      )}>
        <span>{isMe ? "PRIMARY" : "RECORD"}</span>
        {isDeceased && <Skull className="w-2 h-2" />}
      </div>

      <div className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 border border-stone-100 bg-stone-50 shrink-0 overflow-hidden rounded-sm">
          {person.photoUrl ? (
            <img src={person.photoUrl} className={cn("w-full h-full object-cover", isDeceased && "grayscale")} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-200">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-serif font-bold text-[11px] text-stone-800 leading-tight truncate">
            {formatDisplayName(person.name)}
          </h3>
          {settings.showDates && (
            <p className="text-[9px] text-stone-400 mt-0.5">
              {person.birthYear || '????'} — {isDeceased ? (person.deathYear || '????') : 'Present'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonNode;