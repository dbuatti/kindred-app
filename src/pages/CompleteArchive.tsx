"use client";

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Sparkles, 
  Search,
  ChevronRight, 
  AlertCircle,
  Trophy,
  Target,
  RefreshCw,
  X,
  Filter,
  Camera,
  User,
  MapPin,
  Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPersonUrl } from '@/lib/slugify';
import MissionProgress from '../components/MissionProgress';
import SuggestionDialog from '../components/SuggestionDialog';
import MissingPersonBanner from '../components/MissingPersonBanner';
import { motion, AnimatePresence } from 'framer-motion';

const CompleteArchive = () => {
  const navigate = useNavigate();
  const { people, loading } = useFamily();
  const [questIndex, setQuestIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  const peopleWithScores = useMemo(() => {
    return people.map(person => {
      const items = [
        { id: 'birth_date', label: 'Birth Date', value: person.birthDate || person.birthYear },
        { id: 'birth_place', label: 'Birth Place', value: person.birthPlace },
        { id: 'occupation', label: 'Occupation', value: person.occupation },
        { id: 'gender', label: 'Gender', value: person.gender },
        { id: 'nickname', label: 'Nickname', value: person.nickname },
        { id: 'photo_url', label: 'Photo', value: person.photoUrl },
        { id: 'vibe_sentence', label: 'Detailed Bio', value: person.vibeSentence && person.vibeSentence.length > 30 },
        { id: 'education', label: 'Education', value: person.education || (person.educationRecords && person.educationRecords.length > 0) },
        { id: 'military_service', label: 'Military Service', value: person.militaryService },
        { id: 'physical_traits', label: 'Physical Traits', value: person.physicalTraits },
        { id: 'favorite_things', label: 'Favorite Things', value: person.favoriteThings },
      ];

      if (person.gender?.toLowerCase() === 'female') {
        items.push({ id: 'maiden_name', label: 'Maiden Name', value: person.maidenName });
      }

      if (person.isLiving === false) {
        items.push({ id: 'death_date', label: 'Date of Passing', value: person.deathDate || person.deathYear });
        items.push({ id: 'death_place', label: 'Place of Passing', value: person.deathPlace });
        items.push({ id: 'burial_place', label: 'Resting Place', value: person.burialPlace });
      }

      const missing = items.filter(i => !i.value).map(i => ({ id: i.id, label: i.label }));
      const score = items.filter(i => i.value).length;
      const percentage = Math.round((score / items.length) * 100);

      return { ...person, percentage, missing };
    }).sort((a, b) => a.percentage - b.percentage);
  }, [people]);

  const aggregateMissing = useMemo(() => {
    const counts: Record<string, { label: string, count: number, icon: any }> = {};
    const iconMap: Record<string, any> = {
      photo_url: Camera,
      vibe_sentence: Quote,
      birth_place: MapPin,
      birth_date: User,
    };

    peopleWithScores.forEach(p => {
      p.missing.forEach(m => {
        if (!counts[m.id]) counts[m.id] = { label: m.label, count: 0, icon: iconMap[m.id] || AlertCircle };
        counts[m.id].count++;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [peopleWithScores]);

  const filteredPeople = useMemo(() => {
    let result = peopleWithScores;
    if (searchQuery) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterType) {
      result = result.filter(p => p.missing.some(m => m.id === filterType));
    }
    return result;
  }, [peopleWithScores, searchQuery, filterType]);

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
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
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
          
          <div className="hidden md:block relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input 
              placeholder="Find a person..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-stone-50 border-none rounded-2xl"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        <MissionProgress 
          totalPeople={people.length} 
          averageCompletion={stats.avg} 
          totalMemories={stats.totalMemories} 
        />

        {/* Archive Needs Summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {aggregateMissing.map((need) => (
            <button
              key={need.label}
              onClick={() => setFilterType(filterType === need.label ? null : need.label)}
              className={cn(
                "p-6 rounded-[2rem] border-2 transition-all text-left group",
                filterType === need.label 
                  ? "bg-amber-600 border-amber-600 text-white shadow-lg scale-105" 
                  : "bg-white border-stone-100 text-stone-800 hover:border-amber-200"
              )}
            >
              <need.icon className={cn("w-6 h-6 mb-3", filterType === need.label ? "text-white" : "text-amber-600")} />
              <p className={cn("text-2xl font-serif font-bold", filterType === need.label ? "text-white" : "text-stone-800")}>{need.count}</p>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest", filterType === need.label ? "text-amber-100" : "text-stone-400")}>{need.label}s needed</p>
            </button>
          ))}
        </section>

        {featuredQuest && !searchQuery && !filterType && (
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
                      <Search className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                  <h2 className="text-4xl font-serif font-bold">Help us remember {featuredQuest.name.split(' ')[0]}</h2>
                  <p className="text-stone-400 text-lg leading-relaxed">
                    We're missing {featuredQuest.missing.length} key details about {featuredQuest.name.split(' ')[0]}. Do you know their {featuredQuest.missing[0].label.toLowerCase()}?
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

        <MissingPersonBanner />

        <div className="space-y-8">
          <div className="flex items-center justify-between border-b-4 border-stone-100 pb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-serif font-bold text-stone-800">The Archive List</h2>
              {filterType && (
                <Badge className="bg-amber-100 text-amber-700 border-none rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Filtering: {filterType}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              {(searchQuery || filterType) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setFilterType(null); }} className="text-stone-400 gap-2">
                  <X className="w-4 h-4" /> Clear Filters
                </Button>
              )}
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sorted by need</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPeople.map((person, idx) => (
              <motion.div 
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border-4 border-stone-100 hover:border-amber-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-6 mb-6">
                  <div className="flex items-center gap-6 cursor-pointer" onClick={() => navigate(getPersonUrl(person.id, person.name))}>
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-stone-100 shrink-0 border-4 border-white shadow-sm">
                      {person.photoUrl ? (
                        <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.3]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Search className="w-8 h-8" />
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate(getPersonUrl(person.id, person.name))}
                    className="h-14 w-14 rounded-full bg-stone-50 text-stone-300 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
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
                    {person.missing.slice(0, 6).map(item => (
                      <SuggestionDialog 
                        key={item.id}
                        person={person}
                        initialField={item.id}
                        trigger={
                          <button className="flex items-center gap-2 px-4 py-2 bg-stone-50 text-stone-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-stone-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            {item.label}
                          </button>
                        }
                      />
                    ))}
                    {person.missing.length > 6 && (
                      <span className="flex items-center gap-2 px-4 py-2 bg-stone-50 text-stone-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-stone-100">
                        +{person.missing.length - 6} more
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