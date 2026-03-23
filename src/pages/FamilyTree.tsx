"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Share2, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  X,
  Target,
  Map as MapIcon,
  MessageSquare,
  Calendar,
  MapPin,
  Briefcase,
  ExternalLink,
  Activity,
  UserCircle,
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
  const maxLevel = useMemo(() => Math.max(0, ...Object.values(personLevels)), [personLevels]);

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
        {/* Generational Labels */}
        <div className="absolute left-0 top-0 bottom-0 w-32 border-r border-stone-100/50 bg-white/20 backdrop-blur-sm z-20 hidden lg:flex flex-col items-center py-20 gap-48">
          {Array.from({ length: maxLevel + 1 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-px w-8 bg-stone-200" />
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] vertical-text">
                {i === 0 ? "Elders" : i === 1 ? "Parents" : i === 2 ? "Children" : `Gen ${i + 1}`}
              </span>
            </div>
          ))}
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

        {/* Backdrop for Sidebars */}
        <AnimatePresence>
          {(selectedPersonId || showDiagnostics) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedPersonId(null); setShowDiagnostics(false); }}
              className="absolute inset-0 bg-stone-900/20 backdrop-blur-[2px] z-40"
            />
          )}
        </AnimatePresence>

        {/* Diagnostics Overlay */}
        <AnimatePresence>
          {showDiagnostics && (
            <motion.div 
              initial={{ x: -400, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -400, opacity: 0 }} 
              className="absolute top-0 left-0 bottom-0 w-full md:w-[450px] bg-white shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)] z-50 border-r border-stone-200 overflow-y-auto p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-red-600" />
                  <h2 className="text-2xl font-serif font-bold text-stone-800">Diagnostics</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowDiagnostics(false)} className="rounded-full hover:bg-stone-100"><X className="w-6 h-6" /></Button>
              </div>
              <TreeDiagnostics />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimap */}
        <AnimatePresence>
          {showMinimap && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute bottom-8 right-8 w-48 h-48 bg-white/80 backdrop-blur-md border-2 border-stone-100 rounded-3xl shadow-2xl z-30 overflow-hidden p-4 pointer-events-none">
              <div className="w-full h-full relative opacity-40">
                <div className="flex flex-col items-center gap-4 scale-[0.15] origin-top">
                  {rootClusters.map((cluster, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-8">
                      <div className="flex gap-4">{cluster.map(p => <div key={p.id} className="h-10 w-10 rounded-full bg-stone-400" />)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 border-2 border-amber-500/30 rounded-3xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Person Sidebar */}
        <AnimatePresence>
          {selectedPerson && (
            <motion.div 
              initial={{ x: 400, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 400, opacity: 0 }} 
              className="absolute top-0 right-0 bottom-0 w-full md:w-[400px] bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.3)] z-50 border-l border-stone-200 overflow-y-auto custom-scrollbar"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedPersonId(null)} className="rounded-full hover:bg-stone-100"><X className="w-6 h-6" /></Button>
                  <Button variant="ghost" onClick={() => navigate(getPersonUrl(selectedPerson.id, selectedPerson.name))} className="text-amber-600 hover:bg-amber-50 rounded-full gap-2 font-bold text-xs uppercase tracking-widest">Full Profile <ExternalLink className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="h-40 w-40 rounded-full overflow-hidden border-8 border-stone-50 shadow-2xl ring-1 ring-stone-200">
                    {selectedPerson.photoUrl ? <img src={selectedPerson.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300"><UserCircle className="w-20 h-20" /></div>}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif font-bold text-stone-800">{selectedPerson.name}</h2>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-[0.3em]">Family Member</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 pt-4">
                  {selectedPerson.birthYear && (
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Born</span>
                        <span className="text-stone-800 font-medium">{selectedPerson.birthYear}</span>
                      </div>
                    </div>
                  )}
                  {selectedPerson.birthPlace && (
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Place</span>
                        <span className="text-stone-800 font-medium">{selectedPerson.birthPlace}</span>
                      </div>
                    </div>
                  )}
                  {selectedPerson.occupation && (
                    <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Occupation</span>
                        <span className="text-stone-800 font-medium">{selectedPerson.occupation}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2 border-b border-stone-100 pb-2">
                    <MessageSquare className="w-4 h-4" /> Recent Stories
                  </h3>
                  <div className="space-y-4">
                    {selectedPerson.memories.length === 0 ? (
                      <p className="text-stone-400 text-sm italic text-center py-4">No stories shared yet.</p>
                    ) : (
                      selectedPerson.memories.slice(0, 3).map(m => (
                        <div key={m.id} className="p-5 bg-white border border-stone-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-stone-600 italic font-serif leading-relaxed">"{m.content}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tree Canvas */}
        <div className="w-full h-full overflow-hidden p-20 cursor-grab active:cursor-grabbing" onClick={() => { setHighlightedId(null); setSelectedPersonId(null); }}>
          <motion.div drag dragConstraints={constraintsRef} animate={{ scale: zoom }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex flex-col items-center gap-32 min-w-max origin-top">
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
                onSelect={(id) => { setHighlightedId(id); setSelectedPersonId(id); }}
                getPeerCluster={getPeerCluster}
                debugMode={debugMode}
              />
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        .vertical-text { writing-mode: vertical-rl; text-orientation: mixed; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default FamilyTree;