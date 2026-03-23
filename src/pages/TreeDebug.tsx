"use client";

import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Target, Activity, Terminal } from 'lucide-react';
import { useTreeLayout } from '../hooks/use-tree-layout';
import PersonNode from '../components/tree/PersonNode';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const TreeDebug = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();
  const [zoom, setZoom] = useState(0.6);
  const [showLogs, setShowLogs] = useState(true);
  
  const constraintsRef = useRef<HTMLDivElement>(null);
  const { positions, connections, debug } = useTreeLayout(people, relationships);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-stone-500 font-mono">LOADING_ARCHIVE...</div>;

  return (
    <div className="fixed inset-0 bg-[#0c0a09] overflow-hidden select-none text-white flex flex-col">
      {/* Floating Back Button */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/admin')} 
          className="rounded-full bg-stone-900/50 border-stone-800 text-stone-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="bg-stone-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-stone-800 flex items-center gap-3">
          <Terminal className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-mono font-bold tracking-tighter">TREE_DEBUG_MODE</span>
        </div>
      </div>

      {/* Full Screen Canvas */}
      <div className="flex-1 relative" ref={constraintsRef}>
        <div className="w-full h-full flex items-center justify-center">
          <motion.div 
            drag 
            dragMomentum={false}
            animate={{ scale: zoom }} 
            className="relative w-[1px] h-[1px]"
          >
            {/* SVG Link Layer */}
            <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ transform: 'translate(-50%, -50%)' }}>
              {connections.map(link => (
                <line
                  key={link.id}
                  x1={link.from.x}
                  y1={link.from.y}
                  x2={link.to.x}
                  y2={link.to.y}
                  stroke={link.type === 'spouse' ? "#f59e0b" : "#44403c"}
                  strokeWidth={link.type === 'spouse' ? 4 : 2}
                  strokeDasharray={link.type === 'spouse' ? "8,8" : "0"}
                  opacity={0.5}
                />
              ))}
            </svg>

            {/* People Layer */}
            {positions.map(pos => (
              <div 
                key={pos.id}
                className="absolute"
                style={{ 
                  left: pos.x - 96, 
                  top: pos.y - 40,
                }}
              >
                <PersonNode 
                  person={pos.person}
                  me={null}
                  relationships={relationships}
                  onSelect={(id) => console.log("[Debug] Selected:", id)}
                  settings={{ showDates: true, showPlaces: false, showOccupation: false }}
                  debugMode={true}
                  level={0}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-stone-900/90 backdrop-blur-xl p-2 rounded-2xl border border-stone-800 shadow-2xl">
        <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="text-stone-400 hover:text-white"><ZoomIn className="w-5 h-5" /></Button>
        <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))} className="text-stone-400 hover:text-white"><ZoomOut className="w-5 h-5" /></Button>
        <div className="w-px h-4 bg-stone-800 mx-1" />
        <Button size="icon" variant="ghost" onClick={() => setZoom(0.6)} className="text-stone-400 hover:text-white"><Maximize className="w-5 h-5" /></Button>
        <Button size="icon" variant="ghost" onClick={() => setZoom(1.0)} className="text-amber-500 hover:bg-amber-500/10"><Target className="w-5 h-5" /></Button>
      </div>

      {/* Log Panel */}
      {showLogs && (
        <div className="absolute top-6 right-6 z-50 w-64 bg-stone-900/90 backdrop-blur-xl border border-stone-800 rounded-2xl p-5 shadow-2xl space-y-4 font-mono text-[10px]">
          <div className="flex items-center justify-between text-amber-500 border-b border-stone-800 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              <span className="font-bold">SYSTEM_STATS</span>
            </div>
            <button onClick={() => setShowLogs(false)} className="text-stone-600 hover:text-white">×</button>
          </div>
          <div className="space-y-1.5 text-stone-400">
            <div className="flex justify-between"><span>NODES:</span><span className="text-white">{positions.length}</span></div>
            <div className="flex justify-between"><span>LINKS:</span><span className="text-white">{connections.length}</span></div>
            <div className="flex justify-between"><span>ZOOM:</span><span className="text-white">{zoom.toFixed(2)}x</span></div>
            <div className="pt-2 text-stone-600 italic border-t border-stone-800 mt-2">
              {debug}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreeDebug;