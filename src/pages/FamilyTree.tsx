"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Target,
  Bug,
  Activity
} from 'lucide-react';
import { useTreeLayout } from '../hooks/use-tree-layout';
import PersonNode from '../components/tree/PersonNode';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();
  const [zoom, setZoom] = useState(0.8); // Increased default zoom
  const [showDebug, setShowDebug] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const constraintsRef = useRef<HTMLDivElement>(null);
  const { positions, connections, debug } = useTreeLayout(people, relationships);

  const me = useMemo(() => people.find(p => p.userId === user?.id) || people[0], [people, user]);

  if (loading) return <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center text-stone-400 font-serif italic text-xl">Loading the archive...</div>;

  return (
    <div className="min-h-screen bg-[#0c0a09] flex flex-col overflow-hidden select-none text-stone-100">
      <header className="bg-stone-900/80 backdrop-blur-md border-b border-stone-800 px-8 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full h-12 w-12 text-stone-500 hover:bg-stone-800">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">Family Tree</h1>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em]">Logical Grid View</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setShowDebug(!showDebug)}
            className={cn(
              "h-10 rounded-full border-stone-700 gap-2 text-xs font-bold px-4",
              showDebug ? "bg-amber-500 text-stone-900 border-amber-500" : "text-stone-400"
            )}
          >
            <Bug className="w-4 h-4" /> Debug
          </Button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden" ref={constraintsRef}>
        {/* Debug Panel */}
        {showDebug && (
          <div className="absolute top-8 right-8 z-50 w-72 bg-stone-900/90 backdrop-blur-xl border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Activity className="w-4 h-4" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">Diagnostics</h3>
            </div>
            <div className="space-y-2 font-mono text-[10px] text-stone-400">
              <div className="flex justify-between border-b border-stone-800 pb-1">
                <span>Nodes:</span>
                <span className="text-white">{positions.length}</span>
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-1">
                <span>Links:</span>
                <span className="text-white">{connections.length}</span>
              </div>
              <div className="pt-2 text-stone-500 italic break-all leading-relaxed">
                {debug}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-8 z-40 flex flex-col gap-2">
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="h-12 w-12 rounded-full bg-stone-900 border-stone-700 text-white shadow-lg"><ZoomIn className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))} className="h-12 w-12 rounded-full bg-stone-900 border-stone-700 text-white shadow-lg"><ZoomOut className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom(0.8)} className="h-12 w-12 rounded-full bg-stone-900 border-stone-700 text-white shadow-lg"><Maximize className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => { setZoom(1); setSelectedId(me?.id || null); }} className="h-12 w-12 rounded-full bg-amber-600 text-white border-none shadow-xl"><Target className="w-5 h-5" /></Button>
        </div>

        {/* Infinite Canvas */}
        <div className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center">
          <motion.div 
            drag 
            dragConstraints={constraintsRef} 
            animate={{ scale: zoom }} 
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="relative w-[1px] h-[1px]"
          >
            {/* SVG Link Layer */}
            <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ transform: 'translate(-50%, -50%)' }}>
              {connections.map(link => (
                <motion.path
                  key={link.id}
                  d={`M ${link.from.x} ${link.from.y} L ${link.to.x} ${link.to.y}`}
                  stroke={link.type === 'spouse' ? "#f59e0b" : "#44403c"}
                  strokeWidth={link.type === 'spouse' ? 3 : 1.5}
                  strokeDasharray={link.type === 'spouse' ? "5,5" : "0"}
                  fill="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                />
              ))}
            </svg>

            {/* People Layer */}
            {positions.map(pos => (
              <div 
                key={pos.id}
                className="absolute"
                style={{ 
                  left: pos.x - 96, // Center the 192px wide node
                  top: pos.y - 40,
                  zIndex: selectedId === pos.id ? 20 : 10
                }}
              >
                <PersonNode 
                  person={pos.person}
                  me={me}
                  relationships={relationships}
                  isSelected={pos.id === selectedId}
                  onSelect={(id) => setSelectedId(id)}
                  settings={{ showDates: true, showPlaces: false, showOccupation: false }}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 right-8 bg-stone-900/80 backdrop-blur-md p-4 rounded-2xl border border-stone-800 flex flex-col gap-3 z-40">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-600" />
          <span className="text-xs font-medium text-stone-400">Selected</span>
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