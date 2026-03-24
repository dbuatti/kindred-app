"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const MissionBanner = () => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate('/complete')}
      className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 cursor-pointer hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 group"
    >
      {/* Premium background effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full -ml-24 -mb-24" />
      
      {/* Subtle shimmer line */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      <div className="flex items-center gap-6 relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-amber-400 shrink-0 shadow-2xl group-hover:scale-110 transition-transform duration-500">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-amber-500/50" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">Family Quest</span>
          </div>
          <h3 className="text-2xl font-serif font-bold text-white leading-tight">
            A Piece of the Puzzle is Missing
          </h3>
          <p className="text-indigo-200/60 text-base font-light leading-relaxed max-w-xl">
            Help us preserve our legacy. Add missing details about siblings and parents to complete the archive.
          </p>
        </div>
      </div>

      <div className="relative z-10 shrink-0">
        <div className="flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-indigo-950 px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-[0_10px_20px_-5px_rgba(245,158,11,0.4)] transition-all group-hover:translate-x-1">
          Start Quest
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default MissionBanner;