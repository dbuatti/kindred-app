"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  UserCircle, 
  Users2, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import QuickAddMenu from '../components/QuickAddMenu';
import { motion, AnimatePresence } from 'framer-motion';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();
  
  // State for Zoom/Pan
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  const me = useMemo(() => {
    return people.find(p => p.userId === user?.id) || people[0];
  }, [people, user]);

  // 1. Calculate Generational Levels
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
    return levels;
  }, [people, relationships]);

  const maxLevel = useMemo(() => Math.max(0, ...Object.values(personLevels)), [personLevels]);

  // 2. Search & Focus Logic
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setHighlightedId(null);
      return;
    }
    const found = people.find(p => p.name.toLowerCase().includes(query.toLowerCase()));
    if (found) {
      setHighlightedId(found.id);
      // Scroll to person logic could go here if needed
    }
  };

  // 3. Helper: Get all connected peers
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
    return cluster;
  };

  // 4. Recursive Component
  const ClusterNode = ({ members, level, parentProcessed = new Set() }: { members: any[], level: number, parentProcessed?: Set<string> }) => {
    const parentUnits = useMemo(() => {
      const units: { parents: any[], children: any[] }[] = [];
      const processedInCluster = new Set<string>();

      members.forEach(m => {
        if (processedInCluster.has(m.id)) return;

        const spouseRel = relationships.find(r => 
          (r.person_id === m.id || r.related_person_id === m.id) &&
          ['spouse', 'wife', 'husband'].includes(r.relationship_type.toLowerCase())
        );
        const spouse = spouseRel ? members.find(p => p.id === (spouseRel.person_id === m.id ? spouseRel.related_person_id : spouseRel.person_id)) : null;

        const unitParents = spouse ? [m, spouse] : [m];
        unitParents.forEach(p => processedInCluster.add(p.id));

        const childIds = new Set<string>();
        unitParents.forEach(p => {
          relationships.forEach(r => {
            const type = r.relationship_type.toLowerCase();
            if (['son', 'daughter', 'child'].includes(type) && r.person_id === p.id) childIds.add(r.related_person_id);
            if (['mother', 'father', 'parent'].includes(type) && r.related_person_id === p.id) childIds.add(r.person_id);
          });
        });

        if (childIds.size > 0) {
          units.push({ 
            parents: unitParents, 
            children: Array.from(childIds).map(id => people.find(p => p.id === id)).filter(Boolean) 
          });
        }
      });
      return units;
    }, [members]);

    return (
      <div className="flex flex-col items-center">
        <div className={cn(
          "flex items-center gap-4 p-6 rounded-[3.5rem] bg-white/60 backdrop-blur-sm border-2 border-stone-50 shadow-sm relative z-10 transition-all duration-500",
          members.some(m => m.id === highlightedId) ? "border-amber-400 bg-amber-50/50 shadow-amber-100 scale-105" : ""
        )}>
          {members.map((person, idx) => {
            const next = members[idx + 1];
            const rel = next ? relationships.find(r => (r.person_id === person.id && r.related_person_id === next.id) || (r.person_id === next.id && r.related_person_id === person.id)) : null;
            const linkType = rel?.relationship_type.toLowerCase();

            return (
              <React.Fragment key={person.id}>
                <div className="relative flex flex-col items-center">
                  {relationships.some(r => (r.person_id === person.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) || (r.related_person_id === person.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))) && (
                    <div className="absolute -top-10 w-px h-10 bg-stone-200" />
                  )}
                  <PersonAvatar person={person} isHighlighted={person.id === highlightedId} />
                </div>
                {linkType && (
                  <div className="flex flex-col items-center gap-1 px-2">
                    <div className="h-px w-8 bg-stone-200" />
                    <div className="bg-white p-1 rounded-full shadow-sm border border-stone-100">
                      {['spouse', 'wife', 'husband'].includes(linkType) ? <Heart className="w-3 h-3 text-red-400 fill-current" /> : <Users2 className="w-3 h-3 text-amber-400" />}
                    </div>
                    <div className="h-px w-8 bg-stone-200" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {parentUnits.length > 0 && (
          <div className="flex gap-16 mt-10 relative">
            {parentUnits.map((unit, uIdx) => {
              const childProcessed = new Set<string>();
              const childClusters: any[][] = [];
              unit.children.forEach(c => {
                if (!childProcessed.has(c.id) && !parentProcessed.has(c.id)) {
                  const cluster = getPeerCluster(c.id, level + 1, childProcessed);
                  childClusters.push(cluster);
                  cluster.forEach(p => parentProcessed.add(p.id));
                }
              });

              if (childClusters.length === 0) return null;

              return (
                <div key={uIdx} className="flex flex-col items-center">
                  <div className="w-px h-10 bg-stone-200" />
                  <div className="flex gap-12">
                    {childClusters.map((cc, ccIdx) => (
                      <ClusterNode key={ccIdx} members={cc} level={level + 1} parentProcessed={parentProcessed} />
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

  const PersonAvatar = ({ person, isHighlighted }: { person: any, isHighlighted?: boolean }) => {
    const label = !me || person.id === me.id ? "You" : (relationships.find(r => (r.person_id === me.id && r.related_person_id === person.id) || (r.person_id === person.id && r.related_person_id === me.id))?.relationship_type || "Family");
    
    return (
      <div onClick={() => navigate(getPersonUrl(person.id, person.name))} className="flex flex-col items-center space-y-3 cursor-pointer group">
        <QuickAddMenu personId={person.id} personName={person.name} />
        <div className={cn(
          "h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-4 shadow-lg ring-1 transition-all duration-500",
          isHighlighted ? "border-amber-500 ring-amber-200 scale-110" : "border-white ring-stone-100 group-hover:ring-amber-400"
        )}>
          {person.photoUrl ? (
            <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
              <UserCircle className="w-10 h-10" />
            </div>
          )}
        </div>
        <div className="text-center space-y-0.5">
          <h3 className={cn(
            "font-serif font-bold text-xs md:text-sm transition-colors",
            isHighlighted ? "text-amber-700" : "text-stone-800"
          )}>
            {person.name.split(' ')[0]}
          </h3>
          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
        </div>
      </div>
    );
  };

  const rootClusters = useMemo(() => {
    const processed = new Set<string>();
    const clusters: any[][] = [];
    
    const roots = people.filter(p => {
      const hasParent = relationships.some(r => 
        (r.person_id === p.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) ||
        (r.related_person_id === p.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))
      );
      return !hasParent;
    });

    roots.forEach(r => {
      if (!processed.has(r.id)) {
        clusters.push(getPeerCluster(r.id, personLevels[r.id], processed));
      }
    });

    people.forEach(p => {
      if (!processed.has(p.id)) {
        clusters.push(getPeerCluster(p.id, personLevels[p.id], processed));
      }
    });

    return clusters;
  }, [people, personLevels, relationships]);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  const getLevelLabel = (level: number) => {
    if (level === 0) return "Elders";
    if (level === 1) return "Parents";
    if (level === 2) return "Children";
    return `Generation ${level + 1}`;
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col overflow-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800">Family Tree</h1>
              <p className="text-stone-400 text-sm uppercase tracking-widest font-medium">Our Living History</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input 
                placeholder="Find a relative..." 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-12 bg-stone-50 border-none rounded-xl text-sm"
              />
              {searchQuery && (
                <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button variant="outline" className="rounded-full border-stone-200 text-stone-600 gap-2 hidden md:flex">
              <Share2 className="w-4 h-4" /> Share Tree
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden bg-stone-50/30">
        {/* Generational Landmarks Sidebar */}
        <div className="absolute left-0 top-0 bottom-0 w-32 border-r border-stone-100/50 bg-white/20 backdrop-blur-sm z-20 hidden lg:flex flex-col items-center py-20 gap-48">
          {Array.from({ length: maxLevel + 1 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-px w-8 bg-stone-200" />
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] vertical-text">
                {getLevelLabel(i)}
              </span>
            </div>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-2">
          <Button 
            size="icon" 
            variant="secondary" 
            onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
            className="h-12 w-12 rounded-full bg-white shadow-lg border border-stone-100"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}
            className="h-12 w-12 rounded-full bg-white shadow-lg border border-stone-100"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            onClick={() => setZoom(1)}
            className="h-12 w-12 rounded-full bg-white shadow-lg border border-stone-100"
          >
            <Maximize className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Tree Area */}
        <div 
          className="w-full h-full overflow-auto p-20 cursor-grab active:cursor-grabbing"
          ref={treeRef}
        >
          <motion.div 
            animate={{ scale: zoom }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center gap-32 min-w-max origin-top"
          >
            {rootClusters.map((cluster, idx) => (
              <ClusterNode key={idx} members={cluster} level={personLevels[cluster[0].id]} />
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
};

export default FamilyTree;