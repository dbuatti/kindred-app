"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart, UserCircle, Users2, Link2 } from 'lucide-react';
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

  // 1. Calculate Generational Levels for everyone
  const personLevels = useMemo(() => {
    if (!people.length) return {};
    
    const levels: Record<string, number> = {};
    const visited = new Set<string>();
    
    // Initialize all to a default
    people.forEach(p => levels[p.id] = 0);

    // Iterative relaxation to settle levels
    // Parent -> Child = +1
    // Spouse/Sibling/Cousin = 0
    for (let i = 0; i < 50; i++) {
      let changed = false;
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id;
        const p2 = r.related_person_id;

        // Parent logic
        if (['mother', 'father', 'parent'].includes(type)) {
          // p2 is parent of p1. So level(p1) = level(p2) + 1
          if (levels[p1] !== levels[p2] + 1) {
            levels[p1] = levels[p2] + 1;
            changed = true;
          }
        }
        // Child logic
        if (['son', 'daughter', 'child'].includes(type)) {
          // p1 is parent of p2. So level(p2) = level(p1) + 1
          if (levels[p2] !== levels[p1] + 1) {
            levels[p2] = levels[p1] + 1;
            changed = true;
          }
        }
        // Peer logic (Spouse, Sibling, Cousin)
        if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling', 'cousin'].includes(type)) {
          const targetLevel = Math.max(levels[p1], levels[p2]);
          if (levels[p1] !== targetLevel || levels[p2] !== targetLevel) {
            levels[p1] = targetLevel;
            levels[p2] = targetLevel;
            changed = true;
          }
        }
      });
      if (!changed) break;
    }

    // Normalize so top is 0
    const minLevel = Math.min(...Object.values(levels));
    const normalized: Record<string, number> = {};
    Object.keys(levels).forEach(id => normalized[id] = levels[id] - minLevel);
    return normalized;
  }, [people, relationships]);

  // 2. Group people into "Connection Clusters" within each level
  const treeData = useMemo(() => {
    const levels: Record<number, any[][]> = {};
    const processed = new Set<string>();

    // Sort levels
    const sortedLevelNums = Array.from(new Set(Object.values(personLevels))).sort((a, b) => a - b);

    sortedLevelNums.forEach(lvl => {
      levels[lvl] = [];
      const peopleInLvl = people.filter(p => personLevels[p.id] === lvl);

      peopleInLvl.forEach(person => {
        if (processed.has(person.id)) return;

        // Find all connected peers (spouses/siblings) in this level
        const cluster: any[] = [];
        const queue = [person];
        processed.add(person.id);

        while (queue.length > 0) {
          const curr = queue.shift();
          cluster.push(curr);

          // Find peers
          relationships.forEach(r => {
            const type = r.relationship_type.toLowerCase();
            if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
              const otherId = r.person_id === curr.id ? r.related_person_id : r.person_id;
              const other = people.find(p => p.id === otherId);
              if (other && personLevels[other.id] === lvl && !processed.has(other.id)) {
                processed.add(other.id);
                queue.push(other);
              }
            }
          });
        }
        levels[lvl].push(cluster);
      });
    });

    return levels;
  }, [people, personLevels, relationships]);

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

  const getPeerLink = (p1: string, p2: string) => {
    const rel = relationships.find(r => 
      (r.person_id === p1 && r.related_person_id === p2) ||
      (r.person_id === p2 && r.related_person_id === p1)
    );
    if (!rel) return null;
    const type = rel.relationship_type.toLowerCase();
    if (['spouse', 'wife', 'husband'].includes(type)) return 'spouse';
    if (['brother', 'sister', 'sibling'].includes(type)) return 'sibling';
    return null;
  };

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 overflow-x-auto">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-6 sticky top-0 z-30">
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

      <main className="p-24 min-w-max flex flex-col items-center gap-32">
        {Object.entries(treeData).map(([lvl, clusters]) => (
          <div key={lvl} className="flex gap-24 items-start">
            {clusters.map((cluster, cIdx) => (
              <div key={cIdx} className="flex flex-col items-center gap-12">
                
                {/* Cluster Container */}
                <div className="flex items-center gap-4 p-6 rounded-[4rem] bg-white/40 border-2 border-stone-50 shadow-sm relative">
                  {cluster.map((person, pIdx) => {
                    const nextPerson = cluster[pIdx + 1];
                    const linkType = nextPerson ? getPeerLink(person.id, nextPerson.id) : null;

                    return (
                      <React.Fragment key={person.id}>
                        <div 
                          onClick={() => navigate(getPersonUrl(person.id, person.name))}
                          className="relative flex flex-col items-center space-y-4 cursor-pointer group"
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

                        {/* Connector between peers in cluster */}
                        {linkType && (
                          <div className="flex flex-col items-center gap-1 px-2">
                            <div className="h-px w-8 bg-stone-200" />
                            {linkType === 'spouse' ? (
                              <Heart className="w-4 h-4 text-red-400 fill-current" />
                            ) : (
                              <Users2 className="w-4 h-4 text-amber-400" />
                            )}
                            <div className="h-px w-8 bg-stone-200" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Vertical Line Down to next generation (if not last level) */}
                {Number(lvl) < Object.keys(treeData).length - 1 && (
                  <div className="w-px h-12 bg-stone-200" />
                )}
              </div>
            ))}
          </div>
        ))}
      </main>
    </div>
  );
};

export default FamilyTree;