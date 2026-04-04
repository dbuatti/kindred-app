"use client";

import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative group">
      <div className={cn(
        "absolute inset-0 bg-amber-500/10 rounded-[2rem] blur-2xl transition-opacity duration-500",
        value ? "opacity-100" : "opacity-0"
      )} />
      
      <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-stone-400 group-focus-within:text-amber-600 transition-colors z-10" />
      
      <Input 
        ref={inputRef}
        placeholder="Search for a name or a story..."
        className="pl-20 h-20 bg-stone-100 border-4 border-transparent focus:border-amber-500 focus:bg-white rounded-[2rem] text-2xl placeholder:text-stone-400 transition-all shadow-sm focus:shadow-xl relative z-0 font-serif italic"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10">
        {value ? (
          <button 
            onClick={() => onChange('')} 
            className="h-12 w-12 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors flex items-center justify-center"
            title="Clear search"
          >
            <X className="w-6 h-6 text-stone-600" />
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-stone-200/50 rounded-xl text-xs font-black text-stone-500 uppercase tracking-widest border-2 border-stone-200/30">
            <Command className="w-4 h-4" />
            <span>Press / to Search</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;