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
  Heart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import dagre from 'dagre';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, relationships, loading } = useFamily();
  const [zoom, setZoom] = useState(0.8);

  const treeData = useMemo(() => {
    if (loading || people.length === 0) return null;

    const g = new dagre.graphlib.Graph();
    // TB = Top to Bottom. 
    // ranksep: distance between levels. nodesep: distance between nodes on same level.
    g.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150, marginx: 50, marginy: 50 });
    g.setDefaultEdgeLabel(() => ({}));

    people.forEach(p => {
      let displayYear = p.birthYear;
      if (!displayYear && p.birthDate) {
        const match = p.birthDate.match(/\d{4}/);
        if (match) displayYear = match[0];
      }

      g.setNode(p.id, { 
        label: p.name, 
        width: 240, 
        height: 120, 
        person: { ...p, displayYear: displayYear || 'Year Unknown' } 
      });
    });

    relationships.forEach(r => {
      const type = r.relationship_type.toLowerCase();
      
      // Parental links (The backbone of the tree)
      if (['mother', 'father', 'parent'].includes(type)) {
        g.setEdge(r.person_id, r.related_person_id, { type: 'parental' });
      } else if (['son', 'daughter', 'child'].includes(type)) {
        g.setEdge(r.related_person_id, r.person_id, { type: 'parental' });
      } 
      // Horizontal links (Spouses and Siblings)
      // We set minlen: 0 to tell Dagre these nodes should be on the same rank (level)
      else if (['spouse', 'wife', 'husband'].includes(type)) {
        g.setEdge(r.person_id, r.related_person_id, { type: 'spouse', minlen: 0, weight: 1 });
      } else if (['brother', 'sister', 'sibling'].includes(type)) {
        g.setEdge(r.person_id, r.related_person_id, { type: 'sibling', minlen: 0, weight: 1 });
      }
      // Extended links
      else {
        g.setEdge(r.person_id, r.related_person_id, { type: 'extended', minlen: 0, weight: 0 });
      }
    });

    dagre.layout(g);
    
    return {
      nodes: g.nodes().map(v => ({ id: v, ...g.node(v) })),
      edges: g.edges().map(e => {
        const edgeData = g.edge(e);
        return { 
          from: g.node(e.v), 
          to: g.node(e.w),
          type: edgeData.type || 'parental'
        };
      })
    };
  }, [people, relationships, loading]);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the lineage...</div>;

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
          {treeData && (
            <>
              <svg className="absolute inset-0 pointer-events-none overflow-visible">
                {treeData.edges.map((edge, i) => {
                  const isSpouse = edge.type === 'spouse';
                  const isSibling = edge.type === 'sibling';
                  const isExtended = edge.type === 'extended';
                  
                  // Calculate connection points based on relative positions
                  const isHorizontal = Math.abs(edge.from.y - edge.to.y) < 10;
                  
                  let startX = edge.from.x;
                  let startY = edge.from.y + (isHorizontal ? 0 : 60);
                  let endX = edge.to.x;
                  let endY = edge.to.y - (isHorizontal ? 0 : 60);

                  if (isHorizontal) {
                    startX = edge.from.x + (edge.from.x < edge.to.x ? 120 : -120);
                    endX = edge.to.x + (edge.from.x < edge.to.x ? -120 : 120);
                    startY = edge.from.y;
                    endY = edge.to.y;
                  }
                  
                  return (
                    <path
                      key={i}
                      d={`M ${startX} ${startY} L ${endX} ${endY}`}
                      stroke={isSpouse ? '#f87171' : isSibling ? '#94a3b8' : isExtended ? '#cbd5e1' : '#e7e5e4'}
                      strokeWidth={isSpouse ? "3" : "2"}
                      strokeDasharray={isSibling || isExtended ? "5,5" : "0"}
                      fill="none"
                      className="transition-all duration-1000"
                    />
                  );
                })}
              </svg>

              {treeData.nodes.map((node: any) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ 
                    left: node.x - 120, 
                    top: node.y - 60,
                    width: 240,
                    height: 120
                  }}
                  onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                  className="absolute bg-white rounded-2xl border-2 border-stone-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all p-4 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-stone-50 shrink-0 border-2 border-white shadow-inner">
                    {node.person.photoUrl ? (
                      <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-200">
                        <UserCircle className="w-10 h-10" />
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
                        <Heart className="w-3 h-3 text-stone-200" />
                        <span className="text-[8px] text-stone-300 uppercase font-bold">In Memory</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </>
          )}
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
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Siblings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;