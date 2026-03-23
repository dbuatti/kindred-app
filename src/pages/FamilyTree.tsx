"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  X,
  Target,
  Map as MapIcon,
  Activity,
  Bug
} from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import { useTreeLayout } from '../hooks/use-tree-layout';
import ClusterNode from '../components/tree/ClusterNode';
import TreeDiagnostics from '../components/TreeDiagnostics';
import { motion, AnimatePresence } from 'framer-motion';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  const constraintsRef = useRef<HTMLDivElement>(null);
  const { personLevels, rootClusters, getPeerCluster } = useTreeLayout(people, relationships);

  const me = useMemo(() => people.find(p => p.userId === user?.id) || people[0], [people, user]);
  const selectedPerson = useMemo(() => people.find(p => p.id === selectedPersonId), [people, selectedPersonId]);

  const lineageIds = useMemo(() => {
    if (!highlightedId) return new Set<string>();
    const ids = new Set<string>([highlightedId]);
    relationships.forEach(r => {
      if (r.person_id === highlightedId) ids.add(r.related_person_id);
      if (r.related_person_id === highlightedId) ids.add(r.person_id);
    });
    return ids;
  }, [highlightedId, relationships]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.1, 2));
      if (e.key === '-' || e.key === '_') setZoom(z => Math.max(z - 0.1, 0.5));
      if (e.key === '0') setZoom(1);
      if (e.key === 'm') setShowMinimap(prev => !prev);
      if (e.key === 'd') setShowDiagnostics(prev => !prev);
      if (e.key === 'b') setDebugMode(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) return <div className="p-20 text-center text-2xl font-serif">Mapping the branches...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] flex flex-col overflow-hidden select-none">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-8 py-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full text-stone-500"><ArrowLeft className="w-6 h-6" /></Button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800">Family Tree</h1>
              <p className="text-stone-400 text-sm uppercase tracking-widest font-medium">Our Living History</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input 
                placeholder="Find a relative..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const found = people.find(p => p.name.toLowerCase().includes(e.target.value.toLowerCase()));
                  if (found) setHighlightedId(found.id);
                }}
                className="pl-10 h-12 bg-stone-50 border-none rounded-xl text-sm"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><X className="w-4 h-4" /></button>}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setDebugMode(!debugMode)}
              className={cn("rounded-full border-stone-200 gap-2 hidden md:flex", debugMode ? "bg-stone-800 text-white" : "text-stone-600")}
            >
              <Bug className="w-4 h-4" /> Debug Mode
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden bg-stone-50/30" ref={constraintsRef}>
        {/* Generational Sidebar - Fixed to the left */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-white/40 backdrop-blur-sm border-r border-stone-100 z-20 hidden lg:flex flex-col items-center py-20 gap-[300px]">
          <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="h-px w-8 bg-stone-300" />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.4em] vertical-text">Elders</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="h-px w-8 bg-stone-300" />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.4em] vertical-text">Parents</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="h-px w-8 bg-stone-300" />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.4em] vertical-text">Children</span>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-2">
          <Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="h-12 w-12 rounded-full bg-white shadow-lg"><ZoomIn className="w-5 h-5" /></Button>
          <Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="h-12 w-12 rounded-full bg-white shadow-lg"><ZoomOut className="w-5 h-5" /></Button>
          <Button size="icon" variant="secondary" onClick={() => { setZoom(1); setHighlightedId(null); }} className="h-12 w-12 rounded-full bg-white shadow-lg"><Maximize className="w-5 h-5" /></Button>
          <Button size="icon" variant="secondary" onClick={() => { if (me) { setHighlightedId(me.id); setSelectedPersonId(me.id); setZoom(1); } }} className="h-12 w-12 rounded-full bg-amber-600 text-white shadow-lg border-2 border-white"><Target className="w-5 h-5" /></Button>
          <Button size="icon" variant="secondary" onClick={() => setShowMinimap(!showMinimap)} className={cn("h-12 w-12 rounded-full shadow-lg border-2 border-white", showMinimap ? "bg-stone-800 text-white" : "bg-white text-stone-800")}><MapIcon className="w-5 h-5" /></Button>
          <Button size="icon" variant="secondary" onClick={() => setShowDiagnostics(!showDiagnostics)} className={cn("h-12 w-12 rounded-full shadow-lg border-2 border-white", showDiagnostics ? "bg-red-600 text-white" : "bg-white text-red-600")}><Activity className="w-5 h-5" /></Button>
        </div>

        {/* Main Tree Canvas */}
        <div className="w-full h-full overflow-hidden p-20 cursor-grab active:cursor-grabbing" onClick={() => { setHighlightedId(null); setSelectedPersonId(null); }}>
          <motion.div drag dragConstraints={constraintsRef} animate={{ scale: zoom }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex flex-col items-center gap-48 min-w-max origin-top">
            {rootClusters.map((cluster, idx) => (
              <ClusterNode 
                key={idx} 
                members={cluster} 
                level={personLevels[cluster[0].id]} 
                people={people}
                relationships={relationships}
                personLevels={personLevels}
                lineageIds={lineageIds}
                highlightedId={highlightedId}
                selectedPersonId={selectedPersonId}
                me={me}
                debugMode={debugMode}
                onSelect={(id) => { setHighlightedId(id); setSelectedPersonId(id); }}
                getPeerCluster={getPeerCluster}
              />
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        .vertical-text { writing-mode: vertical-rl; text-orientation: mixed; }
      `}</style>
    </div>
  );
};

export default FamilyTree;