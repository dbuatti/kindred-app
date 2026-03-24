"use client";

import React, { useMemo, useState } from 'react';
import { Sparkles, Check, X, HelpCircle, Loader2 } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SmartSuggestionHoverProps {
  personId: string;
}

const SmartSuggestionHover = ({ personId }: SmartSuggestionHoverProps) => {
  const { people, relationships, addRelationship, addSuggestion, isAdmin, user } = useFamily();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const person = useMemo(() => people.find(p => p.id === personId), [people, personId]);

  const suggestions = useMemo(() => {
    if (!person) return [];

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

    // Define clear sets for the current person
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

    const items: { id: string; text: string; action: () => Promise<void> }[] = [];

    // 1. Sibling Inference: Share a parent but not marked as siblings
    if (myParentIds.length > 0) {
      const potentialSiblings = people.filter(p => {
        // Exclude self, existing siblings, spouses, OR existing parent/child links
        if (
          p.id === personId || 
          mySiblingIds.includes(p.id) || 
          mySpouseIds.includes(p.id) ||
          myParentIds.includes(p.id) ||
          myChildIds.includes(p.id)
        ) return false;
        
        const theirParentIds = [
          ...getRelIds(p.id, ['mother', 'father', 'parent'], 'to'),
          ...getRelIds(p.id, ['son', 'daughter', 'child'], 'from')
        ];
        
        return theirParentIds.some(id => myParentIds.includes(id));
      });

      potentialSiblings.forEach(sib => {
        items.push({
          id: `sib-${sib.id}`,
          text: `Should ${person.name.split(' ')[0]} and ${sib.name.split(' ')[0]} be marked as siblings?`,
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
      });
    }

    // 2. Parent Inference: My sibling has a parent I don't have linked
    mySiblingIds.forEach(sibId => {
      const sibParentIds = [
        ...getRelIds(sibId, ['mother', 'father', 'parent'], 'to'),
        ...getRelIds(sibId, ['son', 'daughter', 'child'], 'from')
      ];

      sibParentIds.forEach(pId => {
        if (pId === personId || myParentIds.includes(pId)) return;

        const parent = people.find(p => p.id === pId);
        if (parent) {
          const role = parent.gender?.toLowerCase() === 'female' ? 'mother' : 'father';
          items.push({
            id: `parent-${pId}`,
            text: `Is ${parent.name} also the ${role} of ${person.name.split(' ')[0]}?`,
            action: async () => {
              if (isAdmin) {
                await addRelationship(pId, personId, role);
              } else {
                await addSuggestion({
                  personId: personId,
                  fieldName: 'link_existing',
                  suggestedValue: `LINK_EXISTING: ${pId} as ${role} to ${personId}`,
                  suggestedByEmail: user?.email || 'family@kindred.com'
                });
              }
            }
          });
        }
      });
    });

    // 3. Spouse Inference: Share a child but not marked as spouses
    if (myChildIds.length > 0) {
      const potentialSpouses = people.filter(p => {
        // Exclude self, existing spouses, siblings, OR existing parent/child links
        if (
          p.id === personId || 
          mySpouseIds.includes(p.id) || 
          mySiblingIds.includes(p.id) ||
          myParentIds.includes(p.id) ||
          myChildIds.includes(p.id)
        ) return false;
        
        const theirChildIds = [
          ...getRelIds(p.id, ['mother', 'father', 'parent'], 'from'),
          ...getRelIds(p.id, ['son', 'daughter', 'child'], 'to')
        ];
        
        const sharesChild = theirChildIds.some(id => myChildIds.includes(id));
        if (!sharesChild) return false;

        // CRITICAL: Don't suggest spouses if they share a parent (likely siblings)
        const theirParentIds = [
          ...getRelIds(p.id, ['mother', 'father', 'parent'], 'to'),
          ...getRelIds(p.id, ['son', 'daughter', 'child'], 'from')
        ];
        const sharesParent = theirParentIds.some(id => myParentIds.includes(id));
        if (sharesParent) return false;

        return true;
      });

      potentialSpouses.forEach(spouse => {
        items.push({
          id: `spouse-${spouse.id}`,
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
      });
    }

    return items.filter(item => !dismissedIds.has(item.id));
  }, [person, personId, people, relationships, isAdmin, user, dismissedIds]);

  if (suggestions.length === 0) return null;

  const handleAction = async (id: string, action: () => Promise<void>) => {
    setIsProcessing(id);
    try {
      await action();
      toast.success(isAdmin ? "Connection added!" : "Suggestion sent to inbox!");
    } catch (err) {
      // Error handled in context
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="absolute -left-2 -top-2 z-20 h-8 w-8 rounded-full bg-amber-100 text-amber-600 shadow-lg border-2 border-white flex items-center justify-center hover:bg-amber-200 transition-all animate-pulse"
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 rounded-2xl border-none shadow-2xl bg-stone-900 text-white" side="top" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Smart Suggestion</span>
          </div>
          
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div key={s.id} className="space-y-2">
                <p className="text-sm font-serif italic leading-relaxed text-stone-200">
                  "{s.text}"
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900 rounded-lg h-8 text-xs font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(s.id, s.action);
                    }}
                    disabled={!!isProcessing}
                  >
                    {isProcessing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    Yes
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1 text-stone-400 hover:text-white hover:bg-white/10 rounded-lg h-8 text-xs"
                    onClick={(e) => handleDismiss(s.id, e)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    No
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SmartSuggestionHover;