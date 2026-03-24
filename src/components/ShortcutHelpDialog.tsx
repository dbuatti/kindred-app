"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Command, Home, GitBranch, Sparkles, UserCircle, Plus, Mic, Search, HelpCircle } from 'lucide-react';

const SHORTCUTS = [
  { key: 'H', label: 'Home', icon: Home },
  { key: 'T', label: 'Family Tree', icon: GitBranch },
  { key: 'M', label: 'Family Mission', icon: Sparkles },
  { key: 'P', label: 'Your Profile', icon: UserCircle },
  { key: 'N', label: 'New Story', icon: Mic },
  { key: 'A', label: 'Add Person', icon: Plus },
  { key: '/', label: 'Search', icon: Search },
  { key: '?', label: 'Show Shortcuts', icon: HelpCircle },
];

const ShortcutHelpDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-shortcut-help', handleToggle);
    return () => window.removeEventListener('toggle-shortcut-help', handleToggle);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none bg-stone-900 text-white p-8 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl flex items-center gap-3">
            <Command className="w-6 h-6 text-amber-500" />
            Shortcuts
          </DialogTitle>
          <DialogDescription className="text-stone-400 text-lg">
            Navigate Kindred faster with your keyboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-3 py-6">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-stone-400 group-hover:text-amber-50 transition-colors">
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-lg font-medium text-stone-200">{s.label}</span>
              </div>
              <kbd className="h-10 w-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center font-mono text-xl font-bold text-amber-500 shadow-inner">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutHelpDialog;