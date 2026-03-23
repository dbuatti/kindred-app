"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Bug,
  Settings2,
  LayoutGrid,
  Users,
  History
} from 'lucide-react';
import { getPersonUrl } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import { useTreeLayout, TreeMode } from '../hooks/use-tree-layout';
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
  
  // Chart Settings
  const [treeMode, setTreeMode] = useState<TreeMode>('all');
  const [chartSettings, setChartSettings] = useState({
    showDates: true,
    showPlaces: false,
    showOccupation: false
  });

  const constraintsRef = useRef<HTMLDivElement>(null);
  const { personLevels, rootClusters, getPeerCluster, filteredPeople } = useTreeLayout(people, relationships, treeMode, selectedPersonId);

  const me = useMemo(() => people.find(p => p.userId === user?.id) || people[0], [people, user]);

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
              <p className="text-stone-400 text-sm uppercase tracking-widest font-medium">
                {treeMode === 'all' ? 'All-in-one Chart' : treeMode === 'ancestors' ? 'Ancestors Chart' : 'Descendants Chart'}
              </p>
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
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-full border-stone-200 gap-2 text-stone-600">
                  <Settings2 className="w-4 h-4" /> Chart Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6 rounded-[2rem] border-none shadow-2xl bg-white space-y-6">
                <div className="space-y-4">
                  <h4 className="font-serif text-lg font-bold text-stone-800">Chart Format</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant={treeMode === 'all' ? 'default' : 'outline'} 
                      onClick={() => setTreeMode('all')}
                      className="justify-start gap-3 rounded-xl h-12"
                    >
                      <LayoutGrid className="w-4 h-4" /> All-in-one
                    </Button>
                    <Button 
                      variant={treeMode === 'ancestors' ? 'default' : 'outline'} 
                      onClick={() => setTreeMode('ancestors')}
                      disabled={!selectedPersonId}
                      className="justify-start gap-3 rounded-xl h-12"
                    >
                      <Users className="w-4 h-4" /> Ancestors Only
                    </Button>
                    <Button 
                      variant={treeMode === 'descendants' ? 'default' : 'outline'} 
                      onClick={() => setTreeMode('descendants')}
                      disabled={!selectedPersonId}
                      className="justify-start gap-3 rounded-xl h-12"
                    >
                      <History className="w-4 h-4" /> Descendants Only
                    </Button>
                  </div>
                  {!selectedPersonId && treeMode !== 'all' && (
                    <p className="text-[10px] text-amber-600 font-medium italic">Select a person to use this mode.</p>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <h4 className="font-serif text-lg font-bold text-stone-800">Display Facts</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-dates" className="text-sm text-stone-600">Show Dates</Label>
                      <Switch 
                        id="show-dates" 
                        checked={chartSettings.showDates} 
                        onCheckedChange={(val) => setChartSettings({...chartSettings, showDates: val})} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-places" className="text-sm text-stone-600">Show Places</Label>
                      <Switch 
                        id="show-places" 
                        checked={chartSettings.showPlaces} 
                        onCheckedChange={(val) => setChartSettings({...chartSettings, showPlaces: val})} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-occ" className="text-sm text-stone-600">Show Occupation</Label>
                      <Switch 
                        id="show-occ" 
                        checked={chartSettings.showOccupation} 
                        onCheckedChange={(val) => setChartSettings({...chartSettings, showOccupation: val})} 
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden bg-stone-50/30" ref={constraintsRef}>
        <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-2">
          <Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="h-12 w-12 rounded-full bg-white shadow-lg"><ZoomIn className="w-5 h-5" /></Button>
          <Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="h-12 w-12 rounded-full bg-white shadow-lg"><ZoomOut className="w-5 h-5" /></Button>
          <Button size="icon" variant="secondary" onClick={() => { setZoom(1); setHighlightedId(null); }} className="h-12 w-12 rounded-full bg-white shadow-lg"><Maximize className="w-5 h-5" /></Button>
          <Button size="icon" variant="secondary" onClick={() => { if (me) { setHighlightedId(me.id); setSelectedPersonId(me.id); setZoom(1); } }} className="h-12 w-12 rounded-full bg-amber-600 text-white shadow-lg border-2 border-white"><Target className="w-5 h-5" /></Button>
          <Button size="icon" variant="secondary" onClick={() => setShowDiagnostics(!showDiagnostics)} className={cn("h-12 w-12 rounded-full shadow-lg border-2 border-white", showDiagnostics ? "bg-red-600 text-white" : "bg-white text-red-600")}><Activity className="w-5 h-5" /></Button>
        </div>

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
                isFirstInRow={true}
                settings={chartSettings}
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