"use client";

import React, { useMemo, useState } from 'react';
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
  AlertCircle,
  Trophy,
  Target,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPersonUrl } from '@/lib/slugify';
import MissionProgress from '../components/MissionProgress';
import { motion, AnimatePresence } from 'framer-motion';

const CompleteArchive = () => {
  const navigate = useNavigate();
  const { people, loading } = useFamily();
  const [questIndex, setQuestIndex] = useState(0);

  const peopleWithScores = useMemo(() => {
    return people.map(person => {
      const items = [
        { label: 'Birth Date', value: person.birthDate || person.birthYear },
        { label: 'Birth Place', value: person.birthPlace },
        { label: 'Occupation', value: person.occupation },
        { label: 'Gender', value: person.gender },
        { label: 'Nickname', value: person.nickname },
        { label: 'Photo', value: person.photoUrl },
        { label: 'Detailed Bio', value: person.vibeSentence && person.vibeSentence.length > 30 },
        { label: 'Education', value: person.education },
        { label: 'Military Service', value: person.militaryService },
        { label: 'Physical Traits', value: person.physicalTraits },
        { label: 'Favorite Things', value: person.favoriteThings },
      ];

      // Add Maiden Name for females
      if (person.gender?.toLowerCase() === 'female') {
        items.push({ label: 'Maiden Name', value: person.maidenName });
      }

      // Add Passing info for those no longer with us
      if (person.isLiving === false) {
        items.push({ label: 'Date of Passing', value: person.deathDate || person.deathYear });
        items.push({ label: 'Place of Passing', value: person.deathPlace });
        items.push({ label: 'Resting Place', value: person.burialPlace });
      }

      const missing = items.filter(i => !i.value).map(i => i.label);
      const score = items.filter(i => i.value).length;
      const percentage = Math.round((score / items.length) * 100);

      return { ...person, percentage, missing };
    }).sort((a, b) => a.percentage - b.percentage);
  }, [people]);

  const stats = useMemo(() => {
    if (peopleWithScores.length === 0) return { avg: 0, totalMemories: 0 };
    const avg = Math.round(peopleWithScores.reduce((acc, p) => acc + p.percentage, 0) / peopleWithScores.length);
    const totalMemories = people.reduce((acc, p) => acc + p.memories.length, 0);
    return { avg, totalMemories };
  }, [peopleWithScores, people]);

  const featuredQuest = useMemo(() => {
    const incomplete = peopleWithScores.filter(p => p.percentage < 100);
    if (incomplete.length === 0) return null;
    return incomplete[questIndex % incomplete.length];
  }, [peopleWithScores, questIndex]);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Scanning the archive...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32">
      <header className="bg-white border-b-8 border-stone-100 px-8 py-10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="rounded-full h-16 w-16 text-stone-500"
          >
            <ArrowLeft className="w-8 h-8" />
          </Button>
          <div>
            <h1 className="text-4xl font-serif font-bold text-stone-800">Family Mission</h1>
            <p className="text-stone-500 text-xl italic">Preserving our story, one detail at a time.</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        <MissionProgress 
          totalPeople={people.length} 
          averageCompletion={stats.avg} 
          totalMemories={stats.totalMemories} 
        />

        {featuredQuest && (
          <section className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            
            <div className="relative space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-amber-400 text-[10px] font-bold uppercase tracking-[0.3em]">
                  <Target className="w-4 h-4" />
                  Featured Quest
                </div>
                <button 
                  onClick={() => setQuestIndex(prev => prev + 1)}
                  className="text-stone-500 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="h-32 w-32 rounded-[2rem] overflow-hidden bg-stone-800 border-4 border-stone-700 shrink-0">
                  {featuredQuest.photoUrl ? (
                    <img src={featuredQuest.photoUrl} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-600">
                      <Camera className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                  <h2 className="text-4xl font-serif font-bold">Help us remember {featuredQuest.name.split(' ')[0]}</h2>
                  <p className="text-stone-400 text-lg leading-relaxed">
                    We're missing {featuredQuest.missing.length} key details about {featuredQuest.name.split(' ')[0]}. Do you know their {featuredQuest.missing[0].toLowerCase()}?
                  </p>
                  <Button 
                    onClick={() => navigate(getPersonUrl(featuredQuest.id, featuredQuest.name))}
                    className="h-14 px-8 bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-2xl font-bold text-lg gap-3"
                  >
                    Start Quest
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="space-y-8">
          <div className="flex items-center justify-between border-b-4 border-stone-100 pb-4">
            <h2 className="text-2xl font-serif font-bold text-stone-800">The Archive List</h2>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sorted by need</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {peopleWithScores.map((person, idx) => (
              <motion.div 
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
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
                  <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        person.percentage < 30 ? "bg-red-400" : person.percentage < 70 ? "bg-amber-400" : "bg-green-500"
                      )}
                      style={{ width: `${person.percentage}%` }}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {person.missing.slice(0, 4).map(item => (
                      <span 
                        key={item} 
                        className="flex items-center gap-2 px-4 py-2 bg-stone-50 text-stone-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-stone-100"
                      >
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        {item}
                      </span>
                    ))}
                    {person.missing.length > 4 && (
                      <span className="flex items-center gap-2 px-4 py-2 bg-stone-50 text-stone-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-stone-100">
                        +{person.missing.length - 4} more
                      </span>
                    )}
                    {person.percentage === 100 && (
                      <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100">
                        <Trophy className="w-3 h-3" />
                        Fully Preserved
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompleteArchive;