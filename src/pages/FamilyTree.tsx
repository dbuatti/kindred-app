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

  const getRelationshipLabel = (person: any) => {
    if (person.id === me?.id) return "You";
    
    const rel = relationships.find(r => 
      (r.person_id === me?.id && r.related_person_id === person.id) ||
      (r.person_id === person.id && r.related_person_id === me?.id)
    );

    if (!rel) return person.birthYear || person.personalityTags?.[0] || "Relative";

    if (rel.person_id === me?.id) return rel.relationship_type;
    return getInverseRelationship(rel.relationship_type, person.gender);
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

        if (r.person_id === id) {
          neighborId = r.related_person_id;
          const type = r.relationship_type.toLowerCase();
          if (type === 'father' || type === 'mother' || type === 'parent') nextDepth = depth - 1;
          else if (type === 'son' || type === 'daughter' || type === 'child') nextDepth = depth + 1;
          else if (type === 'grandfather' || type === 'grandmother' || type === 'grandparent') nextDepth = depth - 2;
          else if (type === 'grandson' || type === 'granddaughter' || type === 'grandchild') nextDepth = depth + 2;
        } else if (r.related_person_id === id) {
          neighborId = r.person_id;
          const type = r.relationship_type.toLowerCase();
          if (type === 'father' || type === 'mother' || type === 'parent') nextDepth = depth + 1;
          else if (type === 'son' || type === 'daughter' || type === 'child') nextDepth = depth - 1;
          else if (type === 'grandfather' || type === 'grandmother' || type === 'grandparent') nextDepth = depth + 2;
          else if (type === 'grandson' || type === 'granddaughter' || type === 'grandchild') nextDepth = depth - 2;
        }

        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, depth: nextDepth });
        }
      });
    }

    const groups: Record<string, typeof people> = {
      "Ancestors": [],
      "Grandparents' Generation": [],
      "Parents' Generation": [],
      "Current Generation": [],
      "Next Generation": [],
      "Legacy & Unlinked": []
    };

    people.forEach(p => {
      const depth = depthMap[p.id];
      const year = parseInt(p.birthYear || '0');
      
      let gen = "Legacy & Unlinked";
      
      if (depth !== undefined) {
        if (depth <= -3) gen = "Ancestors";
        else if (depth === -2) gen = "Grandparents' Generation";
        else if (depth === -1) gen = "Parents' Generation";
        else if (depth === 0) gen = "Current Generation";
        else if (depth >= 1) gen = "Next Generation";
      } else if (year > 0) {
        if (year < 1920) gen = "Ancestors";
        else if (year < 1950) gen = "Grandparents' Generation";
        else if (year < 1980) gen = "Parents' Generation";
        else gen = "Current Generation";
      }

      groups[gen].push(p);
    });

    const order = [
      "Ancestors", 
      "Grandparents' Generation", 
      "Parents' Generation", 
      "Current Generation",
      "Next Generation",
      "Legacy & Unlinked"
    ];

    return order
      .map(name => [name, groups[name]])
      .filter(([_, members]) => (members as any).length > 0);
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

      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="relative space-y-24">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-200 -translate-x-1/2 hidden md:block" />

          {generations.map(([genName, members]: any, idx) => (
            <section key={genName} className="relative space-y-10">
              <div className="flex justify-center">
                <div className="bg-amber-50 text-amber-800 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-[0.3em] shadow-sm border border-amber-100 z-10">
                  {genName}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                {members.map((person: any) => (
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
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default FamilyTree;