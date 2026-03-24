"use client";

import React from 'react';
import { Progress } from './ui/progress';
import { Sparkles, Trophy, Heart, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionProgressProps {
  totalPeople: number;
  averageCompletion: number;
  totalMemories: number;
}

const MissionProgress = ({ totalPeople, averageCompletion, totalMemories }: MissionProgressProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-8 rounded-[2.5rem] border-4 border-stone-100 shadow-sm space-y-4 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
        <div className="flex items-center gap-3 text-amber-600">
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Archive Health</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-4xl font-serif font-bold text-stone-800">{averageCompletion}%</span>
            <span className="text-stone-400 text-xs font-medium mb-1">Complete</span>
          </div>
          <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000 ease-out" 
              style={{ width: `${averageCompletion}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border-4 border-stone-100 shadow-sm space-y-4 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
        <div className="flex items-center gap-3 text-red-500">
          <Heart className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Family Size</span>
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-serif font-bold text-stone-800">{totalPeople}</p>
          <p className="text-stone-400 text-sm italic">People in our story</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border-4 border-stone-100 shadow-sm space-y-4 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
        <div className="flex items-center gap-3 text-blue-500">
          <BookOpen className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Total Stories</span>
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-serif font-bold text-stone-800">{totalMemories}</p>
          <p className="text-stone-400 text-sm italic">Memories preserved</p>
        </div>
      </div>
    </div>
  );
};

export default MissionProgress;