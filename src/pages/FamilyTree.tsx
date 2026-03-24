"use client";

import React, { useMemo, useState, useRef } from 'react';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import dagre from 'dagre';
import AddPersonDialog from '../components/AddPersonDialog';
import SmartSuggestionHover from '../components/SmartSuggestionHover';
import TreeSmartInbox from '../components/TreeSmartInbox';

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
  const { people, relationships, loading, refreshData } = useFamily();
  const [zoom, setZoom] = useState(0.75);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const treeData = useMemo(() => {
    if (loading || people.length === 0) return null;

    try {
      // Initialize Dagre with Compound support
      const g = new dagre.graphlib.Graph({ compound: true });
      g.setGraph({ 
        rankdir: 'TB', 
        nodesep: 180, // Wide horizontal gap between unrelated nodes
        ranksep: 220, // Deep vertical gap between generations
        marginx: 150, 
        marginy: 150,
        ranker: 'network-simplex'
      });
      g.setDefaultEdgeLabel(() => ({}));

      const validIds = new Set(people.map(p => p.id));

      // 1. Add Person Nodes
      people.forEach(p => {
        let displayYear = p.birthYear;
        if (!displayYear && p.birthDate) {
          const match = p.birthDate.match(/\d{4}/);
          if (match) displayYear = match[0];
        }

        g.setNode(p.id, { 
          width: 240, 
          height: 80, 
          person: { ...p, displayYear: displayYear || 'Year Unknown' } 
        });
      });

      // 2. Identify Unions (Spouses)
      const unions: Record<string, { id: string, p1: string, p2: string, children: string[], color: string }> = {};
      let colorIdx = 0;

      relationships.forEach(r => {
        if (r.relationship_type.toLowerCase() === 'spouse') {
          if (validIds.has(r.person_id) && validIds.has(r.related_person_id)) {
            const pairId = [r.person_id, r.related_person_id].sort().join('_');
            if (!unions[pairId]) {
              unions[pairId] = { 
                id: `union_${pairId}`, 
                p1: r.person_id, 
                p2: r.related_person_id, 
                children: [],
                color: BRANCH_COLORS[colorIdx % BRANCH_COLORS.length]
              };
              colorIdx++;
            }
          }
        }
      });

      // 3. Map Children to Unions
      const parentChildMap: Record<string, Set<string>> = {}; 
      
      relationships.forEach(r => {
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
          if (!parentChildMap[childId]) parentChildMap[childId] = new Set();
          parentChildMap[childId].add(parentId);
        }
      });

      // Assign children to the correct union and create Family Groups (Compound Nodes)
      Object.entries(parentChildMap).forEach(([childId, parentIds]) => {
        const parents = Array.from(parentIds);
        let assigned = false;

        if (parents.length >= 2) {
          for (const u of Object.values(unions)) {
            if (parentIds.has(u.p1) && parentIds.has(u.p2)) {
              if (!u.children.includes(childId)) u.children.push(childId);
              assigned = true;
              break;
            }
          }
        }

        if (!assigned) {
          for (const parentId of parents) {
            const u = Object.values(unions).find(u => u.p1 === parentId || u.p2 === parentId);
            if (u) {
              if (!u.children.includes(childId)) u.children.push(childId);
              assigned = true;
              break;
            }
          }
        }

        // Fallback for single parents or unmapped unions
        if (!assigned) {
          parents.forEach(parentId => {
            g.setEdge(parentId, childId, { type: 'lineage', color: LINEAGE_COLOR, weight: 10 });
          });
        }
      });

      // 4. Add Union Nodes and Marriage Edges with Compound Grouping
      Object.values(unions).forEach(u => {
        const familyGroupId = `group_${u.id}`;
        g.setNode(familyGroupId, { label: 'Family Group' }); // Compound node
        
        g.setNode(u.id, { width: 40, height: 40, isUnion: true, color: u.color });
        g.setParent(u.id, familyGroupId);
        g.setParent(u.p1, familyGroupId);
        g.setParent(u.p2, familyGroupId);

        // Marriage edges have massive weight to keep spouses together
        g.setEdge(u.p1, u.id, { type: 'marriage', color: u.color, weight: 10000 });
        g.setEdge(u.p2, u.id, { type: 'marriage', color: u.color, weight: 10000 });

        // Lineage edges have high weight to keep siblings grouped under the union
        u.children.forEach((childId, idx) => {
          g.setParent(childId, familyGroupId);
          g.setEdge(u.id, childId, { type: 'lineage', color: u.color, weight: 5000 });
          
          // Sibling grouping: add invisible edges between siblings to force them to stay contiguous
          if (idx > 0) {
            const prevChildId = u.children[idx - 1];
            g.setEdge(prevChildId, childId, { 
              type: 'sibling-spacer', 
              weight: 1000, 
              minlen: 1,
              style: { display: 'none' } 
            });
          }
        });
      });

      dagre.layout(g);
      
      const nodes = g.nodes()
        .filter(v => !v.startsWith('group_')) // Don't render the compound containers themselves
        .map(v => ({ id: v, ...g.node(v) }));
        
      const edges = g.edges().map(e => ({ 
        from: g.node(e.v), 
        to: g.node(e.w),
        ...g.edge(e)
      })).filter(e => e.from && e.to && e.type !== 'sibling-spacer');

      const minX = Math.min(...nodes.map(n => n.x - 120));
      const maxX = Math.max(...nodes.map(n => n.x + 120));
      const minY = Math.min(...nodes.map(n => n.y - 60));
      const maxY = Math.max(...nodes.map(n => n.y + 60));

      return {
        nodes,
        edges,
        width: maxX - minX + 300,
        height: maxY - minY + 200,
        offsetX: -minX + 150,
        offsetY: -minY + 100
      };
    } catch (err) {
      console.error("[FamilyTree] Layout error:", err);
      return { error: true };
    }
  }, [people, relationships, loading]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return people.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  }, [searchQuery, people]);

  const jumpToPerson = (id: string) => {
    const node = treeData?.nodes.find(n => n.id === id);
    if (node && treeContainerRef.current) {
      setHighlightedId(id);
      setZoom(1);
      
      const container = treeContainerRef.current;
      const scrollX = (node.x * 1) - (container.clientWidth / 2);
      const scrollY = (node.y * 1) - (container.clientHeight / 2);
      
      container.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: 'smooth'
      });

      setSearchQuery('');
      setTimeout(() => setHighlightedId(null), 3000);
    }
  };

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the lineage...</div>;

  if (!treeData || (treeData as any).error) {
    return (
      <div className="min-h-screen bg-[#FDFCF9] flex items-center justify-center p-10">
        <div className="max-w-md text-center space-y-6">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-serif text-stone-800">Tree Layout Error</h2>
          <p className="text-stone-500 leading-relaxed">
            We encountered a conflict in the family relationships. This usually happens if there are circular links.
          </p>
          <Button onClick={() => refreshData()} className="rounded-full bg-amber-600 hover:bg-amber-700 gap-2">
            <RefreshCw className="w-4 h-4" /> Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  const data = treeData as { nodes: any[], edges: any[], width: number, height: number, offsetX: number, offsetY: number };

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
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Live Archive</p>
              </div>
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
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Grow the tree</p>
            </div>

            <div className="flex items-center gap-2 bg-stone-100/50 p-1.5 rounded-full border border-stone-200/50">
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="h-8 w-8 rounded-full hover:bg-white shadow-sm"><ZoomOut className="w-4 h-4" /></Button>
              <span className="text-[10px] font-bold w-12 text-center text-stone-600">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-full hover:bg-white shadow-sm"><ZoomIn className="w-4 h-4" /></Button>
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
            width: data.width,
            height: data.height
          }}
          className="relative mx-auto"
        >
          <svg 
            width={data.width} 
            height={data.height} 
            className="absolute inset-0 pointer-events-none overflow-visible z-0"
          >
            {data.edges.map((edge, i) => {
              if (!edge.from || !edge.to) return null;
              const isMarriage = edge.type === 'marriage';
              const startX = edge.from.x;
              const startY = edge.from.y + (edge.from.isUnion ? 0 : 40); 
              const endX = edge.to.x;
              const endY = edge.to.y - (edge.to.isUnion ? 20 : 40); 
              const midY = startY + (endY - startY) * 0.5;
              const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
              
              return (
                <g key={i}>
                  <path d={path} stroke="white" strokeWidth={isMarriage ? "8" : "6"} fill="none" strokeLinecap="round" opacity="0.4" />
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeInOut", delay: i * 0.01 }}
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

          {data.nodes.map((node: any) => {
            if (node.isUnion) {
              return (
                <motion.div 
                  key={node.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.3 }}
                  style={{ left: node.x - 20, top: node.y - 20, backgroundColor: 'white', borderColor: node.color }}
                  className="absolute w-10 h-10 rounded-full border-4 flex items-center justify-center shadow-md z-10 group"
                >
                  <Heart className="w-5 h-5 fill-current transition-transform group-hover:scale-125" style={{ color: node.color }} />
                </motion.div>
              );
            }

            const isHighlighted = highlightedId === node.id;
            const isDeceased = node.person.isLiving === false;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -2 }}
                style={{ left: node.x - 120, top: node.y - 40, width: 240, height: 80 }}
                onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                className={cn(
                  "absolute bg-white rounded-2xl border transition-all p-3 flex items-center gap-3 cursor-pointer group z-20",
                  isHighlighted 
                    ? "ring-4 ring-amber-500 border-amber-500 shadow-2xl scale-110 z-50" 
                    : "border-stone-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] hover:border-amber-200",
                  isDeceased && "bg-stone-50/80"
                )}
              >
                <SmartSuggestionHover personId={node.id} />
                
                <div className={cn(
                  "h-14 w-14 rounded-full overflow-hidden bg-stone-50 shrink-0 border border-stone-100 group-hover:border-amber-200 transition-all",
                  isDeceased && "grayscale opacity-70"
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
                    isDeceased && "text-stone-500"
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
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-stone-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-stone-400" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-300">Lineage</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Heart className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-300">Marriage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;