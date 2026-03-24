"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Calendar, MapPin, Briefcase, Quote, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Person } from '@/types';
import { cn, formatDisplayName, formatFamilyDate } from '@/lib/utils';
import SuggestionDialog from '../SuggestionDialog';
import ConnectionSuggestionDialog from '../ConnectionSuggestionDialog';
import EditPersonDialog from '../EditPersonDialog';

interface PersonHeroProps {
  person: Person;
  isOwnProfile: boolean;
  isAdmin?: boolean;
  isDraggingOverProfile: boolean;
  onEditProfile: () => void;
  onProfileDrop: (e: React.DragEvent) => void;
  onProfileDragOver: (e: React.DragEvent) => void;
  onProfileDragLeave: (e: React.DragEvent) => void;
}

const PersonHero = ({ 
  person, 
  isOwnProfile, 
  isAdmin,
  isDraggingOverProfile, 
  onEditProfile,
  onProfileDrop,
  onProfileDragOver,
  onProfileDragLeave
}: PersonHeroProps) => {
  const birthDisplay = person.birthDate ? formatFamilyDate(person.birthDate) : (person.birthYear || 'Unknown');
  const canEditDirectly = isOwnProfile || isAdmin;

  return (
    <section className="flex flex-col md:flex-row gap-12 items-start">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "relative w-48 h-48 md:w-64 md:h-64 rounded-[3rem] overflow-hidden shadow-2xl ring-8 transition-all duration-500 shrink-0",
          isDraggingOverProfile ? "ring-amber-500 scale-105 shadow-amber-200" : "ring-white"
        )}
        onDragOver={onProfileDragOver}
        onDragLeave={onProfileDragLeave}
        onDrop={onProfileDrop}
      >
        {person.photoUrl ? (
          <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center">
            <Camera className="w-12 h-12 text-stone-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center group cursor-pointer">
          <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </motion.div>

      <div className="space-y-8 flex-1">
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-5xl font-serif font-bold text-stone-800 leading-tight">
              {formatDisplayName(person.name)}
            </h1>
            
            {isOwnProfile ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onEditProfile}
                className="rounded-full text-stone-400 hover:text-amber-600 h-10 w-10 bg-stone-50"
              >
                <Edit3 className="w-5 h-5" />
              </Button>
            ) : isAdmin ? (
              <EditPersonDialog 
                person={person}
                trigger={
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-amber-600 hover:bg-amber-50 h-10 w-10 bg-stone-50"
                  >
                    <Edit3 className="w-5 h-5" />
                  </Button>
                }
              />
            ) : null}
          </div>
          
          <div className="flex flex-wrap gap-6 text-stone-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span className="text-lg font-medium">Born {birthDisplay}</span>
            </div>
            {person.birthPlace && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                <span className="text-lg font-medium">{person.birthPlace}</span>
              </div>
            )}
            {person.occupation && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-600" />
                <span className="text-lg font-medium">{person.occupation}</span>
              </div>
            )}
          </div>
        </div>

        {person.vibeSentence && person.vibeSentence.trim() !== "" && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-amber-500/10 transition-colors" />
            <Quote className="absolute top-6 left-6 w-10 h-10 text-amber-600/5" />
            <p className="text-2xl font-serif italic text-stone-700 leading-relaxed relative z-10 pl-4">
              "{person.vibeSentence}"
            </p>
            <div className="mt-6 flex flex-wrap gap-2 relative z-10">
              {person.personalityTags?.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-stone-50 text-stone-500 border-none rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest">
                  {tag}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {!isOwnProfile && (
          <div className="flex flex-wrap gap-3 pt-4">
            <SuggestionDialog person={person} />
            <ConnectionSuggestionDialog person={person} />
          </div>
        )}
      </div>
    </section>
  );
};

export default PersonHero;