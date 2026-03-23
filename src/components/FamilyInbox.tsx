import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Check, X, CheckCircle2, Loader2, User } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { cn } from '@/lib/utils';

const FamilyInbox = () => {
  const { suggestions, resolveSuggestion, resolveAllSuggestions, people, user } = useFamily();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const pending = suggestions.filter(s => s.status === 'pending');
  const isAdmin = user?.email === "daniele.buatti@gmail.com";

  const handleApproveAll = async () => {
    setIsProcessing(true);
    await resolveAllSuggestions('approved');
    setIsProcessing(false);
  };

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
          {pending.length} {pending.length === 1 ? 'suggestion' : 'suggestions'}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none bg-stone-50 p-8">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-stone-200/60">
          <div className="space-y-1">
            <DialogTitle className="font-serif text-2xl text-stone-800">Family Inbox</DialogTitle>
            <DialogDescription className="text-stone-500 text-sm">
              Review suggestions from the family.
            </DialogDescription>
          </div>
          {isAdmin && pending.length > 1 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleApproveAll}
              disabled={isProcessing}
              className="text-amber-700 border-amber-200 hover:bg-amber-50 rounded-full gap-2 h-10 px-4 font-bold text-xs uppercase tracking-widest"
            >
              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Approve All
            </Button>
          )}
        </DialogHeader>
        
        <div className="space-y-3 py-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
          {pending.map(s => {
            const person = people.find(p => p.id === s.personId);
            const isLink = s.fieldName === 'link_existing' || s.fieldName === 'new_relationship';
            
            return (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-stone-200/60 flex items-center gap-6 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-right-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center">
                        <User className="w-3 h-3 text-stone-400" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        For {person?.name}
                      </span>
                    </div>
                    <span className="text-[9px] text-stone-300 font-medium">
                      from {s.suggestedByEmail.split('@')[0]}
                    </span>
                  </div>
                  
                  <p className={cn(
                    "text-stone-700 font-serif leading-relaxed",
                    isLink ? "text-sm italic text-stone-500" : "text-lg italic"
                  )}>
                    "{s.suggestedValue}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-10 w-10 rounded-full text-stone-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => resolveSuggestion(s.id, 'rejected')}
                    title="Skip"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-10 px-5 bg-stone-800 hover:bg-stone-900 text-white rounded-full font-bold text-xs uppercase tracking-widest gap-2"
                    onClick={() => resolveSuggestion(s.id, 'approved')}
                  >
                    <Check className="w-4 h-4" />
                    Approve
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