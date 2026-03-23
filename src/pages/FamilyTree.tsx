"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart, UserCircle } from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { getInverseRelationship } from '@/lib/relationships';
import { cn } from '@/lib/utils';
import QuickAddMenu from '../components/QuickAddMenu';
import SmartSuggestionHover from '../components/SmartSuggestionHover';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();

  const me = useMemo(() => {
    return people.find(p => p.userId === user?.id) || people[0];
  }, [people, user]);

  // 1. Calculate Generations (Levels) with a robust iterative algorithm
  const generations = useMemo(() => {
    if (!people.length) return {};
    
    const levels: Record<string, number> = {};
    people.forEach(p => levels[p.id] = 0);

    // Iterative relaxation to settle levels
    // We want: Parent = Child + 1
    // Spouse = Spouse
    // Sibling = Sibling
    // Cousin = Cousin
    for (let i = 0; i < 50; i++) {
      let changed = false;
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id;
        const p2 = r.related_person_id;

        // Parent/Child relationships
        if (['mother', 'father', 'parent'].includes(type)) {
          // p2 is the parent of p1
          if (levels[p2] !== levels[p1] + 1) {
            levels[p2] = levels[p1] + 1;
            changed = true;
          }
        }
        if (['son', 'daughter', 'child'].includes(type)) {
          // p1 is the parent of p2
          if (levels[p1] !== levels[p2] + 1) {
            levels[p1] = levels[p2] + 1;
            changed = true;
          }
        }

        // Same-level relationships: Spouse, Sibling, Cousin
        if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling', 'cousin'].includes(type)) {
          const max = Math.max(levels[p1], levels[p2]);
          if (levels[p1] !== max || levels[p2] !== max) {
            levels[p1] = max;
            levels[p2] = max;
            changed = true;
          }
        }
      });
      if (!changed) break;
    }

    // Normalize so the lowest level is 0
    const minLevel = Math.min(...Object.values(levels));
    const normalized: Record<string, number> = {};
    Object.keys(levels).forEach(id => normalized[id] = levels[id] - minLevel);

    return normalized;
  }, [people, relationships]);

  // Helper to get direct parents
  const getDirectParents = (personId: string) => {
    const parentIds = relationships
      .filter(r => r.person_id === personId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
      .map(r => r.related_person_id)
      .concat(
        relationships
          .filter(r => r.related_person_id === personId && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
          .map(r => r.person_id)
      );
    return Array.from(new Set(parentIds)).sort();
  };

  // Generate a unique key for a sibling group based on their parent unit
  const getParentUnitKey = (personId: string) => {
    const parents = getDirectParents(personId);
    if (parents.length === 0) return null;
    
    const unitSet = new Set<string>();
    parents.forEach(pId => {
      unitSet.add(pId);
      const spouseRel = relationships.find(r => 
        (r.person_id === pId || r.related_person_id === pId) && 
        ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
      );
      if (spouseRel) {
        unitSet.add(spouseRel.person_id === pId ? spouseRel.related_person_id : spouseRel.person_id);
      }
    });
    return Array.from(unitSet).sort().join('-');
  };

  // 2. Group people by generation and sibling groups
  const treeData = useMemo(() => {
    const gens: Record<number, { siblingGroups: Record<string, any[]> }> = {};
    const renderedIds = new Set<string>();

    const sortedLevels = Array.from(new Set(Object.values(generations))).sort((a, b) => b - a);

    sortedLevels.forEach(level => {
      if (!gens[level]) gens[level] = { siblingGroups: {} };
      
      const peopleInLevel = people.filter(p => generations[p.id] === level);

      peopleInLevel.forEach(person => {
        if (renderedIds.has(person.id)) return;

        const parentKey = getParentUnitKey(person.id);
        const groupKey = parentKey ? `parents-${parentKey}` : `root-${person.id}`;

        if (!gens[level].siblingGroups[groupKey]) {
          gens[level].siblingGroups[groupKey] = [];
        }

        const spouseRel = relationships.find(r => 
          (r.person_id === person.id || r.related_person_id === person.id) && 
          ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
        );

        const spouseId = spouseRel ? (spouseRel.person_id === person.id ? spouseRel.related_person_id : spouseRel.person_id) : null;
        const spouse = spouseId ? people.find(p => p.id === spouseId) : null;

        if (spouse && generations[spouse.id] === level && !renderedIds.has(spouse.id)) {
          gens[level].siblingGroups[groupKey].push([person, spouse]);
          renderedIds.add(person.id);
          renderedIds.add(spouse.id);
        } else {
          gens[level].siblingGroups[groupKey].push(person);
          renderedIds.add(person.id);
        }
      });
    });

    return Object.entries(gens)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([level, data]) => ({ level: Number(level), ...data }));
  }, [people, generations, relationships]);

  const getRelationshipLabel = (target: any) => {
    if (!me || target.id === me.id) return "You";
    const directRel = relationships.find(r => 
      (r.person_id === me.id && r.related_person_id === target.id) ||
      (r.person_id === target.id && r.related_person_id === me.id)
    );
    if (directRel) {
      if (directRel.person_id === me.id) return directRel.relationship_type;
      return getInverseRelationship(directRel.relationship_type, target.gender);
    }
    return "Family Member";
  };

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 overflow-x-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-6 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800">Family Tree</h1>
              <p className="text-stone-400 text-sm uppercase tracking-widest font-medium">Our Living History</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 gap-2">
            <Share2 className="w-4 h-4" /> Share Tree
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-24 space-y-40">
        {treeData.map((gen, genIdx) => (
          <div key={gen.level} className="relative flex flex-wrap justify-center gap-24">
            {Object.entries(gen.siblingGroups).map(([groupKey, members]) => (
              <div key={groupKey} className="relative flex flex-col items-center">
                
                {/* Sibling Connector Bar (Horizontal) */}
                {!groupKey.startsWith('root') && (
                  <div className="absolute -top-20 left-0 right-0 flex flex-col items-center pointer-events-none">
                    <div className="h-10 w-px bg-stone-200" />
                    {members.length > 1 && (
                      <div className="h-px bg-stone-200 w-full" />
                    )}
                  </div>
                )}

                <div className="flex gap-16">
                  {members.map((item, itemIdx) => {
                    const isCouple = Array.isArray(item);
                    const person = isCouple ? item[0] : item;
                    const spouse = isCouple ? item[1] : null;

                    return (
                      <div key={person.id} className="relative flex flex-col items-center">
                        
                        {/* Vertical line to child */}
                        {!groupKey.startsWith('root') && (
                          <div className="absolute -top-10 h-10 w-px bg-stone-200 pointer-events-none" />
                        )}

                        <div className={cn(
                          "flex gap-6 p-8 rounded-[3.5rem] bg-white shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border-2 transition-all relative group hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)]",
                          isCouple ? "border-amber-50 bg-amber-50/5" : "border-stone-50 hover:border-amber-100"
                        )}>
                          <div 
                            onClick={() => navigate(getPersonUrl(person.id, person.name))}
                            className="relative flex flex-col items-center space-y-4 cursor-pointer"
                          >
                            <SmartSuggestionHover personId={person.id} />
                            <QuickAddMenu personId={person.id} personName={person.name} />
                            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all duration-500">
                              {person.photoUrl ? (
                                <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                              ) : (
                                <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                                  <UserCircle className="w-12 h-12" />
                                </div>
                              )}
                            </div>
                            <div className="text-center space-y-1">
                              <h3 className="font-serif font-bold text-stone-800 text-sm md:text-base">{person.name.split(' ')[0]}</h3>
                              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{getRelationshipLabel(person)}</p>
                            </div>
                          </div>

                          {spouse && (
                            <>
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className="bg-white p-2 rounded-full shadow-md border border-amber-50">
                                  <Heart className="w-4 h-4 text-red-400 fill-current" />
                                </div>
                              </div>
                              <div 
                                onClick={() => navigate(getPersonUrl(spouse.id, spouse.name))}
                                className="relative flex flex-col items-center space-y-4 cursor-pointer"
                              >
                                <SmartSuggestionHover personId={spouse.id} />
                                <QuickAddMenu personId={spouse.id} personName={spouse.name} />
                                <div className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all duration-500">
                                  {spouse.photoUrl ? (
                                    <img src={spouse.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                                  ) : (
                                    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                                      <UserCircle className="w-12 h-12" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-center space-y-1">
                                  <h3 className="font-serif font-bold text-stone-800 text-sm md:text-base">{spouse.name.split(' ')[0]}</h3>
                                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{getRelationshipLabel(spouse)}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Vertical line down to next generation bar */}
                        {genIdx < treeData.length - 1 && (
                          <div className="absolute -bottom-20 h-20 w-px bg-stone-200 pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>
    </div>
  );
};

export default FamilyTree;