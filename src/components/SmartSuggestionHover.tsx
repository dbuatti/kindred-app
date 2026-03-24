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

    const areLinked = (id1: string, id2: string) => {
      return relationships.some(r => 
        (r.person_id === id1 && r.related_person_id === id2) || 
        (r.person_id === id2 && r.related_person_id === id1)
      );
    };

    const getRelIds = (id: string, types: string[]) => {
      const ids = new Set<string>();
      relationships.forEach(r => {
        const t = r.relationship_type.toLowerCase();
        const matchesType = types.some(type => t.includes(type));
        if (!matchesType) return;

        if (r.person_id === id) ids.add(r.related_person_id);
        if (r.related_person_id === id) ids.add(r.person_id);
      });
      return Array.from(ids);
    };

    const mySiblingIds = getRelIds(personId, ['brother', 'sister', 'sibling']);

    const items: { id: string; text: string; action: () => Promise<void> }[] = [];

    // 1. Sibling Inference
    const actualParentIds = relationships
      .filter(r => {
        const t = r.relationship_type.toLowerCase();
        if (r.related_person_id === personId && ['mother', 'father', 'parent'].includes(t)) return true;
        if (r.person_id === personId && ['son', 'daughter', 'child'].includes(t)) return true;
        return false;
      })
      .map(r => r.person_id === personId ? r.related_person_id : r.person_id);

    if (actualParentIds.length > 0) {
      people.forEach(p => {
        if (p.id === personId || areLinked(personId, p.id)) return;
        
        const theirParentIds = relationships
          .filter(r => {
            const t = r.relationship_type.toLowerCase();
            if (r.related_person_id === p.id && ['mother', 'father', 'parent'].includes(t)) return true;
            if (r.person_id === p.id && ['son', 'daughter', 'child'].includes(t)) return true;
            return false;
          })
          .map(r => r.person_id === p.id ? r.related_person_id : r.person_id);
        
        if (theirParentIds.some(id => actualParentIds.includes(id))) {
          items.push({
            id: `sib-${p.id}`,
            text: `Should ${person.name.split(' ')[0]} and ${p.name.split(' ')[0]} be marked as siblings?`,
            action: async () => {
              const relType = p.gender?.toLowerCase() === 'female' ? 'sister' : 
                             p.gender?.toLowerCase() === 'male' ? 'brother' : 'sibling';
              if (isAdmin) {
                await addRelationship(personId, p.id, relType);
              } else {
                await addSuggestion({
                  personId: personId,
                  fieldName: 'link_existing',
                  suggestedValue: `LINK_EXISTING: ${p.id} as ${relType} to ${personId}`,
                  suggestedByEmail: user?.email || 'family@kindred.com'
                });
              }
            }
          });
        }
      });
    }

    // 2. Parent Inference
    mySiblingIds.forEach(sibId => {
      const sibParentIds = relationships
        .filter(r => {
          const t = r.relationship_type.toLowerCase();
          if (r.related_person_id === sibId && ['mother', 'father', 'parent'].includes(t)) return true;
          if (r.person_id === sibId && ['son', 'daughter', 'child'].includes(t)) return true;
          return false;
        })
        .map(r => r.person_id === sibId ? r.related_person_id : r.person_id);

      sibParentIds.forEach(pId => {
        if (pId === personId || areLinked(personId, pId)) return;

        const parent = people.find(p => p.id === pId);
        if (parent) {
          const role = parent.gender?.toLowerCase() === 'female' ? 'mother' : 
                       parent.gender?.toLowerCase() === 'male' ? 'father' : 'parent';
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

    // 3. Spouse Inference
    const actualChildIds = relationships
      .filter(r => {
        const t = r.relationship_type.toLowerCase();
        if (r.person_id === personId && ['mother', 'father', 'parent'].includes(t)) return true;
        if (r.related_person_id === personId && ['son', 'daughter', 'child'].includes(t)) return true;
        return false;
      })
      .map(r => r.person_id === personId ? r.related_person_id : r.person_id);

    if (actualChildIds.length > 0) {
      people.forEach(p => {
        if (p.id === personId || areLinked(personId, p.id)) return;
        
        const theirChildIds = relationships
          .filter(r => {
            const t = r.relationship_type.toLowerCase();
            if (r.person_id === p.id && ['mother', 'father', 'parent'].includes(t)) return true;
            if (r.related_person_id === p.id && ['son', 'daughter', 'child'].includes(t)) return true;
            return false;
          })
          .map(r => r.person_id === p.id ? r.related_person_id : r.person_id);
        
        const sharesChild = theirChildIds.some(id => actualChildIds.includes(id));
        if (sharesChild) {
          const theirParentIds = relationships
            .filter(r => {
              const t = r.relationship_type.toLowerCase();
              if (r.related_person_id === p.id && ['mother', 'father', 'parent'].includes(t)) return true;
              if (r.person_id === p.id && ['son', 'daughter', 'child'].includes(t)) return true;
              return false;
            })
            .map(r => r.person_id === p.id ? r.related_person_id : r.person_id);
          
          const sharesParent = theirParentIds.some(id => actualParentIds.includes(id));
          if (sharesParent) return;

          items.push({
            id: `spouse-${p.id}`,
            text: `Are ${person.name.split(' ')[0]} and ${p.name.split(' ')[0]} spouses?`,
            action: async () => {
              if (isAdmin) {
                await addRelationship(personId, p.id, 'spouse');
              } else {
                await addSuggestion({
                  personId: personId,
                  fieldName: 'link_existing',
                  suggestedValue: `LINK_EXISTING: ${p.id} as spouse to ${personId}`,
                  suggestedByEmail: user?.email || 'family@kindred.com'
                });
              }
            }
          });
        }
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