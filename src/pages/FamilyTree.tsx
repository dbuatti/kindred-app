"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Share2, Network } from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { getInverseRelationship } from '@/lib/relationships';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();

  const me = useMemo(() => {
    return people.find(p => p.userId === user?.id) || people[0];
  }, [people, user]);

  // Helper to find relationship between two people (direct or indirect)
  const getRelationshipLabel = (target: any) => {
    if (!me || target.id === me.id) return "You";
    
    // 1. Check direct relationship
    const directRel = relationships.find(r => 
      (r.person_id === me.id && r.related_person_id === target.id) ||
      (r.person_id === target.id && r.related_person_id === me.id)
    );

    if (directRel) {
      if (directRel.person_id === me.id) return directRel.relationship_type;
      return getInverseRelationship(directRel.relationship_type, target.gender);
    }

    // 2. Check indirect (Uncle/Aunt/Cousin)
    // Find my parents
    const myParents = relationships
      .filter(r => (r.person_id === me.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) ||
                   (r.related_person_id === me.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase())))
      .map(r => r.person_id === me.id ? r.related_person_id : r.person_id);

    for (const parentId of myParents) {
      // Is target a sibling of my parent? (Uncle/Aunt)
      const isParentSibling = relationships.some(r => 
        (r.person_id === parentId && r.related_person_id === target.id && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())) ||
        (r.person_id === target.id && r.related_person_id === parentId && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
      );

      if (isParentSibling) {
        if (target.gender === 'male') return 'Uncle';
        if (target.gender === 'female') return 'Aunt';
        return 'Relative';
      }

      // Is target a child of my parent's sibling? (Cousin)
      const parentSiblings = relationships
        .filter(r => (r.person_id === parentId && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())) ||
                     (r.related_person_id === parentId && ['brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())))
        .map(r => r.person_id === parentId ? r.related_person_id : r.person_id);

      for (const sibId of parentSiblings) {
        const isCousin = relationships.some(r => 
          (r.person_id === sibId && r.related_person_id === target.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase())) ||
          (r.person_id === target.id && r.related_person_id === sibId && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase()))
        );
        if (isCousin) return 'Cousin';
      }
    }

    return target.birthYear || target.personalityTags?.[0] || "Relative";
  };

  const generations = useMemo(() => {
    if (!people.length || !me) return [];
    
    const depthMap: Record<string, number> = {};
    const queue: { id: string; depth: number }[] = [{ id: me.id, depth: 0 }];
    const visited = new Set([me.id]);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      depthMap[id] = depth;

      relationships.forEach(r => {
        let neighborId: string | null = null;
        let nextDepth = depth;

        const type = r.relationship_type.toLowerCase();
        if (r.person_id === id) {
          neighborId = r.related_person_id;
          if (['father', 'mother', 'parent'].includes(type)) nextDepth = depth - 1;
          else if (['son', 'daughter', 'child'].includes(type)) nextDepth = depth + 1;
          else if (['grandfather', 'grandmother', 'grandparent'].includes(type)) nextDepth = depth - 2;
          else if (['grandson', 'granddaughter', 'grandchild'].includes(type)) nextDepth = depth + 2;
        } else if (r.related_person_id === id) {
          neighborId = r.person_id;
          if (['father', 'mother', 'parent'].includes(type)) nextDepth = depth + 1;
          else if (['son', 'daughter', 'child'].includes(type)) nextDepth = depth - 1;
          else if (['grandfather', 'grandmother', 'grandparent'].includes(type)) nextDepth = depth + 2;
          else if (['grandson', 'granddaughter', 'grandchild'].includes(type)) nextDepth = depth - 2;
        }

        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, depth: nextDepth });
        }
      });
    }

    const genOrder = [
      { name: "Ancestors", depth: -3 },
      { name: "Grandparents' Generation", depth: -2 },
      { name: "Parents' Generation", depth: -1 },
      { name: "Current Generation", depth: 0 },
      { name: "Next Generation", depth: 1 }
    ];

    return genOrder.map(gen => {
      const members = people.filter(p => depthMap[p.id] === gen.depth || (gen.depth === -3 && depthMap[p.id] < -2));
      
      // Group members into "Family Units" (clusters)
      const clusters: any[][] = [];
      const processed = new Set();

      members.forEach(p => {
        if (processed.has(p.id)) return;

        const cluster = [p];
        processed.add(p.id);

        // Find spouses or siblings in the same generation to group them
        members.forEach(other => {
          if (processed.has(other.id)) return;
          
          const isRelated = relationships.some(r => 
            (r.person_id === p.id && r.related_person_id === other.id && ['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase())) ||
            (r.person_id === other.id && r.related_person_id === p.id && ['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()))
          );

          if (isRelated) {
            cluster.push(other);
            processed.add(other.id);
          }
        });

        clusters.push(cluster);
      });

      return { ...gen, clusters };
    }).filter(g => g.clusters.length > 0);
  }, [people, me, relationships]);

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

      <main className="max-w-6xl mx-auto px-8 py-16">
        <div className="relative space-y-32">
          {/* Vertical line connecting generations */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-100 -translate-x-1/2 hidden md:block" />

          {generations.map((gen, idx) => (
            <section key={gen.name} className="relative space-y-12">
              <div className="flex justify-center">
                <div className="bg-amber-50 text-amber-800 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] shadow-sm border border-amber-100 z-10">
                  {gen.name}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-16 md:gap-24">
                {gen.clusters.map((cluster, cIdx) => (
                  <div key={cIdx} className="flex gap-8 md:gap-12 p-8 rounded-[3rem] bg-white/40 border border-stone-100/50 shadow-sm relative">
                    {/* Cluster label or connector could go here */}
                    {cluster.map((person: any) => (
                      <div 
                        key={person.id}
                        onClick={() => navigate(getPersonUrl(person.id, person.name))}
                        className="group relative flex flex-col items-center space-y-4 cursor-pointer animate-in fade-in zoom-in duration-700"
                      >
                        <div className="relative">
                          <div className="h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden border-4 border-white shadow-xl ring-1 ring-stone-100 group-hover:ring-amber-400 group-hover:scale-105 transition-all duration-500">
                            {person.photoUrl ? (
                              <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0" />
                            ) : (
                              <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                                <Users className="w-10 h-10" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-center space-y-1">
                          <h3 className="font-serif font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                            {person.name.split(' ')[0]}
                          </h3>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            {getRelationshipLabel(person)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default FamilyTree;