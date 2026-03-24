"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const MissionBanner = () => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate('/complete')}
      className="bg-amber-100/60 border-2 border-amber-200 rounded-[2rem] p-6 flex items-center justify-between gap-6 cursor-pointer hover:bg-amber-100 hover:border-amber-300 transition-all group shadow-sm hover:shadow-md relative overflow-hidden"
    >
      {/* Decorative background glow */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/40 rounded-full blur-2xl group-hover:bg-white/60 transition-colors" />
      
      <div className="flex items-center gap-5 relative z-10">
        <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-inner animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold text-amber-900 leading-tight">
            A Piece of the Puzzle is Missing
          </h3>
          <p className="text-amber-800/70 text-sm md:text-base font-medium leading-relaxed max-w-xl">
            Help us complete our family story. Add missing details about siblings, parents, and more in the Mission center.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shrink-0 shadow-sm group-hover:bg-amber-600 transition-colors relative z-10">
        Start Quest
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default MissionBanner;