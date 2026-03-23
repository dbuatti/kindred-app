"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Info, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
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
}

const PersonAvatar = ({ person, me, relationships, isHighlighted, isInLineage, isSelected, debugMode, level, onSelect }: PersonAvatarProps) => {
  const navigate = useNavigate();
  const label = !me || person.id === me.id ? "You" : (relationships.find(r => (r.person_id === me.id && r.related_person_id === person.id) || (r.person_id === person.id && r.related_person_id === me.id))?.relationship_type || "Family");
  
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onSelect(person.id);
      }} 
      className="flex flex-col items-center space-y-3 cursor-pointer group"
    >
      <QuickAddMenu personId={person.id} personName={person.name} />
      <SmartSuggestionHover personId={person.id} />
      
      <div className={cn(
        "h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-4 shadow-lg ring-1 transition-all duration-500 relative",
        isSelected ? "border-amber-600 ring-amber-300 scale-110 z-20 shadow-amber-200" :
        isHighlighted ? "border-amber-500 ring-amber-200 scale-105 z-20" : 
        isInLineage ? "border-amber-200 ring-amber-50 shadow-amber-100" :
        "border-white ring-stone-100 group-hover:ring-amber-400"
      )}>
        {person.photoUrl ? (
          <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
            <UserCircle className="w-10 h-10" />
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

      <div className="text-center space-y-0.5">
        <h3 className={cn(
          "font-serif font-bold text-xs md:text-sm transition-colors",
          isSelected ? "text-amber-800" : isHighlighted ? "text-amber-700" : "text-stone-800"
        )}>
          {person.name.split(' ')[0]}
        </h3>
        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
};

export default PersonAvatar;