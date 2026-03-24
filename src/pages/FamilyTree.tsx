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
  Focus,
  Ghost,
  Compass
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

const LINEAGE_COLOR = '#cbd5e1'; 

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, relationships, loading, refreshData, user } = useFamily();
  const [zoom, setZoom] = useState(0.75);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  
  // Navigator State
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const [viewRatio, setViewRatio] = useState({ w: 0.3, h: 0.3 });

  const handleScroll = useCallback(() => {
    if (treeContainerRef.current) {
      const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = treeContainerRef.current;
      setScrollPos({
        x: scrollLeft / (scrollWidth || 1),
        y: scrollTop / (scrollHeight || 1)
      });
      setViewRatio({
        w: clientWidth / (scrollWidth || 1),
        h: clientHeight / (scrollHeight || 1)
      });
    }
  }, []);

  useEffect(() => {
    const container = treeContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); 
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, loading, zoom]);

  const treeData = useMemo(() => {
    if (loading || people.length === 0) return null;

    try {
      const g = new dagre.graphlib.Graph({ compound: true });
      g.setGraph({ 
        rankdir: 'TB', 
        nodesep: 80, // More compact horizontal spacing
        ranksep: 100, // More compact vertical spacing
        marginx: 100, 
        marginy: 100,
        ranker: 'tight-tree' // Better for family hierarchies
      });
      g.setDefaultEdgeLabel(() => ({}));

      const validIds = new Set(people.map(p => p.id));

      people.forEach(p => {
        let displayYear = p.birthYear;
        if (!displayYear && p.birthDate) {
          const match = p.birthDate.match(/\d{4}/);
          if (match) displayYear = match[0];
        }

        g.setNode(p.id, { 
          width: 220, 
          height: 70, 
          person: { ...p, displayYear: displayYear || 'Year Unknown' } 
        });
      });

      const unions: Record<string, { id: string, p1: string, p2: string, children: string[], color: string }> = {};
      let colorIdx = 0;

      // 1. Identify Spouses/Unions
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const isSpouse = type.includes('spouse') || type.includes('wife') || type.includes('husband') || type.includes('married');
        
        if (isSpouse && validIds.has(r.person_id) && validIds.has(r.related_person_id)) {
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
      });

      // 2. Map Children to Unions or Parents
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        const isParental = type.includes('parent') || type.includes('father') || type.includes('mother') || type.includes('papa') || type.includes('mama');
        const isChild = type.includes('child') || type.includes('son') || type.includes('daughter');

        let parentId = '';
        let childId = '';

        if (isParental) {
          parentId = r.person_id;
          childId = r.related_person_id;
        } else if (isChild) {
          childId = r.person_id;
          parentId = r.related_person_id;
        }

        if (parentId && childId && validIds.has(parentId) && validIds.has(childId)) {
          if (parentId === childId) return;

          const union = Object.values(unions).find(u => u.p1 === parentId || u.p2 === parentId);
          if (union) {
            if (!union.children.includes(childId)) union.children.push(childId);
          } else {
            g.setEdge(parentId, childId, { type: 'lineage', color: LINEAGE_COLOR, weight: 1 });
          }
        }
      });

      // 3. Sibling Constraints
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
        if (type.includes('sister') || type.includes('brother') || type.includes('sibling')) {
          if (validIds.has(r.person_id) && validIds.has(r.related_person_id)) {
            if (r.person_id === r.related_person_id) return;
            g.setEdge(r.person_id, r.related_person_id, { type: 'sibling-constraint', weight: 0, minlen: 1 });
          }
        }
      });

      // 4. Finalize Union Nodes
      Object.values(unions).forEach(u => {
        g.setNode(u.id, { width: 40, height: 40, isUnion: true, color: u.color });
        g.setEdge(u.p1, u.id, { type: 'marriage', color: u.color, weight: 10, minlen: 1 });
        g.setEdge(u.p2, u.id, { type: 'marriage', color: u.color, weight: 10, minlen: 1 });
        u.children.forEach((childId) => {
          g.setEdge(u.id, childId, { type: 'lineage', color: u.color, weight: 5, minlen: 1 });
        });
      });

      dagre.layout(g);
      
      const nodes = g.nodes().map(v => ({ id: v, ...g.node(v) }));
      const edges = g.edges().map(e => ({ 
        from: g.node(e.v), 
        to: g.node(e.w),
        ...g.edge(e)
      }));

      const minX = Math.min(...nodes.map(n => n.x - 200));
      const maxX = Math.max(...nodes.map(n => n.x + 200));
      const minY = Math.min(...nodes.map(n => n.y - 200));
      const maxY = Math.max(...nodes.map(n => n.y + 200));

      return {
        nodes,
        edges,
        width: maxX - minX,
        height: maxY - minY,
        offsetX: -minX,
        offsetY: -minY
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

  const handleNavClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!treeContainerRef.current || !treeData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const container = treeContainerRef.current;
    container.scrollTo({
      left: x * container.scrollWidth - container.clientWidth / 2,
      top: y * container.scrollHeight - container.clientHeight / 2,
      behavior: 'smooth'
    });
  };

  const centerOnMe = () => {
    const myPerson = people.find(p => p.userId === user?.id);
    if (myPerson) jumpToPerson(myPerson.id);
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
            
            <Button 
              variant="outline" 
              onClick={centerOnMe}
              className="rounded-full border-stone-200 text-stone-600 gap-2 hover:bg-stone-50 hidden md:flex"
            >
              <Focus className="w-4 h-4" />
              Find Me
            </Button>

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
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="1" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.2" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {data.edges.map((edge, i) => {
              if (!edge.from || !edge.to || edge.type === 'sibling-constraint') return null;
              const isMarriage = edge.type === 'marriage';
              
              // Smooth Bezier Path Logic
              const startX = edge.from.x;
              const startY = edge.from.y + (edge.from.isUnion ? 0 : 35); 
              const endX = edge.to.x;
              const endY = edge.to.y - (edge.to.isUnion ? 20 : 35); 
              
              const midY = startY + (endY - startY) * 0.5;
              
              // Create a smooth "S" curve path
              const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
              
              return (
                <g key={i} filter="url(#shadow)">
                  <path d={path} stroke="white" strokeWidth={isMarriage ? "10" : "8"} fill="none" strokeLinecap="round" opacity="0.4" />
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut", delay: i * 0.01 }}
                    d={path}
                    stroke={edge.color || LINEAGE_COLOR}
                    strokeWidth={isMarriage ? "4" : "2.5"}
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
                  className="absolute w-10 h-10 rounded-full border-4 flex items-center justify-center shadow-xl z-10 group"
                >
                  <Heart className="w-5 h-5 fill-current transition-transform group-hover:scale-125" style={{ color: node.color }} />
                </motion.div>
              );
            }

            const isHighlighted = highlightedId === node.id;
            const isMe = node.person.userId === user?.id;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -2 }}
                style={{ left: node.x - 110, top: node.y - 35, width: 220, height: 70 }}
                onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                className={cn(
                  "absolute bg-white rounded-2xl border transition-all p-3 flex items-center gap-4 cursor-pointer group z-20",
                  isHighlighted 
                    ? "ring-4 ring-amber-500 border-amber-500 shadow-2xl scale-110 z-50" 
                    : isMe
                    ? "border-amber-200 shadow-lg bg-amber-50/40"
                    : "border-stone-100 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] hover:border-amber-200"
                )}
              >
                <SmartSuggestionHover personId={node.id} />
                
                <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-50 shrink-0 border-2 border-white shadow-sm group-hover:border-amber-200 transition-all">
                  {node.person.photoUrl ? (
                    <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200">
                      <UserCircle className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-serif font-bold text-stone-800 truncate group-hover:text-amber-900 transition-colors">
                    {node.person.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                      {node.person.displayYear}
                    </span>
                    {!node.person.isLiving && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 rounded-full">
                        <Ghost className="w-2.5 h-2.5 text-stone-400" />
                        <span className="text-[7px] font-bold text-stone-500 uppercase tracking-tighter">In Memory</span>
                      </div>
                    )}
                    {isMe && (
                      <Badge className="bg-amber-500 text-white border-none text-[7px] px-1.5 py-0 rounded-full">You</Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      {/* Mini-map Navigator */}
      <div className="fixed bottom-28 right-8 z-40 hidden md:block">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-[2rem] border-2 border-stone-100 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-stone-400">
            <Compass className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Navigator</span>
          </div>
          <div 
            onClick={handleNavClick}
            className="h-24 w-32 bg-stone-50 rounded-xl border border-stone-100 relative overflow-hidden cursor-crosshair"
          >
            <div 
              className="absolute bg-amber-500/20 border border-amber-500/40 rounded-sm transition-all duration-100"
              style={{
                width: `${Math.max(10, viewRatio.w * 100)}%`,
                height: `${Math.max(10, viewRatio.h * 100)}%`,
                left: `${scrollPos.x * 100}%`,
                top: `${scrollPos.y * 100}%`
              }}
            />
          </div>
        </div>
      </div>

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
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;