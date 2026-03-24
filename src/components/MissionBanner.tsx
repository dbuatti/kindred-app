"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

const MissionBanner = () => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate('/complete')}
      className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-amber-100/50 transition-all group shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-stone-700 text-sm md:text-base font-medium leading-tight">
          Would you like to help complete our family story? 
          <span className="hidden md:inline text-stone-500 font-normal ml-1">
            Add missing details about siblings, parents, and more in the Mission center.
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2 text-amber-700 font-bold text-[10px] uppercase tracking-widest shrink-0">
        Go to Mission
        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default MissionBanner;