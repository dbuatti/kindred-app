"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const MissionBanner = () => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate('/complete')}
      className="bg-indigo-950 border-2 border-indigo-800 rounded-[2rem] p-6 flex items-center justify-between gap-6 cursor-pointer hover:bg-indigo-900 transition-all group shadow-xl relative overflow-hidden"
    >
      {/* Decorative background glow */}
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
      
      <div className="flex items-center gap-5 relative z-10">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold text-white leading-tight">
            A Piece of the Puzzle is Missing
          </h3>
          <p className="text-indigo-200/80 text-sm md:text-base font-medium leading-relaxed max-w-xl">
            Help us complete our family story. Add missing details about siblings, parents, and more in the Mission center.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shrink-0 shadow-md group-hover:bg-indigo-400 transition-colors relative z-10">
        Start Quest
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default MissionBanner;