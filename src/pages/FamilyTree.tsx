"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Target,
  Sparkles,
  Info
} from 'lucide-react';
import { useTreeLayout } from '../hooks/use-tree-layout';
import PersonNode from '../components/tree/PersonNode';
import { motion, AnimatePresence } from 'framer-motion';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();
  const [zoom, setZoom] = useState(0.6);
  const [searchQuery, setSearchQuery] = useState('');
  const [centerId, setCenterId] = useState<string | null>(null);
  
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Default center to the logged-in user
  useEffect(() => {
    if (!centerId && people.length > 0) {
      const me = people.find(p => p.userId === user?.id);
      setCenterId(me?.id || people[0].id);
    }
  }, [people, user, centerId]);

  const { nodes, links } = useTreeLayout(people, relationships, centerId);

  if (loading || !centerId) return <div className="p-20 text-center text-xl font-serif italic text-stone-400">Aligning the stars...</div>;

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col overflow-hidden select-none text-stone-100">
      <header className="bg-stone-900/50 backdrop-blur-md border-b border-stone-800 px-8 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full h-12 w-12 text-stone-500 hover:bg-stone-800">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">Family Universe</h1>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em]">Radial Archive View</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <Input 
                placeholder="Find a star..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-stone-800 border-none rounded-2xl text-sm text-white focus:ring-amber-500/20"
              />
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              Click a person to center the universe
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden" ref={constraintsRef}>
        {/* Background Orbits */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className="absolute border border-stone-500 rounded-full" 
              style={{ width: i * 700, height: i * 700 }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-2">
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="h-12 w-12 rounded-full bg-stone-900 border-stone-700 text-white shadow-lg"><ZoomIn className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="h-12 w-12 rounded-full bg-stone-900 border-stone-700 text-white shadow-lg"><ZoomOut className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom(0.6)} className="h-12 w-12 rounded-full bg-stone-900 border-stone-700 text-white shadow-lg"><Maximize className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => { const me = people.find(p => p.userId === user?.id); if (me) setCenterId(me.id); setZoom(0.8); }} className="h-12 w-12 rounded-full bg-amber-600 text-white border-none shadow-xl"><Target className="w-5 h-5" /></Button>
        </div>

        {/* Infinite Canvas */}
        <div className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing flex items-center justify-center">
          <motion.div 
            drag 
            dragConstraints={constraintsRef} 
            animate={{ scale: zoom }} 
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="relative w-[1px] h-[1px]"
          >
            {/* SVG Link Layer */}
            <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ transform: 'translate(-50%, -50%)' }}>
              <AnimatePresence>
                {links.map(link => (
                  <motion.path
                    key={link.id}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    d={`M ${link.source.x} ${link.source.y} Q ${(link.source.x + link.target.x)/2 + 50} ${(link.source.y + link.target.y)/2 + 50}, ${link.target.x} ${link.target.y}`}
                    stroke={link.type === 'spouse' ? "#f59e0b" : "#78716c"}
                    strokeWidth={link.type === 'spouse' ? 3 : 1.5}
                    strokeDasharray={link.type === 'spouse' ? "5,5" : "0"}
                    fill="none"
                  />
                ))}
              </AnimatePresence>
            </svg>

            {/* People Layer */}
            {nodes.map(node => (
              <motion.div 
                key={node.id}
                layoutId={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: node.x, y: node.y }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="absolute"
                style={{ left: -100, top: -50 }} // Offset to center the 200px wide node
              >
                <PersonNode 
                  person={node.person}
                  me={people.find(p => p.userId === user?.id)}
                  relationships={relationships}
                  isSelected={node.id === centerId}
                  onSelect={(id) => setCenterId(id)}
                  settings={{ showDates: true, showPlaces: false, showOccupation: false }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 right-8 bg-stone-900/80 backdrop-blur-md p-4 rounded-2xl border border-stone-800 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-600" />
          <span className="text-xs font-medium text-stone-400">Center of Universe</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-0.5 bg-stone-600" />
          <span className="text-xs font-medium text-stone-400">Blood Line</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-amber-500" />
          <span className="text-xs font-medium text-stone-400">Marriage</span>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;