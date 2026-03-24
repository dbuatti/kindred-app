"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  UserCircle,
  Heart,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Maximize,
  Search,
  X,
  Sparkles,
  Focus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import ELK from 'elkjs/lib/elk.bundled.js';
import AddPersonDialog from '../components/AddPersonDialog';
import SmartSuggestionHover from '../components/SmartSuggestionHover';
import TreeSmartInbox from '../components/TreeSmartInbox';

const elk = new ELK();

const BRANCH_COLORS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
];

const LINEAGE_COLOR = '#e2e8f0'; 

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, relationships, loading, user } = useFamily();
  const [zoom, setZoom] = useState(0.75);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const calculateLayout = useCallback(async () => {
    if (loading || people.length === 0) return;
    setIsCalculating(true);
    try {
      const validIds = new Set(people.map(p => p.id));
      
      const elkNodes: any[] = people.map(p => {
        let displayYear = p.birthYear;
        if (!displayYear && p.birthDate) {
          const match = p.birthDate.match(/\d{4}/);
          if (match) displayYear = match[0];
        }
        return {
          id: p.id,
          width: 240,
          height: 80,
          person: { ...p, displayYear: displayYear || 'Year Unknown' }
        };
      });

      const elkEdges: any[] = [];
      const unions: Record<string, { id: string, p1: string, p2: string, color: string }> = {};
      let colorIdx = 0;

      relationships.forEach(r => {
        if (r.relationship_type.toLowerCase() === 'spouse') {
          if (validIds.has(r.person_id) && validIds.has(r.related_person_id)) {
            const pairId = [r.person_id, r.related_person_id].sort().join('_');
            if (!unions[pairId]) {
              const unionId = `union_${pairId}`;
              unions[pairId] = { 
                id: unionId, 
                p1: r.person_id, 
                p2: r.related_person_id, 
                color: BRANCH_COLORS[colorIdx % BRANCH_COLORS.length]
              };
              elkNodes.push({ id: unionId, width: 40, height: 40, isUnion: true, color: unions[pairId].color });
              
              elkEdges.push({ id: `e_${unionId}_1`, sources: [r.person_id], targets: [unionId], type: 'marriage', color: unions[pairId].color });
              elkEdges.push({ id: `e_${unionId}_2`, sources: [r.related_person_id], targets: [unionId], type: 'marriage', color: unions[pairId].color });
              
              colorIdx++;
            }
          }
        }
      });

      relationships.forEach((r, idx) => {
        const type = r.relationship_type.toLowerCase();
        if (['cousin', 'aunt', 'uncle', 'nephew', 'niece'].includes(type)) return;

        let parentId = '';
        let childId = '';

        if (['mother', 'father', 'parent'].includes(type)) {
          parentId = r.person_id;
          childId = r.related_person_id;
        } else if (['son', 'daughter', 'child'].includes(type)) {
          childId = r.person_id;
          parentId = r.related_person_id;
        }

        if (parentId && childId && validIds.has(parentId) && validIds.has(childId)) {
          const union = Object.values(unions).find(u => u.p1 === parentId || u.p2 === parentId);
          const sourceId = union ? union.id : parentId;
          const edgeColor = union ? union.color : LINEAGE_COLOR;

          elkEdges.push({ 
            id: `rel_${idx}`, 
            sources: [sourceId], 
            targets: [childId], 
            type: 'lineage', 
            color: edgeColor 
          });
        }
      });

      const graph = {
        id: "root",
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'DOWN',
          'elk.spacing.nodeNode': '105', // Tuned for tighter grouping
          'elk.layered.spacing.nodeNodeBetweenLayers': '165', // Tuned for hierarchy clarity
          'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
          'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
          'elk.edgeRouting': 'ORTHOGONAL',
          'elk.layered.mergeEdges': 'true',
          'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
          'elk.layered.spacing.edgeEdgeBetweenLayers': '15',
          'elk.layered.spacing.edgeNodeBetweenLayers': '35',
          'elk.padding': '[top=150,left=150,bottom=150,right=150]'
        },
        children: elkNodes,
        edges: elkEdges
      };

      const layout = await elk.layout(graph);
      
      const nodes = layout.children || [];
      const edges = layout.edges || [];

      const minX = Math.min(...nodes.map(n => n.x || 0));
      const maxX = Math.max(...nodes.map(n => (n.x || 0) + (n.width || 0)));
      const minY = Math.min(...nodes.map(n => n.y || 0));
      const maxY = Math.max(...nodes.map(n => (n.y || 0) + (n.height || 0)));

      setLayoutData({
        nodes,
        edges,
        width: maxX - minX + 600,
        height: maxY - minY + 600,
        offsetX: -minX + 300,
        offsetY: -minY + 300
      });
    } catch (err) {
      console.error("[FamilyTree] Layout error:", err);
    } finally {
      setIsCalculating(false);
    }
  }, [people, relationships, loading]);

  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  const centerTree = useCallback(() => {
    if (layoutData && treeContainerRef.current) {
      const container = treeContainerRef.current;
      const scrollX = (layoutData.width * zoom) / 2 - container.clientWidth / 2;
      const scrollY = 100; 
      
      container.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: 'smooth'
      });
    }
  }, [layoutData, zoom]);

  useEffect(() => {
    if (layoutData) {
      const timer = setTimeout(centerTree, 500);
      return () => clearTimeout(timer);
    }
  }, [layoutData, centerTree]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return people.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  }, [searchQuery, people]);

  const jumpToPerson = (id: string) => {
    const node = layoutData?.nodes.find((n: any) => n.id === id);
    if (node && treeContainerRef.current) {
      setHighlightedId(id);
      setZoom(1);
      
      const container = treeContainerRef.current;
      const scrollX = ((node.x + layoutData.offsetX + node.width / 2) * 1) - (container.clientWidth / 2);
      const scrollY = ((node.y + layoutData.offsetY + node.height / 2) * 1) - (container.clientHeight / 2);
      
      container.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: 'smooth'
      });

      setSearchQuery('');
      setTimeout(() => setHighlightedId(null), 3000);
    }
  };

  const focusMe = () => {
    const myPerson = people.find(p => p.userId === user?.id);
    if (myPerson) jumpToPerson(myPerson.id);
  };

  const drawElkEdge = (edge: any) => {
    if (!edge.sections || edge.sections.length === 0) return "";
    const section = edge.sections[0];
    const ox = layoutData.offsetX;
    const oy = layoutData.offsetY;
    
    let path = `M ${section.startPoint.x + ox} ${section.startPoint.y + oy}`;
    
    if (section.bendPoints) {
      section.bendPoints.forEach((bp: any) => {
        path += ` L ${bp.x + ox} ${bp.y + oy}`;
      });
    }
    
    path += ` L ${section.endPoint.x + ox} ${section.endPoint.y + oy}`;
    return path;
  };

  if (loading || isCalculating) return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center gap-6">
      <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 animate-pulse">
        <Sparkles className="w-10 h-10" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-bold text-stone-800">Optimizing the Tree</h2>
        <p className="text-stone-400 italic">Refining layout for clarity...</p>
      </div>
    </div>
  );

  if (!layoutData) return null;

  return (
    <div className="min-h-screen bg-[#FDFCF9] overflow-hidden flex flex-col">
      <header className="bg-white/90 backdrop-blur-xl border-b-4 border-stone-100 px-6 py-6 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500 hover:bg-stone-100">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">Family Tree</h1>
            </div>
          </div>

          <div className="flex-1 max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
            <Input 
              placeholder="Find someone in the tree..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-stone-100 border-none rounded-full text-sm focus-visible:ring-amber-500/20"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            )}
            
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50"
                >
                  {searchResults.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => jumpToPerson(p.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50 transition-colors text-left border-b border-stone-50 last:border-none"
                    >
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-stone-100 shrink-0">
                        {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-stone-300" />}
                      </div>
                      <span className="font-medium text-stone-800">{p.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <TreeSmartInbox />
            
            <div className="hidden lg:flex flex-col items-center gap-1">
              <AddPersonDialog 
                trigger={
                  <Button className="rounded-full bg-stone-800 hover:bg-stone-900 text-white gap-2 h-11 px-6 shadow-md transition-all hover:scale-105">
                    <UserPlus className="w-4 h-4" /> Add to Family
                  </Button>
                }
              />
            </div>

            <div className="flex items-center gap-2 bg-stone-100/50 p-1.5 rounded-full border border-stone-200/50">
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="h-8 w-8 rounded-full hover:bg-white shadow-sm"><ZoomOut className="w-4 h-4" /></Button>
              <span className="text-[10px] font-bold w-12 text-center text-stone-600">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-full hover:bg-white shadow-sm"><ZoomIn className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={focusMe} className="h-8 w-8 rounded-full hover:bg-white shadow-sm" title="Find Me"><Focus className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setZoom(0.75)} className="h-8 w-8 rounded-full hover:bg-white shadow-sm" title="Reset Zoom"><Maximize className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main 
        ref={treeContainerRef}
        className="flex-1 relative overflow-auto p-10 cursor-grab active:cursor-grabbing bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:60px_60px]"
      >
        <motion.div 
          style={{ 
            scale: zoom, 
            transformOrigin: 'center top',
            width: layoutData.width,
            height: layoutData.height
          }}
          className="relative mx-auto"
        >
          <svg 
            width={layoutData.width} 
            height={layoutData.height} 
            className="absolute inset-0 pointer-events-none overflow-visible z-0"
          >
            {layoutData.edges.map((edge: any, i: number) => {
              const isMarriage = edge.type === 'marriage';
              const path = drawElkEdge(edge);
              
              return (
                <g key={edge.id}>
                  <path d={path} stroke="white" strokeWidth={isMarriage ? "8" : "6"} fill="none" strokeLinecap="round" opacity="0.4" />
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeInOut", delay: i * 0.005 }}
                    d={path}
                    stroke={edge.color || LINEAGE_COLOR}
                    strokeWidth={isMarriage ? "3" : "2"}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </svg>

          {layoutData.nodes.map((node: any) => {
            const x = node.x + layoutData.offsetX;
            const y = node.y + layoutData.offsetY;

            if (node.isUnion) {
              return (
                <motion.div 
                  key={node.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.3 }}
                  style={{ left: x, top: y, width: node.width, height: node.height, backgroundColor: 'white', borderColor: node.color }}
                  className="absolute rounded-full border-4 flex items-center justify-center shadow-md z-10 group"
                >
                  <Heart className="w-5 h-5 fill-current transition-transform group-hover:scale-125" style={{ color: node.color }} />
                </motion.div>
              );
            }

            const isHighlighted = highlightedId === node.id;
            const isDeceased = node.person.isLiving === false;
            const isMe = node.person.userId === user?.id;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -2 }}
                style={{ left: x, top: y, width: node.width, height: node.height }}
                onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                className={cn(
                  "absolute bg-white rounded-2xl border transition-all p-3 flex items-center gap-3 cursor-pointer group z-20",
                  isHighlighted 
                    ? "ring-4 ring-amber-500 border-amber-500 shadow-2xl scale-110 z-50" 
                    : isMe 
                      ? "border-amber-400 shadow-lg ring-2 ring-amber-50"
                      : "border-stone-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] hover:border-amber-200",
                  isDeceased && "bg-stone-50/80 border-stone-200"
                )}
              >
                <SmartSuggestionHover personId={node.id} />
                
                <div className={cn(
                  "h-14 w-14 rounded-full overflow-hidden bg-stone-100 shrink-0 border border-stone-100 group-hover:border-amber-200 transition-all",
                  isDeceased && "grayscale opacity-60 border-stone-200"
                )}>
                  {node.person.photoUrl ? (
                    <img src={node.person.photoUrl} className="w-full h-full object-cover transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200">
                      <UserCircle className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className={cn(
                    "text-sm font-serif font-bold text-stone-800 truncate group-hover:text-amber-900 transition-colors",
                    isDeceased && "text-stone-500 font-medium"
                  )}>
                    {node.person.name} {isDeceased && "†"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {node.person.displayYear}
                    </span>
                    {isDeceased && (
                      <Badge variant="secondary" className="bg-stone-200/50 text-stone-500 border-none text-[8px] px-1.5 py-0 font-bold uppercase tracking-tighter">
                        In Memory
                      </Badge>
                    )}
                    {isMe && (
                      <Badge className="bg-amber-500 text-white border-none text-[8px] px-1.5 py-0 font-bold uppercase tracking-tighter">
                        You
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-stone-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">Lineage</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-amber-400 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">Marriage</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full border-2 border-amber-500 bg-white" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">You</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;