"use client";

import React, { useState, useRef, useMemo } from 'react';
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
  Target,
  Settings2,
  LayoutGrid,
  Users,
  History,
  Bug
} from 'lucide-react';
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
  const [debugMode, setDebugMode] = useState(false);
  
  const [treeMode, setTreeMode] = useState<TreeMode>('all');
  const [chartSettings, setChartSettings] = useState({
    showDates: true,
    showPlaces: false,
    showOccupation: false
  });

  const constraintsRef = useRef<HTMLDivElement>(null);
  const { personLevels, rootClusters } = useTreeLayout(people, relationships, treeMode, selectedPersonId);

  const me = useMemo(() => people.find(p => p.userId === user?.id) || people[0], [people, user]);

  // Find the "true" roots (people with no parents in the current view)
  const topLevelClusters = useMemo(() => {
    return rootClusters.filter(cluster => {
      return !cluster.some(member => {
        return relationships.some(r => {
          const type = r.relationship_type.toLowerCase();
          const isParentRel = ['mother', 'father', 'parent'].includes(type);
          const isChildRel = ['son', 'daughter', 'child'].includes(type);
          
          // If someone is a child of another person in the tree, this cluster isn't a root
          if (r.related_person_id === member.id && isParentRel) return true;
          if (r.person_id === member.id && isChildRel) return true;
          return false;
        });
      });
    });
  }, [rootClusters, relationships]);

  const lineageIds = useMemo(() => {
    if (!highlightedId) return new Set<string>();
    const ids = new Set<string>([highlightedId]);
    return ids;
  }, [highlightedId]);

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const found = people.find(p => p.name.toLowerCase().includes(e.target.value.toLowerCase()));
                  if (found) setHighlightedId(found.id);
                }}
                className="pl-12 h-12 bg-stone-50 border-none rounded-2xl text-sm focus:ring-amber-500/20"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-12 rounded-2xl border-stone-200 gap-2 text-xs font-bold text-stone-600 px-6">
                  <Settings2 className="w-4 h-4" /> View Options
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-6 rounded-[2rem] border-none shadow-2xl bg-white space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Tree Mode</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant={treeMode === 'all' ? 'default' : 'outline'} onClick={() => setTreeMode('all')} className="justify-start gap-3 rounded-xl h-10 text-xs">
                      <LayoutGrid className="w-4 h-4" /> Full Tree
                    </Button>
                    <Button variant={treeMode === 'ancestors' ? 'default' : 'outline'} onClick={() => setTreeMode('ancestors')} disabled={!selectedPersonId} className="justify-start gap-3 rounded-xl h-10 text-xs">
                      <Users className="w-4 h-4" /> Ancestors
                    </Button>
                    <Button variant={treeMode === 'descendants' ? 'default' : 'outline'} onClick={() => setTreeMode('descendants')} disabled={!selectedPersonId} className="justify-start gap-3 rounded-xl h-10 text-xs">
                      <History className="w-4 h-4" /> Descendants
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-stone-50">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Display</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-stone-600">Show Dates</Label>
                      <Switch checked={chartSettings.showDates} onCheckedChange={(val) => setChartSettings({...chartSettings, showDates: val})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-stone-600 flex items-center gap-2">
                        <Bug className="w-3 h-3" /> Debug Mode
                      </Label>
                      <Switch checked={debugMode} onCheckedChange={setDebugMode} />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <div className="flex-1 relative" ref={constraintsRef}>
        <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-2">
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="h-12 w-12 rounded-full bg-white border-stone-200 shadow-lg"><ZoomIn className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="h-12 w-12 rounded-full bg-white border-stone-200 shadow-lg"><ZoomOut className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => { setZoom(1); setHighlightedId(null); }} className="h-12 w-12 rounded-full bg-white border-stone-200 shadow-lg"><Maximize className="w-5 h-5" /></Button>
          <Button size="icon" variant="outline" onClick={() => { if (me) { setHighlightedId(me.id); setSelectedPersonId(me.id); setZoom(1); } }} className="h-12 w-12 rounded-full bg-amber-600 text-white border-none shadow-xl"><Target className="w-5 h-5" /></Button>
        </div>

        <div className="w-full h-full overflow-auto p-20 cursor-grab active:cursor-grabbing" onClick={() => { setHighlightedId(null); setSelectedPersonId(null); }}>
          <motion.div 
            drag 
            dragConstraints={constraintsRef} 
            animate={{ scale: zoom }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }} 
            className="flex flex-col items-center gap-32 min-w-max origin-top"
          >
            {topLevelClusters.map((cluster, idx) => (
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
                settings={chartSettings}
                debugMode={debugMode}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;