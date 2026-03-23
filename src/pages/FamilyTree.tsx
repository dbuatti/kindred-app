"use client";

import React, { useState, useRef, useMemo } from 'react';
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
  Target
} from 'lucide-react';
import { useTreeLayout } from '../hooks/use-tree-layout';
import PersonNode from '../components/tree/PersonNode';
import { motion } from 'framer-motion';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();
  const [zoom, setZoom] = useState(0.8);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const constraintsRef = useRef<HTMLDivElement>(null);
  const { positions, connections } = useTreeLayout(people, relationships);

  const me = useMemo(() => people.find(p => p.userId === user?.id) || people[0], [people, user]);

  if (loading) return <div className="p-20 text-center text-xl font-serif italic text-stone-400">Opening the archive...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col overflow-hidden select-none">
      <header className="bg-white border-b-4 border-stone-100 px-8 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full h-12 w-12 text-stone-400 hover:bg-stone-50">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-800">Family Tree</h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em]">Archive Schematic</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <Input 
                placeholder="Search names..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-stone-50 border-none rounded-2xl text-sm focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative bg-[#FDFCF9]" ref={constraintsRef}>
        {/* Controls */}
        <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-2">
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="h-12 w-12 rounded-full bg-white border-stone-200 shadow-lg"><ZoomIn className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="h-12 w-12 rounded-full bg-white border-stone-200 shadow-lg"><ZoomOut className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom(0.8)} className="h-12 w-12 rounded-full bg-white border-stone-200 shadow-lg"><Maximize className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => { if (me) setSelectedId(me.id); setZoom(1); }} className="h-12 w-12 rounded-full bg-amber-600 text-white border-none shadow-xl"><Target className="w-5 h-5" /></Button>
        </div>

        {/* Infinite Canvas */}
        <div className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing">
          <motion.div 
            drag 
            dragConstraints={constraintsRef} 
            animate={{ scale: zoom }} 
            className="relative min-w-[5000px] min-h-[3000px]"
            style={{ transformOrigin: 'center center' }}
          >
            {/* SVG Connection Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#e7e5e4" />
                </marker>
              </defs>
              {connections.map(conn => {
                const isSpouse = conn.type === 'spouse';
                return (
                  <path
                    key={conn.id}
                    d={isSpouse 
                      ? `M ${conn.from.x} ${conn.from.y} L ${conn.to.x} ${conn.to.y}`
                      : `M ${conn.from.x} ${conn.from.y} C ${conn.from.x} ${(conn.from.y + conn.to.y)/2}, ${conn.to.x} ${(conn.from.y + conn.to.y)/2}, ${conn.to.x} ${conn.to.y}`
                    }
                    stroke={isSpouse ? "#f59e0b" : "#e7e5e4"}
                    strokeWidth={isSpouse ? 3 : 2}
                    strokeDasharray={isSpouse ? "5,5" : "0"}
                    fill="none"
                  />
                );
              })}
            </svg>

            {/* People Layer */}
            {positions.map(pos => (
              <div 
                key={pos.id}
                className="absolute"
                style={{ 
                  left: `calc(50% + ${pos.x}px)`, 
                  top: `calc(20% + ${pos.y}px)`,
                  zIndex: 10
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
    </div>
  );
};

export default FamilyTree;