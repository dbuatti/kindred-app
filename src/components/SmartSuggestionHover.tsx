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

  const person = useMemo(() => people.find(p => p.id === personId), [people, personId]);

  const suggestions = useMemo(() => {
    if (!person) return [];
    const items: { id: string; text: string; action: () => Promise<void> }[] = [];

    // 1. Sibling Inference: Share a parent but not marked as siblings
    const myParents = relationships
      .filter(r => r.person_id === personId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
      .map(r => r.related_person_id)
      .concat(
        relationships
          .filter(r => r.related_person_id === personId && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
          .map(r => r.person_id)
      );

    if (myParents.length > 0) {
      const potentialSiblings = people.filter(p => {
        if (p.id === personId) return false;
        
        // Check if this person shares any of my parents
        const theirParents = relationships
          .filter(r => r.person_id === p.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
          .map(r => r.related_person_id)
          .concat(
            relationships
              .filter(r => r.related_person_id === p.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
              .map(r => r.person_id)
          );
        
        const sharesParent = theirParents.some(tp => myParents.includes(tp));
        
        // Check if we are already marked as siblings
        const alreadySiblings = relationships.some(r => 
          (r.person_id === personId && r.related_person_id === p.id || r.person_id === p.id && r.related_person_id === personId) &&
          ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())
        );

        return sharesParent && !alreadySiblings;
      });

      potentialSiblings.forEach(sib => {
        items.push({
          id: `sib-${sib.id}`,
          text: `Should ${person.name.split(' ')[0]} and ${sib.name.split(' ')[0]} be marked as siblings?`,
          action: async () => {
            const relType = sib.gender === 'female' ? 'sister' : 'brother';
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
    const mySiblings = relationships
      .filter(r => (r.person_id === personId || r.related_person_id === personId) && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
      .map(r => r.person_id === personId ? r.related_person_id : r.person_id);

    mySiblings.forEach(sibId => {
      const sibParents = relationships
        .filter(r => r.person_id === sibId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
        .map(r => r.related_person_id)
        .concat(
          relationships
            .filter(r => r.related_person_id === sibId && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
            .map(r => r.person_id)
        );

      sibParents.forEach(pId => {
        const alreadyMyParent = relationships.some(r => 
          (r.person_id === personId && r.related_person_id === pId) ||
          (r.related_person_id === personId && r.person_id === pId)
        );

        if (!alreadyMyParent) {
          const parent = people.find(p => p.id === pId);
          if (parent) {
            items.push({
              id: `parent-${pId}`,
              text: `Is ${parent.name} also the ${parent.gender === 'female' ? 'mother' : 'father'} of ${person.name.split(' ')[0]}?`,
              action: async () => {
                const relType = parent.gender === 'female' ? 'mother' : 'father';
                if (isAdmin) {
                  await addRelationship(personId, pId, relType);
                } else {
                  await addSuggestion({
                    personId: personId,
                    fieldName: 'link_existing',
                    suggestedValue: `LINK_EXISTING: ${pId} as ${relType} to ${personId}`,
                    suggestedByEmail: user?.email || 'family@kindred.com'
                  });
                }
              }
            });
          }
        }
      });
    });

    return items;
  }, [person, personId, people, relationships, isAdmin, user]);

  if (suggestions.length === 0) return null;

  const handleAction = async (id: string, action: () => Promise<void>) => {
    setIsProcessing(id);
    try {
      await action();
      toast.success(isAdmin ? "Connection added!" : "Suggestion sent to inbox!");
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setIsProcessing(null);
    }
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
                    {isProcessing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                    Yes
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1 text-stone-400 hover:text-white hover:bg-white/10 rounded-lg h-8 text-xs"
                    onClick={(e) => e.stopPropagation()}
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