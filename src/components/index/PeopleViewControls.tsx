"use client";

import React from 'react';
import { LayoutGrid, List, ArrowDownAZ, Clock, Heart, Skull, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PeopleViewControlsProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  filter: 'all' | 'living' | 'memory';
  setFilter: (filter: 'all' | 'living' | 'memory') => void;
  sortBy: 'name' | 'recent';
  setSortBy: (sort: 'name' | 'recent') => void;
  count: number;
}

const PeopleViewControls = ({ 
  viewMode, 
  setViewMode, 
  filter, 
  setFilter, 
  sortBy, 
  setSortBy,
  count 
}: PeopleViewControlsProps) => {
  return (
    <div className="flex flex-col gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All', icon: Users },
            { id: 'living', label: 'Living', icon: Heart },
            { id: 'memory', label: 'In Memory', icon: Skull },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all shrink-0 border-2",
                filter === item.id 
                  ? "bg-stone-800 text-white border-stone-800 shadow-md" 
                  : "bg-white border-stone-100 text-stone-400 hover:border-amber-200 hover:text-amber-700"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-stone-100/50 p-1.5 rounded-2xl border border-stone-200/30">
          <div className="flex items-center gap-1 px-2">
            <button
              onClick={() => setSortBy('name')}
              className={cn(
                "p-2 rounded-xl transition-all",
                sortBy === 'name' ? "bg-white text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
              title="Sort Alphabetically"
            >
              <ArrowDownAZ className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={cn(
                "p-2 rounded-xl transition-all",
                sortBy === 'recent' ? "bg-white text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
              title="Sort by Recently Added"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-stone-200" />
          
          <div className="flex items-center gap-1 px-2">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'list' ? "bg-white text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'grid' ? "bg-white text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
          Showing {count} {count === 1 ? 'Family Member' : 'Family Members'}
        </p>
      </div>
    </div>
  );
};

export default PeopleViewControls;