"use client";

import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, Command } from 'lucide-react';

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
      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
      <Input 
        ref={inputRef}
        placeholder="Search names or stories..."
        className="pl-14 h-16 bg-stone-100 border-4 border-transparent focus:border-amber-500 rounded-2xl text-xl placeholder:text-stone-400 transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {value ? (
          <button onClick={() => onChange('')} className="p-2 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-stone-200/50 rounded-md text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            <Command className="w-3 h-3" /> /
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;