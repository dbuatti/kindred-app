"use client";

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
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

const LINEAGE_COLOR = '#d6d3d1'; 
const PLACEHOLDER_URL = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=400";

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, relationships, loading, refreshData } = useFamily();
  const [zoom, setZoom] = useState(0.75);

  const treeData = useMemo(() => {
    if (loading || people.length === 0) return null;

    try {
      const g = new dagre.graphlib.Graph();
      g.setGraph({ 
        rankdir: 'TB', 
        nodesep: 80, 
        ranksep: 120,
        marginx: 100, 
        marginy: 100,
        ranker: 'network-simplex' // Produces more compact layouts
      });
      g.setDefaultEdgeLabel(() => ({}));

      const validIds = new Set(people.map(p => p.id));

      // 1. Add People Nodes
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

      // 2. Identify Unions
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

      // 3. Map Children
      relationships.forEach(r => {
        const type = r.relationship_type.toLowerCase();
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
          if (union) {
            if (!union.children.includes(childId)) union.children.push(childId);
          } else {
            g.setEdge(parentId, childId, { type: 'lineage', color: LINEAGE_COLOR, weight: 2 });
          }
        }
      });

      // 4. Add Union Nodes and Marriage Edges
      Object.values(unions).forEach(u => {
        g.setNode(u.id, { width: 40, height: 40, isUnion: true, color: u.color });
        // High weight keeps spouses on the same level and close to the union node
        g.setEdge(u.p1, u.id, { type: 'marriage', color: u.color, weight: 5 });
        g.setEdge(u.p2, u.id, { type: 'marriage', color: u.color, weight: 5 });
        
        u.children.forEach((childId) => {
          g.setEdge(u.id, childId, { type: 'lineage', color: u.color, weight: 3 });
        });
      });

      dagre.layout(g);
      
      const nodes = g.nodes().map(v => ({ id: v, ...g.node(v) }));
      const edges = g.edges().map(e => ({ 
        from: g.node(e.v), 
        to: g.node(e.w),
        ...g.edge(e)
      }));

      const minX = Math.min(...nodes.map(n => n.x - 150));
      const maxX = Math.max(...nodes.map(n => n.x + 150));
      const minY = Math.min(...nodes.map(n => n.y - 100));
      const maxY = Math.max(...nodes.map(n => n.y + 100));

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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500 hover:bg-stone-100">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">Family Tree</h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em]">Live Archive</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <TreeSmartInbox />
            <AddPersonDialog 
              trigger={
                <Button variant="outline" className="hidden md:flex rounded-full border-stone-200 text-stone-600 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all h-11 px-6">
                  <UserPlus className="w-4 h-4" /> Add to Family
                </Button>
              }
            />
            <div className="flex items-center gap-2 bg-stone-100/50 p-1.5 rounded-full border border-stone-200/50">
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="h-8 w-8 rounded-full hover:bg-white shadow-sm"><ZoomOut className="w-4 h-4" /></Button>
              <span className="text-[10px] font-bold w-12 text-center text-stone-600">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-full hover:bg-white shadow-sm"><ZoomIn className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setZoom(0.75)} className="h-8 w-8 rounded-full hover:bg-white shadow-sm" title="Reset Zoom"><Maximize className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-auto p-10 cursor-grab active:cursor-grabbing bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:60px_60px]">
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
              const startY = edge.from.y + (edge.from.isUnion ? 0 : 35); 
              const endX = edge.to.x;
              const endY = edge.to.y - (edge.to.isUnion ? 20 : 35); 

              // Orthogonal "Step" Path Logic
              let path = "";
              if (isMarriage) {
                // Spouses are usually side-by-side, use a simple curve
                const midY = startY + (endY - startY) * 0.5;
                path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
              } else {
                // Lineage uses a "Step" (Vertical -> Horizontal -> Vertical)
                const midY = startY + (endY - startY) * 0.5;
                path = `M ${startX} ${startY} 
                        L ${startX} ${midY} 
                        L ${endX} ${midY} 
                        L ${endX} ${endY}`;
              }
              
              return (
                <g key={i}>
                  <path
                    d={path}
                    stroke="white"
                    strokeWidth={isMarriage ? "8" : "6"}
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeInOut", delay: i * 0.01 }}
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
                  transition={{ type: 'spring', damping: 12, delay: 0.5 }}
                  style={{ 
                    left: node.x - 20, 
                    top: node.y - 20,
                    backgroundColor: 'white',
                    borderColor: node.color
                  }}
                  className="absolute w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg z-10 group"
                >
                  <Heart className="w-5 h-5 fill-current transition-transform group-hover:scale-125" style={{ color: node.color }} />
                </motion.div>
              );
            }

            const hasRealPhoto = node.person.photoUrl && node.person.photoUrl !== PLACEHOLDER_URL;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -5 }}
                style={{ 
                  left: node.x - 110, 
                  top: node.y - 35,
                  width: 220,
                  height: 70
                }}
                onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                className="absolute bg-white rounded-2xl border border-stone-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] hover:border-amber-200 transition-all p-2.5 flex items-center gap-3 cursor-pointer group z-20"
              >
                <SmartSuggestionHover personId={node.id} />
                
                <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-50 shrink-0 border-2 border-white shadow-sm ring-1 ring-stone-100 group-hover:ring-amber-200 transition-all">
                  {hasRealPhoto ? (
                    <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200">
                      <UserCircle className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-serif font-bold text-stone-800 truncate group-hover:text-amber-900 transition-colors">{node.person.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                      {node.person.displayYear}
                    </span>
                    {!node.person.isLiving && (
                      <Badge variant="secondary" className="bg-stone-100 text-stone-400 border-none text-[7px] px-1.5 py-0">
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
        <div className="bg-stone-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-8 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">Lineage</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-amber-400 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">Marriage Branch</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;