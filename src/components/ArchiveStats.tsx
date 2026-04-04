"use client";

import React, { useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';
import { Card } from './ui/card';
import { MapPin, Users, MessageSquare, Heart, Globe, Star } from 'lucide-react';

const ArchiveStats = () => {
  const { people } = useFamily();

  const stats = useMemo(() => {
    const totalStories = people.reduce((acc, p) => acc + p.memories.length, 0);
    
    const places = people
      .map(p => p.birthPlace)
      .filter(Boolean)
      .reduce((acc, p) => {
        const city = p!.split(',')[0].trim();
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topPlace = Object.entries(places).sort((a, b) => b[1] - a[1])[0];
    
    const livingCount = people.filter(p => p.isLiving).length;
    const memoryCount = people.length - livingCount;

    return {
      totalStories,
      topPlace: topPlace ? topPlace[0] : 'Unknown',
      livingCount,
      memoryCount,
      totalPeople: people.length
    };
  }, [people]);

  if (people.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6 bg-white border-stone-100 rounded-3xl space-y-4">
        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
          <Globe className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-serif font-bold text-stone-800">{stats.topPlace}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Most Common Roots</p>
        </div>
      </Card>

      <Card className="p-6 bg-white border-stone-100 rounded-3xl space-y-4">
        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-serif font-bold text-stone-800">{stats.totalStories}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Stories Preserved</p>
        </div>
      </Card>

      <Card className="p-6 bg-white border-stone-100 rounded-3xl space-y-4">
        <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
          <Heart className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-serif font-bold text-stone-800">{stats.livingCount}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Living Members</p>
        </div>
      </Card>

      <Card className="p-6 bg-white border-stone-100 rounded-3xl space-y-4">
        <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
          <Star className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-serif font-bold text-stone-800">{stats.memoryCount}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">In Our Memories</p>
        </div>
      </Card>
    </div>
  );
};

export default ArchiveStats;