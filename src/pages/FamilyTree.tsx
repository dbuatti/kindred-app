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

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();

  const me = useMemo(() => {
    return people.find(p => p.userId === user?.id) || people[0];
  }, [people, user]);

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

  // Helper to get siblings
  const getDirectSiblings = (personId: string) => {
    return relationships
      .filter(r => (r.person_id === personId || r.related_person_id === personId) && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
      .map(r => r.person_id === personId ? r.related_person_id : r.person_id);
  };

  // Normalize parents to include spouses (e.g. if Alfred is a parent and Venna is his spouse, they are a parent unit)
  const getNormalizedParents = (personId: string) => {
    let parents = getDirectParents(personId);
    
    // If no direct parents, try to infer from siblings
    if (parents.length === 0) {
      const sibs = getDirectSiblings(personId);
      for (const sibId of sibs) {
        const sibParents = getDirectParents(sibId);
        if (sibParents.length > 0) {
          parents = sibParents;
          break;
        }
      }
    }

    if (parents.length === 0) return [];

    // Expand parent set to include spouses of parents
    const fullSet = new Set(parents);
    parents.forEach(pId => {
      const spouseRel = relationships.find(r => 
        (r.person_id === pId || r.related_person_id === pId) && 
        ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
      );
      if (spouseRel) {
        fullSet.add(spouseRel.person_id === pId ? spouseRel.related_person_id : spouseRel.person_id);
      }
    });
    return Array.from(fullSet).sort();
  };

  // 1. Calculate Generations (Levels) - Ancestors = 0
  const generations = useMemo(() => {
    if (!people.length) return {};
    
    const levels: Record<string, number> = {};
    people.forEach(p => levels[p.id] = 0);

    // Relaxation algorithm: parent level must be less than child level
    for (let i = 0; i < 50; i++) {
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (['mother', 'father', 'parent'].includes(type)) {
          levels[r.person_id] = Math.max(levels[r.person_id], levels[r.related_person_id] + 1);
        }
        if (['son', 'daughter', 'child'].includes(type)) {
          levels[r.related_person_id] = Math.max(levels[r.related_person_id], levels[r.person_id] + 1);
        }
        if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
          const max = Math.max(levels[r.person_id], levels[r.related_person_id]);
          levels[r.person_id] = max;
          levels[r.related_person_id] = max;
        }
      });
    }

    // Normalize so min level is 0
    const minLevel = Math.min(...Object.values(levels));
    Object.keys(levels).forEach(id => levels[id] -= minLevel);

    return levels;
  }, [people, relationships]);

  // 2. Group people by generation and sibling groups
  const treeData = useMemo(() => {
    const gens: Record<number, { siblingGroups: Record<string, any[]> }> = {};
    const renderedIds = new Set<string>();

    const sortedLevels = Array.from(new Set(Object.values(generations))).sort((a, b) => a - b);

    sortedLevels.forEach(level => {
      if (!gens[level]) gens[level] = { siblingGroups: {} };
      
      const peopleInLevel = people.filter(p => generations[p.id] === level);

      peopleInLevel.forEach(person => {
        if (renderedIds.has(person.id)) return;

        // Determine grouping key
        const parents = getNormalizedParents(person.id);
        let groupKey = parents.length > 0 ? `parents-${parents.join('-')}` : 'root';
        
        // If no parents, check if they are part of a sibling group with no parents
        if (groupKey === 'root') {
          const sibs = getDirectSiblings(person.id);
          if (sibs.length > 0) {
            const allSibs = [person.id, ...sibs].sort();
            groupKey = `sibs-${allSibs[0]}`;
          }
        }

        if (!gens[level].siblingGroups[groupKey]) {
          gens[level].siblingGroups[groupKey] = [];
        }

        // Find spouse
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
      .sort(([a], [b]) => Number(a) - Number(b))
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
    return target.birthYear || "Family Member";
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

      <main className="max-w-7xl mx-auto px-8 py-24 space-y-32">
        {treeData.map((gen) => (
          <div key={gen.level} className="relative flex flex-wrap justify-center gap-16">
            {Object.entries(gen.siblingGroups).map(([groupKey, members]) => (
              <div key={groupKey} className="relative flex flex-col items-center">
                
                {/* Sibling Connector Bar (Above the group) */}
                {groupKey !== 'root' && (
                  <div className="absolute -top-32 left-0 right-0 flex flex-col items-center pointer-events-none">
                    {/* Vertical line coming from parents above */}
                    <div className="h-16 w-px bg-stone-200" />
                    {/* Horizontal bar connecting siblings */}
                    {members.length > 1 && (
                      <div className="h-px bg-stone-200 w-full" />
                    )}
                  </div>
                )}

                <div className="flex gap-12">
                  {members.map((item) => {
                    const isCouple = Array.isArray(item);
                    const person = isCouple ? item[0] : item;
                    const spouse = isCouple ? item[1] : null;

                    return (
                      <div key={person.id} className="relative flex flex-col items-center">
                        
                        {/* Vertical line from sibling bar down to node */}
                        {groupKey !== 'root' && (
                          <div className="absolute -top-16 h-16 w-px bg-stone-200 pointer-events-none" />
                        )}

                        <div className={cn(
                          "flex gap-4 p-6 rounded-[3rem] bg-white shadow-sm border-2 transition-all relative group hover:shadow-md",
                          isCouple ? "border-amber-100 bg-amber-50/10" : "border-stone-100 hover:border-amber-200"
                        )}>
                          <div 
                            onClick={() => navigate(getPersonUrl(person.id, person.name))}
                            className="relative flex flex-col items-center space-y-3 cursor-pointer"
                          >
                            <QuickAddMenu personId={person.id} personName={person.name} />
                            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all">
                              {person.photoUrl ? (
                                <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0" />
                              ) : (
                                <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-300">
                                  <UserCircle className="w-10 h-10" />
                                </div>
                              )}
                            </div>
                            <div className="text-center">
                              <h3 className="font-serif font-bold text-stone-800 text-xs md:text-sm">{person.name.split(' ')[0]}</h3>
                              <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{getRelationshipLabel(person)}</p>
                            </div>
                          </div>

                          {spouse && (
                            <>
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className="bg-white p-1.5 rounded-full shadow-sm border border-amber-100">
                                  <Heart className="w-3 h-3 text-red-400 fill-current" />
                                </div>
                              </div>
                              <div 
                                onClick={() => navigate(getPersonUrl(spouse.id, spouse.name))}
                                className="relative flex flex-col items-center space-y-3 cursor-pointer"
                              >
                                <QuickAddMenu personId={spouse.id} personName={spouse.name} />
                                <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all">
                                  {spouse.photoUrl ? (
                                    <img src={spouse.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0" />
                                  ) : (
                                    <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-300">
                                      <UserCircle className="w-10 h-10" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-center">
                                  <h3 className="font-serif font-bold text-stone-800 text-xs md:text-sm">{spouse.name.split(' ')[0]}</h3>
                                  <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{getRelationshipLabel(spouse)}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
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