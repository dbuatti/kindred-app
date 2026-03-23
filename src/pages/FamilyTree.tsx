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
  Settings2,
  LayoutGrid,
  Users,
  History,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTreeLayout, TreeMode } from '../hooks/use-tree-layout';
import ClusterNode from '../components/tree/ClusterNode';
import { motion } from 'framer-motion';

const FamilyTree = () => {
  const navigate = useNavigate();
  const { people, loading, user, relationships } = useFamily();
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  
  // Chart Settings
  const [treeMode, setTreeMode] = useState<TreeMode>('all');
  const [chartSettings, setChartSettings] = useState({
    showDates: true,
    showPlaces: true,
    showOccupation: false
  });

  const constraintsRef = useRef<HTMLDivElement>(null);
  const { personLevels, rootClusters, getPeerCluster } = useTreeLayout(people, relationships, treeMode, selectedPersonId);

  const me = useMemo(() => people.find(p => p.userId === user?.id) || people[0], [people, user]);

  const lineageIds = useMemo(() => {
    if (!highlightedId) return new Set<string>();
    const ids = new Set<string>([highlightedId]);
    
    // Simple BFS to find immediate relatives for highlighting
    const queue = [highlightedId];
    const visited = new Set([highlightedId]);
    
    for (let i = 0; i < 2; i++) { // 2 levels of depth for highlighting
      const currentLevel = [...queue];
      queue.length = 0;
      currentLevel.forEach(id => {
        relationships.forEach(r => {
          const otherId = r.person_id === id ? r.related_person_id : (r.related_person_id === id ? r.person_id : null);
          if (otherId && !visited.has(otherId)) {
            visited.add(otherId);
            ids.add(otherId);
            queue.push(otherId);
          }
        });
      });
    }
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

  if (loading) return <div className="p-20 text-center text-2xl font-mono">INITIALIZING ARCHIVE...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden select-none font-mono">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{ 
          backgroundImage: 'radial-gradient(#000 1px, transparent 0)', 
          backgroundSize: '24px 24px' 
        }} 
      />

      <header className="bg-white border-b-2 border-stone-800 px-8 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/')} className="border-2 border-stone-800 rounded-none"><ArrowLeft className="w-5 h-5" /></Button>
            <div>
              <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Terminal className="w-5 h-5" /> ARCHIVE_TREE_V2.0
              </h1>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                MODE: {treeMode.toUpperCase()} | NODES: {people.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input 
                placeholder="SEARCH_NAME..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const found = people.find(p => p.name.toLowerCase().includes(e.target.value.toLowerCase()));
                  if (found) setHighlightedId(found.id);
                }}
                className="pl-10 h-10 bg-stone-50 border-2 border-stone-200 rounded-none text-xs focus:border-stone-800"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-2 border-stone-800 rounded-none gap-2 text-xs font-bold">
                  <Settings2 className="w-4 h-4" /> CONFIG
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6 rounded-none border-2 border-stone-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest border-b border-stone-100 pb-2">View Mode</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant={treeMode === 'all' ? 'default' : 'outline'} 
                      onClick={() => setTreeMode('all')}
                      className="justify-start gap-3 rounded-none h-10 text-xs border-2"
                    >
                      <LayoutGrid className="w-4 h-4" /> ALL_RELATIVES
                    </Button>
                    <Button 
                      variant={treeMode === 'ancestors' ? 'default' : 'outline'} 
                      onClick={() => setTreeMode('ancestors')}
                      disabled={!selectedPersonId}
                      className="justify-start gap-3 rounded-none h-10 text-xs border-2"
                    >
                      <Users className="w-4 h-4" /> ANCESTORS_ONLY
                    </Button>
                    <Button 
                      variant={treeMode === 'descendants' ? 'default' : 'outline'} 
                      onClick={() => setTreeMode('descendants')}
                      disabled={!selectedPersonId}
                      className="justify-start gap-3 rounded-none h-10 text-xs border-2"
                    >
                      <History className="w-4 h-4" /> DESCENDANTS_ONLY
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-widest border-b border-stone-100 pb-2">Data Fields</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold">SHOW_DATES</Label>
                      <Switch checked={chartSettings.showDates} onCheckedChange={(val) => setChartSettings({...chartSettings, showDates: val})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold">SHOW_PLACES</Label>
                      <Switch checked={chartSettings.showPlaces} onCheckedChange={(val) => setChartSettings({...chartSettings, showPlaces: val})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold">SHOW_OCCUPATION</Label>
                      <Switch checked={chartSettings.showOccupation} onCheckedChange={(val) => setChartSettings({...chartSettings, showOccupation: val})} />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden" ref={constraintsRef}>
        {/* Controls Overlay */}
        <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-2">
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="h-10 w-10 border-2 border-stone-800 rounded-none bg-white"><ZoomIn className="w-4 h-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="h-10 w-10 border-2 border-stone-800 rounded-none bg-white"><ZoomOut className="w-4 h-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => { setZoom(1); setHighlightedId(null); }} className="h-10 w-10 border-2 border-stone-800 rounded-none bg-white"><Maximize className="w-4 h-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => { if (me) { setHighlightedId(me.id); setSelectedPersonId(me.id); setZoom(1); } }} className="h-10 w-10 border-2 border-stone-800 rounded-none bg-amber-500 text-white"><Target className="w-4 h-4" /></Button>
        </div>

        <div className="w-full h-full overflow-hidden p-20 cursor-grab active:cursor-grabbing" onClick={() => { setHighlightedId(null); setSelectedPersonId(null); }}>
          <motion.div 
            drag 
            dragConstraints={constraintsRef} 
            animate={{ scale: zoom }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }} 
            className="flex flex-col items-center gap-48 min-w-max origin-top"
          >
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