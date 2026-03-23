"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Camera, 
  Quote, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPersonUrl } from '@/lib/slugify';

const CompleteArchive = () => {
  const navigate = useNavigate();
  const { people, loading } = useFamily();

  const peopleWithScores = useMemo(() => {
    return people.map(person => {
      let score = 0;
      const missing = [];

      if (person.birthYear) score += 1; else missing.push('Birth Year');
      if (person.birthPlace) score += 1; else missing.push('Birth Place');
      if (person.occupation) score += 1; else missing.push('Occupation');
      if (person.photoUrl) score += 1; else missing.push('Photo');
      if (person.personalityTags && person.personalityTags.length > 0) score += 1; else missing.push('Personality');
      if (person.vibeSentence && person.vibeSentence.length > 30) score += 1; else missing.push('Detailed Bio');

      const percentage = Math.round((score / 6) * 100);
      return { ...person, percentage, missing };
    }).sort((a, b) => a.percentage - b.percentage);
  }, [people]);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Scanning the archive...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32">
      <header className="bg-white border-b-8 border-stone-100 px-8 py-10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="rounded-full h-16 w-16 text-stone-500"
          >
            <ArrowLeft className="w-8 h-8" />
          </Button>
          <div>
            <h1 className="text-4xl font-serif font-bold text-stone-800">Complete the Archive</h1>
            <p className="text-stone-500 text-xl italic">Help us fill in the missing pieces of our story.</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12 space-y-10">
        <div className="bg-amber-50 p-10 rounded-[3rem] border-4 border-amber-100 space-y-4">
          <h2 className="text-3xl font-serif font-bold text-amber-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            Our Mission
          </h2>
          <p className="text-2xl text-amber-800 leading-relaxed">
            Some of our family members have very few details saved. If you remember a birth year, a job, or have a photo, please help us add it!
          </p>
        </div>

        <div className="space-y-6">
          {peopleWithScores.map((person) => (
            <div 
              key={person.id}
              onClick={() => navigate(getPersonUrl(person.id, person.name))}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border-4 border-stone-100 hover:border-amber-200 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-6 mb-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-stone-100 shrink-0 border-4 border-white shadow-sm">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.3]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                      {person.name}
                    </h3>
                    <p className="text-stone-400 text-lg italic">
                      {person.percentage}% Complete
                    </p>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                  <ChevronRight className="w-8 h-8" />
                </div>
              </div>

              <div className="space-y-6">
                <Progress value={person.percentage} className="h-4 bg-stone-100" />
                
                <div className="flex flex-wrap gap-3">
                  {person.missing.map(item => (
                    <span 
                      key={item} 
                      className="flex items-center gap-2 px-4 py-2 bg-stone-50 text-stone-500 rounded-full text-sm font-bold uppercase tracking-widest border border-stone-100"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Missing {item}
                    </span>
                  ))}
                </div>

                <div className="pt-4 flex items-center gap-4 text-stone-400">
                  <div className={cn("flex items-center gap-2", person.birthYear ? "text-green-600" : "")}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className={cn("flex items-center gap-2", person.birthPlace ? "text-green-600" : "")}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className={cn("flex items-center gap-2", person.occupation ? "text-green-600" : "")}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className={cn("flex items-center gap-2", person.vibeSentence.length > 30 ? "text-green-600" : "")}>
                    <Quote className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CompleteArchive;