"use client";

import React, { useMemo, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription 
} from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Check, X, Loader2, Users, Heart, UserPlus } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TreeSmartInbox = () => {
  const { people, relationships, addRelationship, addSuggestion, isAdmin, user } = useFamily();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const allSuggestions = useMemo(() => {
    const items: { id: string; text: string; type: 'sibling' | 'parent' | 'spouse'; personId: string; targetId: string; action: () => Promise<void> }[] = [];
    const seenPairs = new Set<string>();

    // Helper to get specific relationship IDs for any person
    const getRelIds = (id: string, types: string[], direction: 'to' | 'from' | 'both') => {
      return relationships
        .filter(r => {
          const t = r.relationship_type.toLowerCase();
          const matchesType = types.some(type => t.includes(type));
          if (!matchesType) return false;
          if (direction === 'from') return r.person_id === id;
          if (direction === 'to') return r.related_person_id === id;
          return r.person_id === id || r.related_person_id === id;
        })
        .map(r => r.person_id === id ? r.related_person_id : r.person_id);
    };

    people.forEach(person => {
      const personId = person.id;
      
      const myParentIds = [
        ...getRelIds(personId, ['mother', 'father', 'parent'], 'to'),
        ...getRelIds(personId, ['son', 'daughter', 'child'], 'from')
      ];
      
      const myChildIds = [
        ...getRelIds(personId, ['mother', 'father', 'parent'], 'from'),
        ...getRelIds(personId, ['son', 'daughter', 'child'], 'to')
      ];

      const mySpouseIds = getRelIds(personId, ['spouse', 'wife', 'husband'], 'both');
      const mySiblingIds = getRelIds(personId, ['brother', 'sister', 'sibling'], 'both');

      // 1. Sibling Inference
      if (myParentIds.length > 0) {
        people.forEach(sib => {
          if (sib.id === personId || mySiblingIds.includes(sib.id) || mySpouseIds.includes(sib.id)) return;
          
          const pairKey = [personId, sib.id].sort().join('-');
          if (seenPairs.has(pairKey)) return;

          const theirParentIds = [
            ...getRelIds(sib.id, ['mother', 'father', 'parent'], 'to'),
            ...getRelIds(sib.id, ['son', 'daughter', 'child'], 'from')
          ];
          
          if (theirParentIds.some(id => myParentIds.includes(id))) {
            seenPairs.add(pairKey);
            items.push({
              id: `sib-${pairKey}`,
              type: 'sibling',
              personId,
              targetId: sib.id,
              text: `Are ${person.name.split(' ')[0]} and ${sib.name.split(' ')[0]} siblings?`,
              action: async () => {
                const relType = sib.gender?.toLowerCase() === 'female' ? 'sister' : 'brother';
                if (isAdmin) {
                  await addRelationship(personId, sib.id, relType);
                } else {
                  await addSuggestion({
                    personId: personId,
                    fieldName: 'link_existing',
                    suggestedValue: `LINK_EXISTING: ${sib.id} as ${relType} to ${personId}`,
                    suggestedByEmail: user?.email || 'family@kindred.com'
                  });
                }
              }
            });
          }
        });
      }

      // 2. Spouse Inference
      if (myChildIds.length > 0) {
        people.forEach(spouse => {
          if (spouse.id === personId || mySpouseIds.includes(spouse.id) || mySiblingIds.includes(spouse.id)) return;
          
          const pairKey = [personId, spouse.id].sort().join('-');
          if (seenPairs.has(pairKey)) return;

          const theirChildIds = [
            ...getRelIds(spouse.id, ['mother', 'father', 'parent'], 'from'),
            ...getRelIds(spouse.id, ['son', 'daughter', 'child'], 'to')
          ];
          
          if (theirChildIds.some(id => myChildIds.includes(id))) {
            // Check if they share a parent (likely backwards data entry)
            const theirParentIds = [
              ...getRelIds(spouse.id, ['mother', 'father', 'parent'], 'to'),
              ...getRelIds(spouse.id, ['son', 'daughter', 'child'], 'from')
            ];
            const sharesParent = theirParentIds.some(id => myParentIds.includes(id));
            if (sharesParent) return;

            seenPairs.add(pairKey);
            items.push({
              id: `spouse-${pairKey}`,
              type: 'spouse',
              personId,
              targetId: spouse.id,
              text: `Are ${person.name.split(' ')[0]} and ${spouse.name.split(' ')[0]} spouses?`,
              action: async () => {
                if (isAdmin) {
                  await addRelationship(personId, spouse.id, 'spouse');
                } else {
                  await addSuggestion({
                    personId: personId,
                    fieldName: 'link_existing',
                    suggestedValue: `LINK_EXISTING: ${spouse.id} as spouse to ${personId}`,
                    suggestedByEmail: user?.email || 'family@kindred.com'
                  });
                }
              }
            });
          }
        });
      }
    });

    return items.filter(item => !dismissedIds.has(item.id));
  }, [people, relationships, isAdmin, user, dismissedIds]);

  const handleAction = async (id: string, action: () => Promise<void>) => {
    setIsProcessing(id);
    try {
      await action();
      toast.success(isAdmin ? "Connection added!" : "Suggestion sent to inbox!");
      setDismissedIds(prev => new Set(prev).add(id));
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  if (allSuggestions.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="rounded-full border-amber-200 bg-amber-50 text-amber-700 gap-2 hover:bg-amber-100 transition-all animate-in fade-in zoom-in"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden md:inline">Smart Suggestions</span>
          <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {allSuggestions.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none bg-stone-50 p-8 max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-stone-800 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-500" />
            Tree Insights
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-lg">
            We've found potential connections based on existing family links.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-6 space-y-4 custom-scrollbar">
          {allSuggestions.map((s) => (
            <div 
              key={s.id} 
              className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-right-4"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                  s.type === 'spouse' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                )}>
                  {s.type === 'spouse' ? <Heart className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-serif text-stone-800 leading-tight">
                    {s.text}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    {s.type === 'spouse' ? 'Potential Marriage' : 'Potential Siblings'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1 h-12 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold gap-2"
                  onClick={() => handleAction(s.id, s.action)}
                  disabled={!!isProcessing}
                >
                  {isProcessing === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirm Connection
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-12 w-12 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => handleDismiss(s.id)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TreeSmartInbox;