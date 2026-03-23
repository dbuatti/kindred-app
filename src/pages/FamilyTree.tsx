"use client";

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart, UserCircle, Users2 } from 'lucide-react';
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

  // 1. Calculate Generational Levels (Multi-pass for stability)
  const personLevels = useMemo(() => {
    if (!people.length) return {};
    const levels: Record<string, number> = {};
    people.forEach(p => levels[p.id] = 0);

    for (let i = 0; i < 50; i++) {
      let changed = false;
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const p1 = r.person_id;
        const p2 = r.related_person_id;

        if (['mother', 'father', 'parent'].includes(type)) {
          if (levels[p1] !== levels[p2] + 1) {
            levels[p1] = levels[p2] + 1;
            changed = true;
          }
        } else if (['son', 'daughter', 'child'].includes(type)) {
          if (levels[p2] !== levels[p1] + 1) {
            levels[p2] = levels[p1] + 1;
            changed = true;
          }
        } else if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
          if (levels[p1] !== levels[p2]) {
            const max = Math.max(levels[p1], levels[p2]);
            levels[p1] = max;
            levels[p2] = max;
            changed = true;
          }
        }
      });
      if (!changed) break;
    }

    const min = Math.min(...Object.values(levels));
    const normalized: Record<string, number> = {};
    Object.keys(levels).forEach(id => normalized[id] = levels[id] - min);
    return normalized;
  }, [people, relationships]);

  // 2. Helper: Get all connected peers (spouses/siblings) on the same level
  const getPeerCluster = (startId: string, level: number, processed: Set<string>) => {
    const cluster: any[] = [];
    const queue = [startId];
    const clusterIds = new Set([startId]);

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const person = people.find(p => p.id === currId);
      if (person) cluster.push(person);
      processed.add(currId);

      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(type)) {
          const otherId = r.person_id === currId ? r.related_person_id : r.person_id;
          if (personLevels[otherId] === level && !clusterIds.has(otherId)) {
            clusterIds.add(otherId);
            queue.push(otherId);
          }
        }
      });
    }

    // Sort cluster members by their connections to keep them adjacent
    return sortClusterChain(cluster);
  };

  const sortClusterChain = (cluster: any[]) => {
    if (cluster.length <= 1) return cluster;
    const sorted: any[] = [];
    const remaining = new Set(cluster.map(p => p.id));
    
    let currentId = cluster.find(p => {
      const peers = relationships.filter(r => 
        (r.person_id === p.id || r.related_person_id === p.id) &&
        ['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()) &&
        cluster.some(cp => cp.id === (r.person_id === p.id ? r.related_person_id : r.person_id))
      );
      return peers.length === 1;
    })?.id || cluster[0].id;

    while (currentId && remaining.size > 0) {
      const p = cluster.find(p => p.id === currentId);
      if (p) { sorted.push(p); remaining.delete(currentId); }
      const next = relationships.find(r => {
        const otherId = r.person_id === currentId ? r.related_person_id : r.person_id;
        return (r.person_id === currentId || r.related_person_id === currentId) &&
               ['spouse', 'wife', 'husband', 'brother', 'sister', 'sibling'].includes(r.relationship_type.toLowerCase()) &&
               remaining.has(otherId);
      });
      currentId = next ? (next.person_id === currentId ? next.related_person_id : next.person_id) : Array.from(remaining)[0];
    }
    return sorted;
  };

  // 3. Recursive Component to render a Cluster and its children
  const ClusterNode = ({ members, level }: { members: any[], level: number }) => {
    // Identify "Parent Units" in this cluster (couples or single parents with children)
    const parentUnits = useMemo(() => {
      const units: { parents: any[], children: any[] }[] = [];
      const processedInCluster = new Set<string>();

      members.forEach(m => {
        if (processedInCluster.has(m.id)) return;

        // Find spouse in this cluster
        const spouseRel = relationships.find(r => 
          (r.person_id === m.id || r.related_person_id === m.id) &&
          ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
        );
        const spouse = spouseRel ? members.find(p => p.id === (spouseRel.person_id === m.id ? spouseRel.related_person_id : spouseRel.person_id)) : null;

        const unitParents = spouse ? [m, spouse] : [m];
        unitParents.forEach(p => processedInCluster.add(p.id));

        // Find children of these parents
        const childIds = new Set<string>();
        unitParents.forEach(p => {
          relationships.forEach(r => {
            const type = r.relationship_type.toLowerCase();
            if (['son', 'daughter', 'child'].includes(type) && r.person_id === p.id) childIds.add(r.related_person_id);
            if (['mother', 'father', 'parent'].includes(type) && r.related_person_id === p.id) childIds.add(r.person_id);
          });
        });

        if (childIds.size > 0) {
          units.push({ parents: unitParents, children: Array.from(childIds).map(id => people.find(p => p.id === id)).filter(Boolean) });
        }
      });
      return units;
    }, [members]);

    return (
      <div className="flex flex-col items-center">
        {/* Render the Cluster Row */}
        <div className="flex items-center gap-4 p-8 rounded-[4rem] bg-white/40 border-2 border-stone-50 shadow-sm relative z-10">
          {members.map((person, idx) => {
            const next = members[idx + 1];
            const rel = next ? relationships.find(r => (r.person_id === person.id && r.related_person_id === next.id) || (r.person_id === next.id && r.related_person_id === person.id)) : null;
            const linkType = rel?.relationship_type.toLowerCase();

            return (
              <React.Fragment key={person.id}>
                <div className="relative flex flex-col items-center">
                  {/* Vertical line UP if has parent */}
                  {relationships.some(r => (r.person_id === person.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) || (r.related_person_id === person.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))) && (
                    <div className="absolute -top-12 w-px h-12 bg-stone-200" />
                  )}
                  <PersonAvatar person={person} />
                </div>
                {linkType && (
                  <div className="flex flex-col items-center gap-1 px-4">
                    <div className="h-px w-12 bg-stone-200" />
                    <div className="bg-white p-1.5 rounded-full shadow-sm border border-stone-100">
                      {['spouse', 'wife', 'husband'].includes(linkType) ? <Heart className="w-4 h-4 text-red-400 fill-current" /> : <Users2 className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="h-px w-12 bg-stone-200" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Render Children Clusters below their respective Parent Units */}
        {parentUnits.length > 0 && (
          <div className="flex gap-32 mt-12 relative">
            {/* Horizontal connector bar for multiple parent units */}
            {parentUnits.length > 1 && (
              <div className="absolute top-0 h-px bg-stone-200 left-1/4 right-1/4" />
            )}
            {parentUnits.map((unit, uIdx) => {
              // Group these children into their own peer clusters
              const childProcessed = new Set<string>();
              const childClusters: any[][] = [];
              unit.children.forEach(c => {
                if (!childProcessed.has(c.id)) {
                  childClusters.push(getPeerCluster(c.id, level + 1, childProcessed));
                }
              });

              return (
                <div key={uIdx} className="flex flex-col items-center">
                  <div className="w-px h-12 bg-stone-200" />
                  <div className="flex gap-12">
                    {childClusters.map((cc, ccIdx) => (
                      <ClusterNode key={ccIdx} members={cc} level={level + 1} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const PersonAvatar = ({ person }: { person: any }) => {
    const label = !me || person.id === me.id ? "You" : (relationships.find(r => (r.person_id === me.id && r.related_person_id === person.id) || (r.person_id === person.id && r.related_person_id === me.id))?.relationship_type || "Family");
    
    return (
      <div onClick={() => navigate(getPersonUrl(person.id, person.name))} className="flex flex-col items-center space-y-4 cursor-pointer group">
        <SmartSuggestionHover personId={person.id} />
        <QuickAddMenu personId={person.id} personName={person.name} />
        <div className="h-24 w-24 md:h-28 md:w-28 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-100 group-hover:ring-amber-400 transition-all duration-500">
          {person.photoUrl ? <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" /> : <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300"><UserCircle className="w-12 h-12" /></div>}
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-serif font-bold text-stone-800 text-sm md:text-base">{person.name.split(' ')[0]}</h3>
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
        </div>
      </div>
    );
  };

  // 4. Find Root Clusters (Level 0)
  const rootClusters = useMemo(() => {
    const processed = new Set<string>();
    const clusters: any[][] = [];
    const roots = people.filter(p => personLevels[p.id] === 0);
    roots.forEach(r => {
      if (!processed.has(r.id)) clusters.push(getPeerCluster(r.id, 0, processed));
    });
    return clusters;
  }, [people, personLevels]);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-32 overflow-x-auto">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-6 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500"><ArrowLeft className="w-6 h-6" /></Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800">Family Tree</h1>
              <p className="text-stone-400 text-sm uppercase tracking-widest font-medium">Our Living History</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 gap-2"><Share2 className="w-4 h-4" /> Share Tree</Button>
        </div>
      </header>

      <main className="p-24 min-w-max flex flex-col items-center gap-32">
        {rootClusters.map((cluster, idx) => (
          <ClusterNode key={idx} members={cluster} level={0} />
        ))}
      </main>
    </div>
  );
};

export default FamilyTree;