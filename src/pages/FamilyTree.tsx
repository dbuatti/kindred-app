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
    // Increased separation for better clarity
    g.setGraph({ rankdir: 'TB', nodesep: 120, ranksep: 180 });
    g.setDefaultEdgeLabel(() => ({}));

    people.forEach(p => {
      // Extract year from birthDate if birthYear is missing
      let displayYear = p.birthYear;
      if (!displayYear && p.birthDate) {
        const match = p.birthDate.match(/\d{4}/);
        if (match) displayYear = match[0];
      }

      g.setNode(p.id, { 
        label: p.name, 
        width: 220, 
        height: 110, 
        person: { ...p, displayYear: displayYear || 'Unknown' } 
      });
    });

    relationships.forEach(r => {
      const type = r.relationship_type.toLowerCase();
      
      // Correcting the logic: 
      // In our DB, person_id is the NEW person added, related_person_id is the EXISTING person.
      
      if (['mother', 'father', 'parent'].includes(type)) {
        // New person (person_id) is the PARENT of existing person (related_person_id)
        g.setEdge(r.person_id, r.related_person_id, { type: 'parental' });
      } else if (['son', 'daughter', 'child'].includes(type)) {
        // New person (person_id) is the CHILD of existing person (related_person_id)
        g.setEdge(r.related_person_id, r.person_id, { type: 'parental' });
      } else if (['spouse', 'wife', 'husband'].includes(type)) {
        // Link spouses to keep them on the same rank
        g.setEdge(r.person_id, r.related_person_id, { type: 'spouse' });
      } else if (['brother', 'sister', 'sibling'].includes(type)) {
        // Link siblings to keep them together
        g.setEdge(r.person_id, r.related_person_id, { type: 'sibling' });
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
          points: edgeData.points,
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
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Our Living History</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-full">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="h-8 w-8 rounded-full"><ZoomOut className="w-4 h-4" /></Button>
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
                    d={`M ${edge.from.x} ${edge.from.y + 55} L ${edge.to.x} ${edge.to.y - 55}`}
                    stroke={edge.type === 'spouse' ? '#f87171' : edge.type === 'sibling' ? '#94a3b8' : '#e7e5e4'}
                    strokeWidth={edge.type === 'spouse' ? "3" : "2"}
                    strokeDasharray={edge.type === 'sibling' ? "5,5" : "0"}
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
                    left: node.x - 110, 
                    top: node.y - 55,
                    width: 220,
                    height: 110
                  }}
                  onClick={() => navigate(getPersonUrl(node.id, node.person.name))}
                  className="absolute bg-white rounded-2xl border-2 border-stone-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all p-4 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-stone-50 shrink-0 border-2 border-white shadow-inner">
                    {node.person.photoUrl ? (
                      <img src={node.person.photoUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-200">
                        <UserCircle className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{node.person.name.split(' ')[0]}</p>
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