"use client";

import React from 'react';
import { UserPlus, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import AddPersonDialog from './AddPersonDialog';

const MissingPersonBanner = () => {
  return (
    <div className="relative overflow-hidden bg-indigo-50 border-4 border-indigo-100 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 group transition-all hover:shadow-md">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-200/40 transition-colors" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/50 blur-2xl rounded-full -ml-12 -mb-12" />

      <div className="flex items-center gap-6 relative z-10">
        <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform duration-500">
          <UserPlus className="w-8 h-8" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.3em]">
            <Sparkles className="w-3 h-3" />
            Grow the Tree
          </div>
          <h3 className="text-3xl font-serif font-bold text-indigo-900 leading-tight">
            Is someone missing?
          </h3>
          <p className="text-indigo-700/60 text-lg font-medium leading-relaxed max-w-md">
            Our family story is still being written. Add a relative you know and help us connect the branches.
          </p>
        </div>
      </div>

      <div className="relative z-10 shrink-0">
        <AddPersonDialog 
          trigger={
            <Button className="h-16 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg gap-3 shadow-lg shadow-indigo-200 transition-all hover:translate-x-1">
              Add to Family
              <ArrowRight className="w-5 h-5" />
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default MissingPersonBanner;