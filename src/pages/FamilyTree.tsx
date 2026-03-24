"use client";

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  UserCircle,
  Heart,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Maximize
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import dagre from 'dagre';
import AddPersonDialog from '../components/AddPersonDialog';
import SmartSuggestionHover from '../components/SmartSuggestionHover';
import TreeSmartInbox from '../components/TreeSmartInbox';

const BRANCH_COLORS = [
  '#d97706', // Amber
  '#2563eb', // Blue
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#ea580c', // Orange
  '#0891b2', // Cyan
];

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, relationships, loading, refreshData } = useFamily();
  const [zoom, setZoom] = useState(0.8);

  const treeData = useMemo(() => {
    if (loading || people.length === 0) return null;

    try {
      const g = new dagre.graphlib.Graph();
      g.setGraph({ 
        rankdir: 'TB', 
        nodesep: 200, 
        ranksep: 250, 
        marginx: 100, 
        marginy: 100,
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
          width: 240, 
          height: 100, 
          person: { ...p, displayYear: displayYear || 'Year Unknown' } 
        });
      });

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

      const processedLinks = new Set<string>();
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
          const linkKey = `${parentId}-${childId}`;
          if (processedLinks.has(linkKey)) return;
          processedLinks.add(linkKey);

          const union = Object.values(unions).find(u => u.p1 === parentId || u.p2 === parentId);
          if (union) {
            if (!union.children.includes(childId)) union.children.push(childId);
          } else {
            g.setEdge(parentId, childId, { type: 'lineage', color: '#e7e5e4' });
          }
        }
      });

      Object.values(unions).forEach(u => {
        g.setNode(u.id, { width: 40, height: 40, isUnion: true, color: u.color });
        g.setEdge(u.p1, u.id, { type: 'marriage', color: u.color });
        g.setEdge(u.p2, u.id, { type: 'marriage', color: u.color });
        
        u.children.forEach((childId, idx) => {
          g.setEdge(u.id, childId, { type: 'lineage', color: u.color, index: idx });
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
        height: maxY - minY + 300,
        offsetX: -minX + 150,
        offsetY: -minY + 150
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
      <header className="bg-white/80 backdrop-blur-md border-b-4 border-stone-100 px-6 py-6 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-800">Family Tree</h1>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Visual Archive</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <TreeSmartInbox />
            <AddPersonDialog 
              trigger={
                <Button variant="outline" className="hidden md:flex rounded-full border-stone-200 text-stone-600 gap-2 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all">
                  <UserPlus className="w-4 h-4" /> Add to Family
                </Button>
              }
            />
            <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-full">
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="h-8 w-8 rounded-full"><ZoomOut className="w-4 h-4" /></Button>
              <span className="text-[10px] font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-full"><ZoomIn className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setZoom(0.8)} className="h-8 w-8 rounded-full" title="Reset Zoom"><Maximize className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-auto p-10 cursor-grab active:cursor-grabbing bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px]">
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
            className="absolute inset-0 pointer-events-none overflow-visible"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {data.edges.map((edge, i) => {
              if (!edge.from || !edge.to) return null;

              const isMarriage = edge.type === 'marriage';
              
              const startX = edge.from.x;
              const startY = edge.from.y + (edge.from.isUnion ? 0 : 50); 
              const endX = edge.to.x;
              const endY = edge.to.y - (edge.to.isUnion ? 20 : 50); 

              // Cubic Bezier curve for a smooth, luminous flow
              const midY = startY + (endY - startY) * 0.5;
              const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
              
              return (
                <g key={i}>
                  {/* Thick white background for contrast */}
                  <path
                    d={path}
                    stroke="white"
                    strokeWidth={isMarriage ? "8" : "6"}
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                  {/* The glowing colored path */}
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    d={path}
                    stroke={edge.color}
                    strokeWidth={isMarriage ? "4" : "3"}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'url(#glow)' }}
                  />
                </g>
              );
            })}
          </svg>

          {data.nodes.map((node: any) => {
            if (node.isUnion) {
              return (
                <div 
                  key={node.id}
                  style={{ 
                    left: node.x - 20, 
                    top: node.y - 20,
                    backgroundColor: 'white',
                    borderColor: node.color
                  }}
                  className="absolute w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-md z-10"
                >
                  <Heart className="w-5 h-5 fill-current" style={{ color: node.color }} />
                </div>
              );
            }

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  left: node.x - 120, 
                  top: node.y - 50,
                  width: 240,
                  height: 100
                }}
                onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                className="absolute bg-white rounded-2xl border-2 border-stone-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all p-4 flex items-center gap-4 cursor-pointer group z-20"
              >
                <SmartSuggestionHover personId={node.id} />
                
                <div className="h-14 w-14 rounded-full overflow-hidden bg-stone-50 shrink-0 border border-stone-100 shadow-inner">
                  {node.person.photoUrl ? (
                    <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200">
                      <UserCircle className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-stone-800 truncate">{node.person.name}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest truncate">
                    {node.person.displayYear}
                  </p>
                  {!node.person.isLiving && (
                    <div className="flex items-center gap-1 mt-1">
                      <Heart className="w-3 h-3 text-red-200 fill-current" />
                      <span className="text-[8px] text-stone-300 uppercase font-bold">In Memory</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-stone-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Lineage</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-3 h-3 text-red-400 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Marriage Branch</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;