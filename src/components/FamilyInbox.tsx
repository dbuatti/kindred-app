import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Check, X } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { cn } from '@/lib/utils';

const FamilyInbox = () => {
  const { suggestions, resolveSuggestion, people } = useFamily();
  const pending = suggestions.filter(s => s.status === 'pending');

  if (pending.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={cn(
          "flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-medium transition-all hover:bg-amber-100",
          "animate-in fade-in slide-in-from-top-2 duration-500"
        )}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Sparkles className="w-3 h-3" />
          {pending.length} new {pending.length === 1 ? 'suggestion' : 'suggestions'}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none bg-stone-50 p-8">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-stone-800">Family Inbox</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {pending.map(s => {
            const person = people.find(p => p.id === s.personId);
            return (
              <div key={s.id} className="bg-white p-6 rounded-3xl border border-stone-100 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Edit for {person?.name}</span>
                  <span className="text-[10px] text-stone-300 italic">from {s.suggestedByEmail.split('@')[0]}</span>
                </div>
                <p className="text-stone-700 font-serif italic text-lg leading-relaxed">
                  "{s.suggestedValue}"
                </p>
                <div className="flex gap-3 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl h-12"
                    onClick={() => resolveSuggestion(s.id, 'approved')}
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1 text-stone-400 hover:text-stone-600 rounded-2xl h-12"
                    onClick={() => resolveSuggestion(s.id, 'rejected')}
                  >
                    <X className="w-4 h-4 mr-2" /> Skip
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyInbox;