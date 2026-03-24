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
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import dagre from 'dagre';

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
        nodesep: 100, 
        ranksep: 120, 
        marginx: 50, 
        marginy: 50,
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
          height: 80, 
          person: { ...p, displayYear: displayYear || 'Year Unknown' } 
        });
      });

      // 2. Identify Unions (Spouse pairs)
      const unions: Record<string, { id: string, p1: string, p2: string, children: Set<string> }> = {};
      relationships.forEach(r => {
        if (r.relationship_type.toLowerCase() === 'spouse') {
          if (validIds.has(r.person_id) && validIds.has(r.related_person_id)) {
            const pairId = [r.person_id, r.related_person_id].sort().join('_');
            if (!unions[pairId]) {
              unions[pairId] = { 
                id: `union_${pairId}`, 
                p1: r.person_id, 
                p2: r.related_person_id, 
                children: new Set() 
              };
            }
          }
        }
      });

      // 3. Assign children to unions or direct parents
      const directParentLinks: { parentId: string, childId: string }[] = [];
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
          if (parentId === childId) return;
          const union = Object.values(unions).find(u => u.p1 === parentId || u.p2 === parentId);
          if (union) {
            union.children.add(childId);
          } else {
            directParentLinks.push({ parentId, childId });
          }
        }
      });

      // Cycle Detection Helper
      const lineageGraph: Record<string, string[]> = {};
      const addLineageEdge = (from: string, to: string) => {
        if (!lineageGraph[from]) lineageGraph[from] = [];
        lineageGraph[from].push(to);
      };

      const hasCycle = (startNode: string) => {
        const visited = new Set();
        const stack = new Set();
        const check = (node: string): boolean => {
          if (stack.has(node)) return true;
          if (visited.has(node)) return false;
          visited.add(node);
          stack.add(node);
          for (const neighbor of (lineageGraph[node] || [])) {
            if (check(neighbor)) return true;
          }
          stack.delete(node);
          return false;
        };
        return check(startNode);
      };

      // 4. Add Union Nodes and Edges to Graph (with cycle prevention)
      Object.values(unions).forEach(u => {
        // Check if adding this union's children creates a cycle
        const safeChildren = Array.from(u.children).filter(childId => {
          addLineageEdge(u.p1, childId);
          addLineageEdge(u.p2, childId);
          if (hasCycle(u.p1) || hasCycle(u.p2)) {
            // Remove the edges if they caused a cycle
            lineageGraph[u.p1].pop();
            lineageGraph[u.p2].pop();
            return false;
          }
          return true;
        });

        g.setNode(u.id, { width: 1, height: 1, isUnion: true });
        g.setEdge(u.p1, u.id, { type: 'marriage', weight: 10 });
        g.setEdge(u.p2, u.id, { type: 'marriage', weight: 10 });
        safeChildren.forEach(childId => {
          g.setEdge(u.id, childId, { type: 'lineage', weight: 1 });
        });
      });

      // 5. Add Direct Parent Links (with cycle prevention)
      directParentLinks.forEach(link => {
        const alreadyCovered = Object.values(unions).some(u => 
          (u.p1 === link.parentId || u.p2 === link.parentId) && u.children.has(link.childId)
        );
        if (!alreadyCovered) {
          addLineageEdge(link.parentId, link.childId);
          if (!hasCycle(link.parentId)) {
            g.setEdge(link.parentId, link.childId, { type: 'lineage', weight: 1 });
          } else {
            lineageGraph[link.parentId].pop();
          }
        }
      });

      dagre.layout(g);
      
      return {
        nodes: g.nodes().map(v => ({ id: v, ...g.node(v) })),
        edges: g.edges().map(e => ({ 
          from: g.node(e.v), 
          to: g.node(e.w),
          type: g.edge(e).type
        }))
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
            We encountered a conflict in the family relationships. This usually happens if there are circular links (e.g., someone marked as their own parent) or redundant connections.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => refreshData()} className="rounded-full bg-amber-600 hover:bg-amber-700 gap-2">
              <RefreshCw className="w-4 h-4" /> Retry Loading
            </Button>
            <Button onClick={() => navigate('/')} variant="ghost" className="rounded-full text-stone-400">Return Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const data = treeData as { nodes: any[], edges: any[] };

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
          <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-full">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="h-8 w-8 rounded-full"><ZoomOut className="w-4 h-4" /></Button>
            <span className="text-[10px] font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-full"><ZoomIn className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-auto p-20 cursor-grab active:cursor-grabbing bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px]">
        <motion.div 
          style={{ scale: zoom, transformOrigin: 'center top' }}
          className="relative min-w-max min-h-max mx-auto"
        >
          <svg className="absolute inset-0 pointer-events-none overflow-visible">
            {data.edges.map((edge, i) => {
              const isMarriage = edge.type === 'marriage';
              
              const startX = edge.from.x;
              const startY = edge.from.y;
              const endX = edge.to.x;
              const endY = edge.to.y;

              let path = "";

              if (isMarriage) {
                path = `M ${startX} ${startY} L ${endX} ${endY}`;
              } else {
                const midY = startY + (endY - startY) / 2;
                path = `M ${startX} ${startY} 
                        L ${startX} ${midY} 
                        L ${endX} ${midY} 
                        L ${endX} ${endY}`;
              }
              
              return (
                <motion.path
                  key={i}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  d={path}
                  stroke={isMarriage ? '#f87171' : '#e7e5e4'}
                  strokeWidth={isMarriage ? "3" : "2"}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
          </svg>

          {data.nodes.map((node: any) => {
            if (node.isUnion) return null;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ 
                  left: node.x - 110, 
                  top: node.y - 40,
                  width: 220,
                  height: 80
                }}
                onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                className="absolute bg-white rounded-xl border-2 border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all p-3 flex items-center gap-3 cursor-pointer group"
              >
                <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-50 shrink-0 border border-stone-100 shadow-inner">
                  {node.person.photoUrl ? (
                    <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-200">
                      <UserCircle className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-800 truncate">{node.person.name}</p>
                  <p className="text-[9px] text-stone-400 uppercase tracking-widest truncate">
                    {node.person.displayYear}
                  </p>
                  {!node.person.isLiving && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Heart className="w-2.5 h-2.5 text-red-200 fill-current" />
                      <span className="text-[7px] text-stone-300 uppercase font-bold">In Memory</span>
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
            <div className="h-2 w-2 rounded-full bg-stone-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Lineage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Marriage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;