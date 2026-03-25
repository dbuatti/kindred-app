"use client";

import React, { useMemo, useState } from 'react';
import { Sparkles, Check, X, HelpCircle, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn, withArticle } from '@/lib/utils';
import { toast } from 'sonner';
import { getInverseRelationship, getGenderedRole } from '@/lib/relationships';

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

    const getParentIds = (id: string) => {
      return relationships
        .filter(r => {
          const t = r.relationship_type.toLowerCase();
          if (r.related_person_id === id && ['mother', 'father', 'parent'].includes(t)) return true;
          if (r.person_id === id && ['son', 'daughter', 'child'].includes(t)) return true;
          return false;
        })
        .map(r => r.person_id === id ? r.related_person_id : r.person_id);
    };

    const items: { id: string; text: string; action: () => Promise<void> }[] = [];

    // 1. Sibling Inference (Shared Parents)
    const actualParentIds = getParentIds(personId);

    if (actualParentIds.length > 0) {
      people.forEach(p => {
        if (p.id === personId || areLinked(personId, p.id)) return;
        
        const theirParentIds = getParentIds(p.id);
        if (theirParentIds.some(id => actualParentIds.includes(id))) {
          const relType = getGenderedRole('sibling', p.gender);
          items.push({
            id: `sib-${p.id}`,
            text: `Are ${person.name.split(' ')[0]} and ${p.name.split(' ')[0]} siblings?`,
            action: async () => {
              if (isAdmin) {
                await addRelationship(p.id, personId, relType);
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

    // 2. Generational Inference (Grandparents & Great-Grandparents)
    actualParentIds.forEach(parentId => {
      const grandparentIds = getParentIds(parentId);
      
      grandparentIds.forEach(gpId => {
        // Suggest Grandparent
        if (!areLinked(personId, gpId)) {
          const gp = people.find(p => p.id === gpId);
          if (gp) {
            const role = getGenderedRole('Grandparent', gp.gender);
            items.push({
              id: `gp-${gpId}`,
              text: `Is ${gp.name.split(' ')[0]} the ${role} of ${person.name.split(' ')[0]}?`,
              action: async () => {
                if (isAdmin) await addRelationship(gpId, personId, role);
                else await addSuggestion({ personId, fieldName: 'link_existing', suggestedValue: `LINK_EXISTING: ${gpId} as ${role} to ${personId}`, suggestedByEmail: user?.email || 'family@kindred.com' });
              }
            });
          }
        }

        // Suggest Great-Grandparent
        const greatGrandparentIds = getParentIds(gpId);
        greatGrandparentIds.forEach(ggpId => {
          if (!areLinked(personId, ggpId)) {
            const ggp = people.find(p => p.id === ggpId);
            if (ggp) {
              const role = getGenderedRole('Great Grandparent', ggp.gender);
              items.push({
                id: `ggp-${ggpId}`,
                text: `Is ${ggp.name.split(' ')[0]} the ${role} of ${person.name.split(' ')[0]}?`,
                action: async () => {
                  if (isAdmin) await addRelationship(ggpId, personId, role);
                  else await addSuggestion({ personId, fieldName: 'link_existing', suggestedValue: `LINK_EXISTING: ${ggpId} as ${role} to ${personId}`, suggestedByEmail: user?.email || 'family@kindred.com' });
                }
              });
            }
          }
        });
      });
    });

    // 3. Sibling-of-Relative Inference (Uncles/Aunts ONLY)
    const directRelatives = relationships
      .filter(r => r.person_id === personId || r.related_person_id === personId)
      .map(r => {
        const isPrimary = r.person_id === personId;
        const relId = isPrimary ? r.related_person_id : r.person_id;
        const rel = people.find(p => p.id === relId);
        if (!rel) return null;
        const type = !isPrimary ? r.relationship_type : getInverseRelationship(r.relationship_type, rel.gender);
        return { id: relId, name: rel.name, type, gender: rel.gender };
      })
      .filter((r): r is any => r !== null);

    directRelatives.forEach(rel => {
      const relId = rel.id;
      const relType = rel.type.toLowerCase();
      
      // Only suggest siblings for PARENTS (Aunts/Uncles)
      if (!['mother', 'father', 'parent'].includes(relType)) return;

      const siblingsOfRel = relationships
        .filter(r => (r.person_id === relId || r.related_person_id === relId) && 
                     ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
        .map(r => r.person_id === relId ? r.related_person_id : r.person_id);
        
      siblingsOfRel.forEach(sibId => {
        if (sibId === personId || areLinked(personId, sibId)) return;
        const sibling = people.find(p => p.id === sibId);
        if (sibling) {
          const suggestedRole = getGenderedRole('uncle', sibling.gender);
          const relDisplayRole = getGenderedRole(rel.type, rel.gender);
          
          const relFirstName = rel.name.split(' ')[0];
          const personFirstName = person.name.split(' ')[0];
          const siblingFirstName = sibling.name.split(' ')[0];

          items.push({
            id: `sib-rel-${relId}-${sibId}`,
            text: `Since ${relFirstName} is ${personFirstName}'s ${relDisplayRole}, is ${relFirstName}'s sibling ${siblingFirstName}, ${personFirstName}'s ${suggestedRole}?`,
            action: async () => {
              if (isAdmin) await addRelationship(sibId, personId, suggestedRole);
              else await addSuggestion({ personId, fieldName: 'link_existing', suggestedValue: `LINK_EXISTING: ${sibId} as ${suggestedRole} to ${personId}`, suggestedByEmail: user?.email || 'family@kindred.com' });
            }
          });
        }
      });
    });

    return items.filter(item => !dismissedIds.has(item.id));
  }, [person, personId, people, relationships, isAdmin, user, dismissedIds]);

  const handleAction = async (id: string, action: () => Promise<void>, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProcessing(id);
    try {
      await action();
      toast.success(isAdmin ? "Connection added!" : "Suggestion sent to inbox!");
      setDismissedIds(prev => new Set(prev).add(id));
    } catch (err) {
      // Error handled in context
    } finally {
      setIsProcessing(null);
    }
  };

  const handleConfirmAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProcessing('all');
    const toastId = toast.loading(`Processing ${suggestions.length} suggestions...`);
    const idsToDismiss = suggestions.map(s => s.id);
    try {
      for (const s of suggestions) {
        await s.action();
      }
      toast.success("All connections confirmed!", { id: toastId });
      setDismissedIds(prev => {
        const next = new Set(prev);
        idsToDismiss.forEach(id => next.add(id));
        return next;
      });
    } catch (err) {
      toast.error("Failed to process all suggestions.", { id: toastId });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Question copied to clipboard!");
  };

  if (suggestions.length === 0) return null;

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
      <PopoverContent 
        className="w-96 p-6 rounded-[2rem] border-none shadow-2xl bg-stone-900 text-white" 
        side="top" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <HelpCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Smart Suggestion</span>
            </div>
            {suggestions.length > 1 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleConfirmAll}
                disabled={!!isProcessing}
                className="h-7 px-2 text-[9px] font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 hover:bg-white/5 gap-1"
              >
                {isProcessing === 'all' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Confirm All
              </Button>
            )}
          </div>
          
          <div className="space-y-5">
            {suggestions.map((s) => (
              <div key={s.id} className="space-y-3 group/item">
                <div className="relative">
                  <p className="text-base font-serif italic leading-relaxed text-stone-200 pr-8">
                    "{s.text}"
                  </p>
                  <button 
                    onClick={(e) => handleCopy(s.text, e)}
                    className="absolute top-0 right-0 p-1.5 text-stone-500 hover:text-amber-400 transition-colors rounded-lg hover:bg-white/5"
                    title="Copy question"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl h-10 text-xs font-bold"
                    onClick={(e) => handleAction(s.id, s.action, e)}
                    disabled={!!isProcessing}
                  >
                    {isProcessing === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    Yes
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl h-10 text-xs"
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