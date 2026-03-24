"use client";

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Users, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  UserCircle,
  Heart,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import dagre from 'dagre';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, relationships, loading } = useFamily();
  const [zoom, setZoom] = useState(1);

  const treeData = useMemo(() => {
    if (loading || people.length === 0) return null;

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });
    g.setDefaultEdgeLabel(() => ({}));

    people.forEach(p => {
      g.setNode(p.id, { label: p.name, width: 200, height: 100, person: p });
    });

    relationships.forEach(r => {
      const type = r.relationship_type.toLowerCase();
      if (['mother', 'father', 'parent'].includes(type)) {
        // Parent -> Child
        g.setEdge(r.related_person_id, r.person_id);
      } else if (['son', 'daughter', 'child'].includes(type)) {
        // Parent -> Child
        g.setEdge(r.person_id, r.related_person_id);
      }
    });

    dagre.layout(g);
    
    return {
      nodes: g.nodes().map(v => ({ id: v, ...g.node(v) })),
      edges: g.edges().map(e => ({ 
        from: g.node(e.v), 
        to: g.node(e.w),
        points: g.edge(e).points 
      }))
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
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Our Living History</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-full">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="h-8 w-8 rounded-full"><ZoomOut className="w-4 h-4" /></Button>
            <span className="text-[10px] font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-full"><ZoomIn className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-auto p-20 cursor-grab active:cursor-grabbing">
        <motion.div 
          style={{ scale: zoom, transformOrigin: 'center top' }}
          className="relative min-w-max min-h-max mx-auto"
        >
          {treeData && (
            <>
              {/* Render Edges */}
              <svg className="absolute inset-0 pointer-events-none overflow-visible">
                {treeData.edges.map((edge, i) => (
                  <path
                    key={i}
                    d={`M ${edge.from.x} ${edge.from.y + 50} L ${edge.to.x} ${edge.to.y - 50}`}
                    stroke="#e7e5e4"
                    strokeWidth="2"
                    fill="none"
                    className="transition-all duration-1000"
                  />
                ))}
              </svg>

              {/* Render Nodes */}
              {treeData.nodes.map((node: any) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ 
                    left: node.x - 100, 
                    top: node.y - 50,
                    width: 200,
                    height: 100
                  }}
                  onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                  className="absolute bg-white rounded-2xl border-2 border-stone-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all p-4 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-50 shrink-0 border-2 border-white shadow-inner">
                    {node.person.photoUrl ? (
                      <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-200">
                        <UserCircle className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{node.person.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest truncate">
                      {node.person.birthYear || 'Unknown'}
                    </p>
                    {!node.person.isLiving && (
                      <Heart className="w-3 h-3 text-stone-200 mt-1" />
                    )}
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </motion.div>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Living</span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-stone-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Ancestors</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;