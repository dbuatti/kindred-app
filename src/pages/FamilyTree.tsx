"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
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
  Sparkles,
  Target,
  Info,
  Map as MapIcon,
  MessageSquare,
  Calendar,
  MapPin,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import QuickAddMenu from '../components/QuickAddMenu';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();
  
  // State for Zoom/Pan
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  
  const treeRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const me = useMemo(() => {
    return people.find(p => p.userId === user?.id) || people[0];
  }, [people, user]);

  const selectedPerson = useMemo(() => 
    people.find(p => p.id === selectedPersonId), 
  [people, selectedPersonId]);

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

  // 2. Lineage Logic
  const lineageIds = useMemo(() => {
    if (!highlightedId) return new Set<string>();
    const ids = new Set<string>([highlightedId]);
    relationships.forEach(r => {
      if (r.person_id === highlightedId) ids.add(r.related_person_id);
      if (r.related_person_id === highlightedId) ids.add(r.person_id);
    });
    return ids;
  }, [highlightedId, relationships]);

  // 3. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.1, 2));
      if (e.key === '-' || e.key === '_') setZoom(z => Math.max(z - 0.1, 0.5));
      if (e.key === '0') setZoom(1);
      if (e.key === 'm') setShowMinimap(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 4. Helper: Get all connected peers
  const getPeerCluster = useCallback((startId: string, level: number, processed: Set<string>) => {
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
  }, [people, relationships, personLevels]);

  // 5. Recursive Component
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

    const isClusterHighlighted = members.some(m => lineageIds.has(m.id));

    return (
      <div className="flex flex-col items-center">
        {/* The Unit (Person or Couple) */}
        <div className={cn(
          "flex items-center gap-4 p-6 rounded-[3.5rem] bg-white/60 backdrop-blur-sm border-2 border-stone-50 shadow-sm relative z-10 transition-all duration-700",
          isClusterHighlighted ? "border-amber-400 bg-amber-50/50 shadow-amber-100" : "",
          highlightedId && !isClusterHighlighted ? "opacity-40 grayscale-[0.5]" : ""
        )}>
          {members.map((person, idx) => {
            const next = members[idx + 1];
            const rel = next ? relationships.find(r => (r.person_id === person.id && r.related_person_id === next.id) || (r.person_id === next.id && r.related_person_id === person.id)) : null;
            const linkType = rel?.relationship_type.toLowerCase();

            return (
              <React.Fragment key={person.id}>
                <div className="relative flex flex-col items-center">
                  {/* Vertical line up to parents */}
                  {relationships.some(r => (r.person_id === person.id && ['mother', 'father', 'parent'].includes(r.relationship_type.toLowerCase())) || (r.related_person_id === person.id && ['son', 'daughter', 'child'].includes(r.relationship_type.toLowerCase()))) && (
                    <div className={cn(
                      "absolute -top-10 w-px h-10 transition-colors duration-500",
                      lineageIds.has(person.id) ? "bg-amber-400 w-0.5" : "bg-stone-200"
                    )} />
                  )}
                  <PersonAvatar 
                    person={person} 
                    isHighlighted={person.id === highlightedId} 
                    isInLineage={lineageIds.has(person.id)}
                    isSelected={person.id === selectedPersonId}
                  />
                </div>
                {linkType && (
                  <div className="flex flex-col items-center gap-1 px-2">
                    <div className={cn("h-px w-8 transition-colors", lineageIds.has(person.id) && lineageIds.has(next.id) ? "bg-amber-400 h-0.5" : "bg-stone-200")} />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "bg-white p-1 rounded-full shadow-sm border transition-all",
                            lineageIds.has(person.id) && lineageIds.has(next.id) ? "border-amber-400 scale-110" : "border-stone-100"
                          )}>
                            {['spouse', 'wife', 'husband'].includes(linkType) ? <Heart className="w-3 h-3 text-red-400 fill-current" /> : <Users2 className="w-3 h-3 text-amber-400" />}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-stone-800 text-white border-none rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          {linkType}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className={cn("h-px w-8 transition-colors", lineageIds.has(person.id) && lineageIds.has(next.id) ? "bg-amber-400 h-0.5" : "bg-stone-200")} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Children Branches */}
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

              const isUnitInLineage = unit.parents.some(p => lineageIds.has(p.id));

              return (
                <div key={uIdx} className="flex flex-col items-center relative">
                  {/* Vertical line down from parents */}
                  <div className={cn(
                    "w-px h-10 transition-colors duration-500",
                    isUnitInLineage ? "bg-amber-400 w-0.5" : "bg-stone-200"
                  )} />
                  
                  {/* Horizontal bar connecting siblings */}
                  {childClusters.length > 1 && (
                    <div className={cn(
                      "absolute top-10 h-px bg-stone-200 transition-colors",
                      isUnitInLineage ? "bg-amber-400 h-0.5" : "bg-stone-200"
                    )} style={{ 
                      width: 'calc(100% - 64px)',
                      left: '32px'
                    }} />
                  )}

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

  const PersonAvatar = ({ person, isHighlighted, isInLineage, isSelected }: { person: any, isHighlighted?: boolean, isInLineage?: boolean, isSelected?: boolean }) => {
    const label = !me || person.id === me.id ? "You" : (relationships.find(r => (r.person_id === me.id && r.related_person_id === person.id) || (r.person_id === person.id && r.related_person_id === me.id))?.relationship_type || "Family");
    
    return (
      <div 
        onClick={(e) => {
          e.stopPropagation();
          setHighlightedId(person.id);
          setSelectedPersonId(person.id);
        }} 
        className="flex flex-col items-center space-y-3 cursor-pointer group"
      >
        <QuickAddMenu personId={person.id} personName={person.name} />
        <div className={cn(
          "h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden border-4 shadow-lg ring-1 transition-all duration-500 relative",
          isSelected ? "border-amber-600 ring-amber-300 scale-110 z-20 shadow-amber-200" :
          isHighlighted ? "border-amber-500 ring-amber-200 scale-105 z-20" : 
          isInLineage ? "border-amber-200 ring-amber-50 shadow-amber-100" :
          "border-white ring-stone-100 group-hover:ring-amber-400"
        )}>
          {person.photoUrl ? (
            <img src={person.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
              <UserCircle className="w-10 h-10" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <Info className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="text-center space-y-0.5">
          <h3 className={cn(
            "font-serif font-bold text-xs md:text-sm transition-colors",
            isSelected ? "text-amber-800" : isHighlighted ? "text-amber-700" : "text-stone-800"
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
  }, [people, personLevels, relationships, getPeerCluster]);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  const getLevelLabel = (level: number) => {
    if (level === 0) return "Elders";
    if (level === 1) return "Parents";
    if (level === 2) return "Children";
    return `Generation ${level + 1}`;
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col overflow-hidden select-none">
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const found = people.find(p => p.name.toLowerCase().includes(e.target.value.toLowerCase()));
                  if (found) setHighlightedId(found.id);
                }}
                className="pl-10 h-12 bg-stone-50 border-none rounded-xl text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
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

      <div className="flex-1 relative overflow-hidden bg-stone-50/30" ref={constraintsRef}>
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

        {/* Zoom & Pan Controls */}
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
            onClick={() => { setZoom(1); setHighlightedId(null); }}
            className="h-12 w-12 rounded-full bg-white shadow-lg border border-stone-100"
          >
            <Maximize className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            onClick={() => {
              if (me) {
                setHighlightedId(me.id);
                setSelectedPersonId(me.id);
                setZoom(1);
              }
            }}
            className="h-12 w-12 rounded-full bg-amber-600 text-white shadow-lg border-2 border-white hover:bg-amber-700"
            title="Center on Me"
          >
            <Target className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            onClick={() => setShowMinimap(!showMinimap)}
            className={cn(
              "h-12 w-12 rounded-full shadow-lg border-2 border-white transition-colors",
              showMinimap ? "bg-stone-800 text-white" : "bg-white text-stone-800"
            )}
            title="Toggle Mini-map"
          >
            <MapIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Mini-map Overlay */}
        <AnimatePresence>
          {showMinimap && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-8 right-8 w-48 h-48 bg-white/80 backdrop-blur-md border-2 border-stone-100 rounded-3xl shadow-2xl z-30 overflow-hidden p-4 pointer-events-none"
            >
              <div className="w-full h-full relative opacity-40">
                {/* Simplified representation of the tree */}
                <div className="flex flex-col items-center gap-4 scale-[0.15] origin-top">
                  {rootClusters.map((cluster, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-8">
                      <div className="flex gap-4">
                        {cluster.map(p => <div key={p.id} className="h-10 w-10 rounded-full bg-stone-400" />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 border-2 border-amber-500/30 rounded-3xl" />
              <div className="absolute top-2 left-2 text-[8px] font-bold text-stone-400 uppercase tracking-widest">Mini-map</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick-View Side Panel */}
        <AnimatePresence>
          {selectedPerson && (
            <motion.div 
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="absolute top-0 right-0 bottom-0 w-80 md:w-96 bg-white shadow-2xl z-50 border-l border-stone-100 overflow-y-auto custom-scrollbar"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedPersonId(null)} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate(getPersonUrl(selectedPerson.id, selectedPerson.name))}
                    className="text-amber-600 hover:bg-amber-50 rounded-full gap-2"
                  >
                    Full Profile <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-stone-50 shadow-xl">
                    {selectedPerson.photoUrl ? (
                      <img src={selectedPerson.photoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                        <UserCircle className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-serif font-bold text-stone-800">{selectedPerson.name}</h2>
                    <p className="text-stone-400 text-xs uppercase tracking-widest font-bold">
                      {personLevels[selectedPerson.id] === 0 ? "Elder" : `Generation ${personLevels[selectedPerson.id] + 1}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-stone-600">
                  {selectedPerson.birthYear && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-amber-600" />
                      <span>Born {selectedPerson.birthYear}</span>
                    </div>
                  )}
                  {selectedPerson.birthPlace && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-amber-600" />
                      <span>{selectedPerson.birthPlace}</span>
                    </div>
                  )}
                  {selectedPerson.occupation && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-amber-600" />
                      <span>{selectedPerson.occupation}</span>
                    </div>
                  )}
                </div>

                {selectedPerson.vibeSentence && (
                  <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                    <p className="text-stone-700 font-serif italic leading-relaxed">
                      "{selectedPerson.vibeSentence}"
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Recent Stories
                  </h3>
                  <div className="space-y-3">
                    {selectedPerson.memories.slice(0, 3).map(m => (
                      <div key={m.id} className="p-4 bg-white border border-stone-100 rounded-2xl shadow-sm">
                        <p className="text-sm text-stone-600 italic line-clamp-3">"{m.content}"</p>
                        <p className="text-[10px] text-stone-400 mt-2 uppercase tracking-widest">Shared by {m.authorName}</p>
                      </div>
                    ))}
                    {selectedPerson.memories.length === 0 && (
                      <p className="text-stone-400 text-sm italic text-center py-4">No stories shared yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tree Area with Drag-to-Pan */}
        <div 
          className="w-full h-full overflow-hidden p-20 cursor-grab active:cursor-grabbing"
          onClick={() => {
            setHighlightedId(null);
            setSelectedPersonId(null);
          }}
        >
          <motion.div 
            drag
            dragConstraints={constraintsRef}
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e7e5e4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d6d3d1;
        }
      `}</style>
    </div>
  );
};

export default FamilyTree;