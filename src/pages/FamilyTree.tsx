"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart, UserCircle, ChevronDown } from 'lucide-react';
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

  // 1. Calculate Generations (Levels)
  const generations = useMemo(() => {
    if (!people.length) return {};
    
    const levels: Record<string, number> = {};
    people.forEach(p => levels[p.id] = 0);

    // Simple relaxation algorithm to settle levels based on relationships
    for (let i = 0; i < 20; i++) {
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        
        // Parent -> Child link (r.related_person_id is parent, r.person_id is child)
        if (['mother', 'father', 'parent'].includes(type)) {
          levels[r.person_id] = Math.max(levels[r.person_id], levels[r.related_person_id] + 1);
        }
        
        // Child -> Parent link (r.person_id is parent, r.related_person_id is child)
        if (['son', 'daughter', 'child'].includes(type)) {
          levels[r.related_person_id] = Math.max(levels[r.related_person_id], levels[r.person_id] + 1);
        }
        
        // Spouse/Sibling links (should be on same level)
        if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
          const max = Math.max(levels[r.person_id], levels[r.related_person_id]);
          levels[r.person_id] = max;
          levels[r.related_person_id] = max;
        }
      });
    }

    // Normalize levels so the minimum is 0
    const minLevel = Math.min(...Object.values(levels));
    Object.keys(levels).forEach(id => {
      levels[id] -= minLevel;
    });

    return levels;
  }, [people, relationships]);

  // 2. Group people by generation and identify couples
  const treeData = useMemo(() => {
    const gens: Record<number, { couples: any[][], singles: any[] }> = {};
    const processed = new Set();

    // Sort people into generations
    Object.entries(generations).forEach(([id, level]) => {
      if (processed.has(id)) return;
      
      if (!gens[level]) gens[level] = { couples: [], singles: [] };
      
      const person = people.find(p => p.id === id);
      if (!person) return;

      // Find spouse in the same generation
      const spouseRel = relationships.find(r => 
        (r.person_id === id || r.related_person_id === id) && 
        ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
      );

      const spouseId = spouseRel ? (spouseRel.person_id === id ? spouseRel.related_person_id : spouseRel.person_id) : null;
      const spouse = spouseId ? people.find(p => p.id === spouseId) : null;

      if (spouse && generations[spouse.id] === level) {
        gens[level].couples.push([person, spouse]);
        processed.add(id);
        processed.add(spouse.id);
      } else {
        gens[level].singles.push(person);
        processed.add(id);
      }
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

      <main className="max-w-6xl mx-auto px-8 py-16 space-y-24">
        {treeData.map((gen, gIdx) => (
          <div key={gen.level} className="relative">
            {/* Generation Connector Line */}
            {gIdx > 0 && (
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="h-24 w-px bg-gradient-to-b from-stone-100 to-stone-300" />
                <ChevronDown className="w-4 h-4 text-stone-300 -mt-1" />
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-12">
              {/* Render Couples */}
              {gen.couples.map((couple, cIdx) => (
                <div key={cIdx} className="flex gap-4 p-6 rounded-[3rem] bg-white shadow-sm border-2 border-amber-100 bg-amber-50/10 relative group hover:shadow-md transition-all">
                  {couple.map((person, pIdx) => (
                    <React.Fragment key={person.id}>
                      {pIdx > 0 && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                          <div className="bg-white p-1.5 rounded-full shadow-sm border border-amber-100">
                            <Heart className="w-3 h-3 text-red-400 fill-current" />
                          </div>
                        </div>
                      )}
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
                    </React.Fragment>
                  ))}
                </div>
              ))}

              {/* Render Singles */}
              {gen.singles.map((person) => (
                <div 
                  key={person.id}
                  onClick={() => navigate(getPersonUrl(person.id, person.name))}
                  className="group relative flex flex-col items-center space-y-3 cursor-pointer p-6 rounded-[3rem] bg-white shadow-sm border-2 border-stone-100 hover:border-amber-200 transition-all"
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
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default FamilyTree;