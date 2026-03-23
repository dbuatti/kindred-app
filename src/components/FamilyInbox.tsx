import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Check, X, MessageSquare } from 'lucide-react';
import { useFamily } from '../context/FamilyContext.tsx';

const FamilyInbox = () => {
  const { suggestions, resolveSuggestion, people } = useFamily();
  const pending = suggestions.filter(s => s.status === 'pending');

  if (pending.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3 h-3" />
          {pending.length} new {pending.length === 1 ? 'suggestion' : 'suggestions'}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl border-none bg-stone-50">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-stone-800">Family Inbox</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {pending.map(s => {
            const person = people.find(p => p.id === s.personId);
            return (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                    Suggestion for {person?.name}
                  </span>
                  <span className="text-[10px] text-stone-300 italic">from {s.suggestedByEmail.split('@')[0]}</span>
                </div>
                <p className="text-stone-700 font-serif italic">
                  "{s.suggestedValue}"
                </p>
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-stone-800 hover:bg-stone-900 text-white rounded-xl"
                    onClick={() => resolveSuggestion(s.id, 'approved')}
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1 text-stone-400 hover:text-stone-600 rounded-xl"
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